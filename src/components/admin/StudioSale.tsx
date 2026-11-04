import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import api,{getErrorMessage} from '@/lib/api';
import {postFinancialOperation} from '@/lib/financial-intent';
import {useActivePlans} from '@/hooks/use-active-plans';
import {Button} from '@/components/ui/button';
import {useDebounce} from '@/hooks/useDebounce';

export function StudioSale({userId,onSuccess}:{userId?:string;onSuccess?:()=>void}){
 const plans=useActivePlans();const cache=useQueryClient();
 const [search,setSearch]=useState('');const query=useDebounce(search,300);
 const [client,setClient]=useState(userId||'');const [plan,setPlan]=useState('');
 const [method,setMethod]=useState('cash');const [reference,setReference]=useState('');
 const [declaration,setDeclaration]=useState(false);const [received,setReceived]=useState(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [done,setDone]=useState(false);
 const users=useQuery({queryKey:['studio-sale-users',query],enabled:!userId&&query.length>=2,queryFn:async()=>{
  const {data}=await api.get('/users?role=client&limit=20&search='+encodeURIComponent(query));
  return (Array.isArray(data)?data:data.users||data.data||[]) as {id:string;display_name:string;email:string}[];
 }});
 const selected=plans.data?.find(p=>p.id===plan);
 const field='min-h-11 w-full rounded-md border bg-background p-3';
 if(done)return <div role="status" className="space-y-3 py-4"><h3 className="text-xl">Plan asignado y pago registrado</h3><p>El paquete ya está activo en la cuenta del cliente. Puedes consultar el pago en Órdenes.</p></div>;
 return <form className="space-y-4" onSubmit={async e=>{
  e.preventDefault();if(busy||!client||!plan||!received||!declaration)return;
  setBusy(true);setError('');
  try{
   await postFinancialOperation('/memberships/assign',{userId:client,planId:plan,status:'active',paymentMethod:method,
    ...(method!=='cash'?{paymentReference:reference.trim()}:{}),inPersonDeclaration:true});
   await Promise.all(['users','memberships','orders','payments'].map(key=>cache.invalidateQueries({queryKey:[key]})));
   setDone(true);onSuccess?.();
  }catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}
 }}>
 <p className="text-sm text-muted-foreground">Registra el pago que recibiste en el estudio. El plan se activa hoy con sus créditos y vigencia.</p>
 {!userId&&<><label className="block space-y-1">Buscar cliente<input className={field} value={search} onChange={e=>{setSearch(e.target.value);setClient('');}} placeholder="Nombre o correo" /></label>
 <label className="block space-y-1">Cliente<select className={field} required value={client} onChange={e=>setClient(e.target.value)}><option value="">Selecciona al cliente</option>{users.data?.map(u=><option key={u.id} value={u.id}>{u.display_name} · {u.email}</option>)}</select></label>{users.isError&&<p role="alert">No se pudieron cargar los clientes.</p>}</>}
 <label className="block space-y-1">Paquete<select className={field} required value={plan} onChange={e=>setPlan(e.target.value)}><option value="">Selecciona un paquete</option>{plans.data?.map(p=><option key={p.id} value={p.id}>{p.name} · ${p.price}</option>)}</select></label>
 {plans.isError&&<p role="alert">No se pudieron cargar los paquetes.</p>}
 <label className="block space-y-1">Método de pago recibido<select className={field} value={method} onChange={e=>setMethod(e.target.value)}><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta cobrada en terminal</option></select></label>
 {method!=='cash'&&<label className="block space-y-1">Folio del pago<input className={field} required maxLength={255} value={reference} onChange={e=>setReference(e.target.value)}/></label>}
 {selected&&<p className="rounded-md bg-muted p-3">Total recibido: <strong>${selected.price} MXN</strong></p>}
 <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={received} onChange={e=>setReceived(e.target.checked)} required/>Confirmo que recibí el pago completo en el estudio.</label>
 <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={declaration} onChange={e=>setDeclaration(e.target.checked)} required/>Confirmo que el cliente entregó su declaración de salud presencial para esta compra. Quedará registrado que yo lo verifiqué.</label>
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 <Button type="submit" className="w-full" disabled={busy||!client||!plan||!received||!declaration}>{busy?'Registrando…':'Registrar pago y activar plan'}</Button>
 </form>;
}
