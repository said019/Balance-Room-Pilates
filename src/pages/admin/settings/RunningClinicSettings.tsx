import {useState,useEffect} from 'react';
import {useQuery,useMutation} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import api,{getErrorMessage} from '@/lib/api';
import {Button} from '@/components/ui/button';
export function RunningClinicSettings(){
 const q=useQuery({queryKey:['clinic-admin'],queryFn:async()=>(await api.get('/member-clinic/admin')).data});
 const [capacity,setCapacity]=useState('');const [end,setEnd]=useState('');const [open,setOpen]=useState(false);
 useEffect(()=>{if(q.data){setCapacity(String(q.data.capacity||''));setEnd(q.data.end_time||'');setOpen(q.data.registration_open);}},[q.data]);
 const save=useMutation({mutationFn:async()=>api.patch('/member-clinic/admin',{capacity:Number(capacity),end_time:end,registration_open:open}),onSuccess:()=>void q.refetch()});
 return <section className="space-y-5 border-t py-8"><h2 className="text-2xl">Clínica de Running · 7 de noviembre</h2><p>8:00 h · Arafat. Exclusiva para ASCENSO, CUMBRE, 2707 y FOUNDING 50 vigentes al reservar, sin cobro ni descuento de créditos.</p><Link className="underline" to="/clinica-running">Ver registro público</Link>
 {q.isLoading?<p>Cargando…</p>:q.isError?<p role="alert">No se pudo consultar. <button onClick={()=>void q.refetch()}>Reintentar</button></p>:<><div className="grid gap-4 sm:grid-cols-2"><label>Cupo<input aria-label="Cupo de la clínica" type="number" min="1" max="500" value={capacity} onChange={e=>setCapacity(e.target.value)} className="block w-full rounded border p-3"/></label><label>Hora de término<input aria-label="Hora de término de la clínica" type="time" value={end} onChange={e=>setEnd(e.target.value)} className="block w-full rounded border p-3"/></label></div><label className="flex gap-3"><input type="checkbox" checked={open} onChange={e=>setOpen(e.target.checked)}/>Abrir registro</label><Button disabled={save.isPending||!capacity||!end} onClick={()=>save.mutate()}>Guardar clínica</Button>{save.isSuccess&&<p role="status">Configuración guardada.</p>}{save.isError&&<p role="alert">{getErrorMessage(save.error)}</p>}
 <h3 className="text-xl">Inscritos ({q.data.registrations.length})</h3>{q.data.registrations.length?<ul className="divide-y">{q.data.registrations.map((r:any)=><li key={r.id} className="py-3"><strong>{r.display_name}</strong><p>{r.email} · {r.plan_name} · Vigencia: {r.end_date}</p></li>)}</ul>:<p>Aún no hay inscripciones.</p>}</>}
 </section>;
}
