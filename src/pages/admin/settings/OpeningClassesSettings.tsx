import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
type Session={id:string;date:string;start_time:string;end_time:string|null;class_name:string;instructor_id:string|null;class_id:string|null;max_capacity:number};
type Coach={id:string;display_name:string;is_active:boolean};
export function OpeningClassesSettings(){
 const sessions=useQuery<Session[]>({queryKey:['opening-admin'],queryFn:async()=>(await api.get('/opening-classes/admin')).data});
 const coaches=useQuery<Coach[]>({queryKey:['opening-coaches'],queryFn:async()=>{const {data}=await api.get('/instructors');return Array.isArray(data)?data:data.data||[];}});
 return <section className="space-y-5 border-t pt-8" aria-labelledby="opening-title"><header><h2 id="opening-title" className="text-xl font-semibold">Semana de apertura · 21 al 23 de octubre</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">12 sesiones gratuitas, 12 lugares por sesión. Confirma el coach y la hora de término para habilitar el registro. Horario de Ciudad de México.</p></header>
 {sessions.isLoading?<p role="status">Consultando sesiones…</p>:sessions.isError?<Button variant="outline" onClick={()=>void sessions.refetch()}>Volver a consultar sesiones</Button>:<div className="divide-y">{sessions.data?.map(s=><OpeningRow key={s.id} session={s} coaches={coaches.data||[]} refresh={()=>void sessions.refetch()}/>)}</div>}
 {coaches.isError&&<p role="alert">No pudimos consultar coaches. <button className="underline" onClick={()=>void coaches.refetch()}>Reintentar</button></p>}
 <p className="text-sm text-muted-foreground">Registro del acto de inauguración: fecha y hora pendientes de confirmar.</p>
 </section>;
}
function OpeningRow({session:s,coaches,refresh}:{session:Session;coaches:Coach[];refresh:()=>void}){
 const [coach,setCoach]=useState(s.instructor_id||'');const [end,setEnd]=useState(s.end_time?.slice(0,5)||'');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const publish=async()=>{setBusy(true);setError('');try{await api.patch('/opening-classes/'+s.id,{instructorId:coach,endTime:end});await api.post('/opening-classes/'+s.id+'/publish');refresh();}catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}};
 return <div className="space-y-3 py-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">{s.date.slice(8,10)} oct · {s.start_time.slice(0,5)} · {s.class_name}</h3><span className="text-sm text-muted-foreground">Gratis · {s.max_capacity} lugares</span></div>{s.class_id?<div className="text-sm text-altitud-olive">Publicada. <Link className="underline" to="/admin/calendar">Administrar en agenda</Link></div>:<div className="grid items-end gap-3 sm:grid-cols-[1fr_9rem_auto]"><div><Label htmlFor={'coach-'+s.id}>Coach</Label><select id={'coach-'+s.id} className="mt-1 flex h-11 w-full rounded-md border bg-background px-3 text-sm" value={coach} disabled={busy} onChange={e=>setCoach(e.target.value)}><option value="">Selecciona coach</option>{coaches.filter(c=>c.is_active!==false).map(c=><option key={c.id} value={c.id}>{c.display_name}</option>)}</select></div><div><Label htmlFor={'end-'+s.id}>Termina a las</Label><Input id={'end-'+s.id} type="time" value={end} disabled={busy} onChange={e=>setEnd(e.target.value)}/></div><Button onClick={()=>void publish()} disabled={busy||!coach||!end}>{busy?'Publicando…':'Publicar sesión'}</Button></div>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
