import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {AuthGuard} from '@/components/layout/AuthGuard';
import {AdminLayout} from '@/components/layout/AdminLayout';
import {useAuthStore} from '@/stores/authStore';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import api,{getErrorMessage} from '@/lib/api';
import {postFinancialOperation} from '@/lib/financial-intent';

type FoundingMember={can_renew:boolean;requires_policy_confirmation:boolean;renewal_block_reason:string|null;effective_benefit_mode:'six_payments'|'six_calendar_months'|null;id:string;user_id:string;display_name:string;member_number:number;current_cycle:number;effective_status:'active'|'lost'|'expired';activated_on:string;paid_through:string;benefit_ends_on:string};
type Client={id:string;display_name:string;phone?:string;email?:string};
type Campaign={members:FoundingMember[];acquired:number;capacity:number};
type PaymentResult={memberNumber:number;cycle:number;replayed?:boolean};
const dateLabel=(value:string)=>new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value.slice(0,10)+'T12:00:00Z'));
const statuses={active:'Beneficio activo',lost:'Beneficio perdido',expired:'Beneficio finalizado'};

export function Founding50Content(){
 const cache=useQueryClient();
 const campaign=useQuery<Campaign>({queryKey:['founding50'],queryFn:async()=>(await api.get('/founding50')).data,staleTime:0});
 const [adding,setAdding]=useState(false),[search,setSearch]=useState(''),[submittedSearch,setSubmittedSearch]=useState('');
 const [person,setPerson]=useState<Client|null>(null),[renewing,setRenewing]=useState<FoundingMember|null>(null);
 const [method,setMethod]=useState('cash'),[reference,setReference]=useState(''),[proof,setProof]=useState<string|null>(null),[proofName,setProofName]=useState('');
 const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const clients=useQuery<Client[]>({queryKey:['founding50-clients',submittedSearch],queryFn:async()=>(await api.get('/checkin/search',{params:{search:submittedSearch}})).data.members,enabled:adding&&submittedSearch.length>=2});
 const reset=()=>{setPerson(null);setRenewing(null);setAdding(false);setSearch('');setSubmittedSearch('');setReference('');setProof(null);setProofName('');setMethod('cash');setError('');};
 const choose=(client:Client,member:FoundingMember|null)=>{setPerson(client);setRenewing(member);setAdding(false);setMethod('cash');setReference('');setProof(null);setProofName('');setError('');setNotice('');};
 async function upload(file:File|undefined){
  if(!file||!person)return;setProof(null);setProofName('');setError('');
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||file.size>5*1024*1024){setError('Elige un comprobante JPG, PNG, WebP o PDF de máximo 5 MB.');return;}
  setUploading(true);try{const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('No pudimos leer el archivo.'));r.readAsDataURL(file);});const result=await api.post('/founding50/proofs',{userId:person.id,file_data:data,file_name:file.name});setProof(result.data.mediaId);setProofName(file.name);}catch(e){setError(getErrorMessage(e));}finally{setUploading(false);}
 }
 async function submit(){
  if(!person||busy||uploading||(method!=='cash'&&!reference.trim())||(method==='transfer'&&!proof))return;
  setBusy(true);setError('');setNotice('');try{
   const result=await postFinancialOperation<PaymentResult>('/founding50/payments',{userId:person.id,amount:1299,paymentMethod:method,expectedCycle:renewing?.current_cycle??0,...(method!=='cash'?{reference:reference.trim()}:{}),...(method==='transfer'?{proofMediaId:proof}:{})});
   setNotice(result.data.replayed?'Este pago ya estaba registrado. No se duplicó.':`Pago registrado. Miembro ${String(result.data.memberNumber).padStart(2,'0')} · periodo ${result.data.cycle}.`);reset();await cache.invalidateQueries({queryKey:['founding50']});
  }catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}
 }
 if(campaign.isLoading)return <section aria-label="Cargando Founding 50" aria-busy="true" className="space-y-6"><Skeleton className="h-10 w-48"/><Skeleton className="h-24 w-full"/><Skeleton className="h-52 w-full"/></section>;
 if(campaign.isError)return <section className="space-y-4"><h1 className="font-heading text-3xl">Founding 50</h1><p role="alert">No pudimos consultar Founding 50. {getErrorMessage(campaign.error)}</p><Button onClick={()=>void campaign.refetch()}>Volver a consultar</Button></section>;
 const data=campaign.data!;
 return <div className="space-y-8">
  <header className="space-y-5 border-b border-border pb-6">
   <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-muted-foreground">Comunidad fundadora</p><h1 className="mt-2 font-heading text-3xl">Founding 50</h1></div><p className="text-sm tabular-nums text-muted-foreground">{data.acquired} de {data.capacity} lugares adquiridos</p></div>
   <p className="max-w-prose leading-relaxed"><strong className="font-medium">Unlimited · $1,299 MXN al mes.</strong> Precio especial durante seis meses desde la activación, con membresía activa y pagos consecutivos.</p>
   <div className="flex flex-wrap items-center gap-4"><Button className="min-h-11" disabled={data.acquired>=data.capacity||busy||uploading} onClick={()=>{reset();setAdding(true);setNotice('');}}>Registrar primer pago</Button><p className="max-w-prose text-sm text-muted-foreground">El primer pago validado asegura el lugar. El beneficio es personal e intransferible.</p></div>
   {data.acquired>=data.capacity&&<p className="text-sm">Los lugares de lanzamiento ya fueron adquiridos. Las renovaciones conservan su revisión habitual.</p>}
  </header>
  {notice&&<p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-4">{notice}</p>}
  {(adding||person)&&<section aria-labelledby="founding-payment-title" className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="founding-payment-title" className="font-heading text-2xl">{renewing?'Registrar renovación':'Primer pago Founding'}</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">Registra un pago ya recibido y validado por el studio. Esta acción no realiza cargos ni transferencias.</p></div><Button variant="ghost" disabled={busy||uploading} onClick={reset}>Cerrar formulario</Button></div>
   {adding&&<><form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={e=>{e.preventDefault();setSubmittedSearch(search.trim());}}><label className="grid flex-1 gap-2 text-sm">Buscar persona<Input className="min-h-11 text-base" value={search} onChange={e=>setSearch(e.target.value)} minLength={2} maxLength={100} placeholder="Nombre o teléfono" required/></label><Button type="submit" className="min-h-11" disabled={clients.isFetching}>Buscar</Button></form>
    {clients.isFetching&&<p role="status">Buscando personas…</p>}{clients.isError&&<p role="alert">No pudimos consultar la búsqueda. <button className="underline" onClick={()=>void clients.refetch()}>Volver a buscar</button></p>}
    {clients.data?.length===0&&<p>No encontramos personas con esos datos. Revisa el nombre o teléfono.</p>}
    <ul className="divide-y divide-border">{clients.data?.map(client=>{const member=data.members.find(m=>m.user_id===client.id);return <li key={client.id}><button className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 py-3 text-left disabled:opacity-60" disabled={!!member} onClick={()=>choose(client,null)}><span>{client.display_name}<small className="block text-muted-foreground">{client.phone}</small></span><span className="text-sm text-primary">{member?'Ya pertenece al historial Founding':'Seleccionar'}</span></button></li>;})}</ul></>}
   {person&&<form className="space-y-5" onSubmit={e=>{e.preventDefault();void submit();}}>
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4"><div><h3 className="font-medium">{person.display_name}</h3><p className="text-sm text-muted-foreground">{renewing?`Miembro ${String(renewing.member_number).padStart(2,'0')} · ${renewing.current_cycle} periodo(s) registrado(s)`:'Nuevo lugar, sujeto a disponibilidad al confirmar'}</p></div><p className="font-heading text-2xl tabular-nums">$1,299 <span className="text-sm font-body">MXN</span></p></div>
    <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">Método de pago<select className="min-h-11 rounded-md border bg-background px-3 text-base" value={method} onChange={e=>{setMethod(e.target.value);setError('');}} disabled={busy||uploading}><option value="cash">Efectivo recibido</option><option value="transfer">Transferencia recibida</option><option value="card">Tarjeta cobrada en el studio</option></select></label>{method!=='cash'&&<label className="grid gap-2 text-sm">Folio del pago<Input className="min-h-11 text-base" value={reference} onChange={e=>setReference(e.target.value)} maxLength={100} required disabled={busy||uploading}/></label>}</div>
    {method==='transfer'&&<div className="space-y-2"><label className="grid gap-2 text-sm">Comprobante de transferencia<Input className="h-auto min-h-11 py-3 text-base" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={busy||uploading} onChange={e=>void upload(e.target.files?.[0])}/></label><p className="text-sm text-muted-foreground">JPG, PNG, WebP o PDF. Máximo 5 MB. Confirma los datos del comprobante antes de registrar el pago.</p>{uploading&&<p role="status">Guardando comprobante…</p>}{proof&&<p className="break-all text-sm">Comprobante adjuntado: {proofName}</p>}</div>}
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={busy||uploading||(method!=='cash'&&!reference.trim())||(method==='transfer'&&!proof)}>{busy?'Registrando…':'Registrar pago recibido'}</Button>
   </form>}
  </section>}
  <section aria-labelledby="founding-members-title"><h2 id="founding-members-title" className="font-heading text-2xl">Miembros fundadores</h2>{!data.members.length?<p className="py-8 text-muted-foreground">Todavía no hay pagos Founding registrados.</p>:<ol className="mt-4 divide-y divide-border border-y border-border">{data.members.map(member=><li key={member.id} className="grid gap-4 py-5 sm:grid-cols-[3rem_1fr_auto]">
   <span className="font-heading text-2xl tabular-nums text-muted-foreground">{String(member.member_number).padStart(2,'0')}</span><div className="space-y-2"><div className="flex flex-wrap items-center gap-x-4 gap-y-1"><h3 className="font-medium">{member.display_name}</h3><span className="text-sm text-muted-foreground">{statuses[member.effective_status]||'En revisión'}</span></div><p className="text-sm text-muted-foreground">{member.current_cycle} periodo(s) registrado(s) · Pagado hasta {dateLabel(member.paid_through)}</p><p className="text-sm text-muted-foreground">Beneficio desde {dateLabel(member.activated_on)} hasta {dateLabel(member.benefit_ends_on)}</p>{member.effective_status==='lost'&&<p className="text-sm">Al interrumpirse el beneficio, aplica el precio regular vigente.</p>}{!member.can_renew&&member.renewal_block_reason&&<p className="text-sm">{member.renewal_block_reason}</p>}{member.requires_policy_confirmation&&<p className="text-sm text-muted-foreground">Un administrador debe confirmar la duración del beneficio en Operación y pendientes.</p>}{member.effective_benefit_mode&&<p className="text-sm text-muted-foreground">Regla aplicada: {member.effective_benefit_mode==='six_payments'?'seis pagos consecutivos':'seis meses de calendario'}.</p>}</div>
   {member.can_renew===true&&<Button variant="outline" className="min-h-11 self-start" aria-label={`Registrar renovación de ${member.display_name}`} disabled={busy||uploading} onClick={()=>choose({id:member.user_id,display_name:member.display_name},member)}>Registrar renovación</Button>}
  </li>)}</ol>}</section>
 </div>;
}
export default function Founding50(){
 const {user,logout}=useAuthStore();
 const content=<Founding50Content/>;
 return <AuthGuard requiredRoles={['admin','super_admin','reception']}>{user?.role==='reception'?<main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-10"><div className="mx-auto max-w-5xl space-y-8"><header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"><Link className="underline" to="/admin/bookings">Volver a llegadas</Link><Button variant="ghost" onClick={()=>void logout()}>Cerrar sesión</Button></header>{content}</div></main>:<AdminLayout>{content}</AdminLayout>}</AuthGuard>;
}
