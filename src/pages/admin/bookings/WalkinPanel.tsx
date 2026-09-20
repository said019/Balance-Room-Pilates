import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import api,{getErrorMessage} from '@/lib/api';
import {postFinancialOperation} from '@/lib/financial-intent';
type Person={id:string;display_name:string};
type Session={id:string;class_type_name:string;start_time:string;status:string;current_bookings:number;max_capacity:number};
type Plan={id:string;name:string;price:number;is_active:boolean};
export default function WalkinPanel({person:initial,onDone}:{person?:Person;onDone:()=>void}){
 const[person,setPerson]=useState(initial),[name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState('');
 const[classId,setClassId]=useState(''),[planId,setPlanId]=useState(''),[paid,setPaid]=useState(false),[saleDone,setSaleDone]=useState(false),[bookingId,setBookingId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const sessions=useQuery<Session[]>({queryKey:['walkin-classes',today],queryFn:async()=>(await api.get('/classes',{params:{start:today,end:today}})).data});
 const plans=useQuery<Plan[]>({queryKey:['walkin-plans'],queryFn:async()=>(await api.get('/plans')).data});
 const plan=plans.data?.find(p=>p.id===planId);
 async function run(fn:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await fn();}catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}}
 return <section className="space-y-5 rounded-xl border border-border p-5" aria-label="Llegada sin reserva">
  <h2 className="font-heading text-2xl">Llegada sin reserva</h2><p className="text-sm text-muted-foreground">Selecciona una clase de hoy. La reserva requiere saldo o un paquete pagado; el cupo se confirma al reservar.</p>
  {!person?<form className="grid gap-3" onSubmit={e=>{e.preventDefault();void run(async()=>{const r=await api.post('/users',{displayName:name,email,phone});setPerson(r.data.user);setNotice('Cuenta creada. Continúa con la clase.');});}}>
   <label>Nombre<Input required minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label><label>Correo<Input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Teléfono<Input type="tel" required minLength={8} value={phone} onChange={e=>setPhone(e.target.value)}/></label><Button disabled={busy} type="submit">Crear cuenta y continuar</Button>
  </form>:<><h3 className="font-medium">{person.display_name}</h3>
   <label className="grid gap-2">Clase de hoy<select className="min-h-11 rounded border bg-background px-3" value={classId} disabled={busy||!!bookingId} onChange={e=>setClassId(e.target.value)}><option value="">Selecciona una clase</option>{sessions.data?.filter(c=>c.status==='scheduled').map(c=><option key={c.id} value={c.id} disabled={c.current_bookings>=c.max_capacity}>{c.start_time.slice(0,5)} · {c.class_type_name} · {c.max_capacity-c.current_bookings} lugares</option>)}</select></label>
   <details className="border-y py-3"><summary className="cursor-pointer py-2">¿Necesita comprar un paquete?</summary><p className="my-3 text-sm">Registra únicamente efectivo ya recibido. No realiza cargos. La compra no garantiza cupo; una reserva fallida conserva el paquete para otra clase. Founding 50 se gestiona en su sección.</p>
    <label className="grid gap-2">Paquete<select className="min-h-11 rounded border bg-background px-3" value={planId} disabled={busy||saleDone} onChange={e=>{setPlanId(e.target.value);setPaid(false);}}><option value="">Selecciona un paquete</option>{plans.data?.filter(p=>p.is_active).map(p=><option key={p.id} value={p.id}>{p.name} · ${Number(p.price).toLocaleString('es-MX')} MXN</option>)}</select></label>
    <label className="my-4 flex items-start gap-3"><input type="checkbox" checked={paid} disabled={busy||saleDone} onChange={e=>setPaid(e.target.checked)}/><span>Confirmo que recibí ${plan?Number(plan.price).toLocaleString('es-MX'):'—'} MXN en efectivo.</span></label>
    <Button type="button" disabled={busy||saleDone||!paid||!plan} onClick={()=>void run(async()=>{await postFinancialOperation('/memberships/assign-cash',{userId:person.id,planId:plan!.id,amountPaid:Number(plan!.price),paymentMethod:'cash'});setSaleDone(true);setNotice('Pago registrado. Continúa para reservar y registrar la llegada.');})}>{saleDone?'Pago registrado':'Registrar efectivo recibido'}</Button>
   </details>
   <Button type="button" disabled={busy||!classId} onClick={()=>void run(async()=>{let id=bookingId;if(!id){const r=await api.post('/bookings/admin-book',{userId:person.id,classId});id=r.data.id;setBookingId(id);}await api.post('/checkin/manual',{bookingId:id});setNotice('Reserva y asistencia registradas.');onDone();})}>{busy?'Procesando…':bookingId?'Reintentar asistencia':'Reservar y registrar asistencia'}</Button>
  </>}
  {(sessions.isError||plans.isError)&&<p role="alert">No pudimos cargar clases o paquetes. <button className="underline" onClick={()=>{void sessions.refetch();void plans.refetch();}}>Volver a cargar</button></p>}
  {error&&<p role="alert" className="text-destructive">{error}{bookingId?' La reserva ya está creada; reintenta sólo la asistencia.':''}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
