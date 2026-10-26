import {useQuery,useMutation} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import api,{getErrorMessage} from '@/lib/api';
import {Button} from '@/components/ui/button';
export const defaultClinicId='27070000-0000-4000-8000-000020261107';
export function RunningClinic({compact=false,eventId=defaultClinicId}:{compact?:boolean;eventId?:string}){
 const {isAuthenticated,isLoading}=useAuth();
 const config=useQuery({queryKey:['member-events',eventId],queryFn:async()=>(await api.get(`/member-events/${eventId}`)).data});
 const mine=useQuery({queryKey:['member-event-me',eventId],enabled:isAuthenticated,queryFn:async()=>(await api.get(`/member-events/${eventId}/me`)).data});
 const register=useMutation({mutationFn:async()=>(await api.post(`/member-events/${eventId}/register`)).data,onSuccess:()=>{void mine.refetch();void config.refetch();}});
 const c=config.data;
 if(config.isLoading)return <p role="status" className="p-6">Consultando próxima experiencia…</p>;
 if(config.isError)return <p role="alert" className="p-6">No pudimos cargar la clínica. <button className="underline" onClick={()=>void config.refetch()}>Reintentar</button></p>;
 if(!c)return null;
 return <section id={eventId} className="mx-auto my-8 max-w-6xl rounded-2xl border border-altitud-sand p-6 md:p-10" aria-label={c.title}>
  <div className={compact||!c.image_url?'space-y-5':'grid items-start gap-8 md:grid-cols-2'}>
   {!compact&&c.image_url&&<img src={'https://api.2707altitud.com.mx'+c.image_url} alt={c.title} className="h-auto w-full rounded-xl" loading="lazy"/>}
   <div className="space-y-5"><p className="alt-eyebrow">EXCLUSIVO PARA NUESTRA COMUNIDAD</p><h2 className="text-3xl md:text-5xl">{c.title}</h2>{c.coach&&<p className="text-xl">Con {c.coach}</p>}{c.description&&<p className="whitespace-pre-line">{c.description}</p>}<p>{c.date.split('-').reverse().join('/')} · {c.start_time} {c.end_time&&`a ${c.end_time}`} h{!c.end_time&&<> · Término por confirmar</>}<br/>{c.location} · Horario de Ciudad de México</p>
    <p>Sin costo con un paquete vigente de: {c.allowed_plans?.map((p:any)=>p.name).join(", ")}. No consume clases de tu paquete. No hay venta de entradas.</p>
    {mine.data?.registration?<p role="status" className="rounded-xl bg-altitud-olive/10 p-4 font-semibold">Tu lugar está confirmado.</p>:c.upcoming===false?<p role="status">Este evento ya finalizó.</p>:!c.registration_open?<p role="status">Registro cerrado por el momento.</p>:isLoading?<p>Consultando tu cuenta…</p>:!isAuthenticated?<Link className="alt-button alt-button-olive" to={"/login?returnUrl="+encodeURIComponent("/experiencias/"+eventId)}>Inicia sesión para reservar</Link>:mine.isLoading?<p>Verificando tu membresía…</p>:mine.isError?<p role="alert">No pudimos verificar tu membresía. <button onClick={()=>void mine.refetch()} className="underline">Reintentar</button></p>:!mine.data?.eligible?<p role="status">Para reservar necesitas uno de los paquetes permitidos vigente al momento de inscribirte.</p>:c.registered>=c.capacity?<p role="status">Cupo completo.</p>:<Button disabled={register.isPending} onClick={()=>register.mutate()}>{register.isPending?'Guardando tu lugar…':'Reservar mi lugar gratis'}</Button>}
    {register.isError&&<p role="alert">{getErrorMessage(register.error)}</p>}
    {c.capacity&&<p className="text-sm text-muted-foreground">{Math.max(0,c.capacity-c.registered)} de {c.capacity} lugares disponibles.</p>}
   </div>
  </div>
 </section>;
}

export function MemberEventsSection({compact=false}:{compact?:boolean}){
 const q=useQuery({queryKey:['member-events'],queryFn:async()=>(await api.get('/member-events')).data});
 if(q.isLoading)return <p className="p-6" role="status">Consultando experiencias…</p>;
 if(q.isError)return <p className="p-6" role="alert">No se pudieron consultar las experiencias. <button className="underline" onClick={()=>void q.refetch()}>Reintentar</button></p>;
 return <>{q.data?.map((event:any)=><RunningClinic key={event.id} eventId={event.id} compact={compact}/>)}</>;
}
