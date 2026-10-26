import {useQuery,useMutation} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import api,{getErrorMessage} from '@/lib/api';
import {Button} from '@/components/ui/button';
export function RunningClinic({compact=false}:{compact?:boolean}){
 const {isAuthenticated,isLoading}=useAuth();
 const config=useQuery({queryKey:['member-clinic'],queryFn:async()=>(await api.get('/member-clinic')).data});
 const mine=useQuery({queryKey:['member-clinic-me'],enabled:isAuthenticated,queryFn:async()=>(await api.get('/member-clinic/me')).data});
 const register=useMutation({mutationFn:async()=>(await api.post('/member-clinic/register')).data,onSuccess:()=>{void mine.refetch();void config.refetch();}});
 const c=config.data;
 if(config.isLoading)return <p role="status" className="p-6">Consultando próxima experiencia…</p>;
 if(config.isError)return <p role="alert" className="p-6">No pudimos cargar la clínica. <button className="underline" onClick={()=>void config.refetch()}>Reintentar</button></p>;
 if(!c)return null;
 return <section id="clinica-running" className="mx-auto my-8 max-w-6xl rounded-2xl border border-altitud-sand p-6 md:p-10" aria-label="Clínica de Running">
  <div className={compact?'space-y-5':'grid items-start gap-8 md:grid-cols-2'}>
   {!compact&&<img src={'https://api.2707altitud.com.mx'+c.image_url} alt="Clínica de Running con Arafat, Head Coach de Running" className="h-auto w-full rounded-xl" loading="lazy"/>}
   <div className="space-y-5"><p className="alt-eyebrow">EXCLUSIVO PARA NUESTRA COMUNIDAD</p><h2 className="text-3xl md:text-5xl">{c.title}</h2><p className="text-xl">Con Arafat · Head Coach de Running</p><p>{c.date.split('-').reverse().join('/')} · {c.start_time} {c.end_time&&`a ${c.end_time}`} h{!c.end_time&&<> · Término por confirmar</>}<br/>Estudio 2707 Altitud · Horario de Ciudad de México</p>
    <p>Sin costo para personas con ASCENSO, CUMBRE, 2707 o FOUNDING 50 vigente al reservar. No consume clases de tu paquete. No hay venta de entradas.</p>
    {mine.data?.registration?<p role="status" className="rounded-xl bg-altitud-olive/10 p-4 font-semibold">Tu lugar está confirmado.</p>:!c.registration_open?<p role="status">Registro cerrado por el momento.</p>:isLoading?<p>Consultando tu cuenta…</p>:!isAuthenticated?<Link className="alt-button alt-button-olive" to="/login?returnUrl=%2Fclinica-running">Inicia sesión para reservar</Link>:mine.isLoading?<p>Verificando tu membresía…</p>:mine.isError?<p role="alert">No pudimos verificar tu membresía. <button onClick={()=>void mine.refetch()} className="underline">Reintentar</button></p>:!mine.data?.eligible?<p role="status">Para reservar necesitas un paquete ASCENSO o superior vigente. BASE, DROP IN y PRIMERA ALTITUD no incluyen esta actividad.</p>:c.registered>=c.capacity?<p role="status">Cupo completo.</p>:<Button disabled={register.isPending} onClick={()=>register.mutate()}>{register.isPending?'Guardando tu lugar…':'Reservar mi lugar gratis'}</Button>}
    {register.isError&&<p role="alert">{getErrorMessage(register.error)}</p>}
    {c.capacity&&<p className="text-sm text-muted-foreground">{Math.max(0,c.capacity-c.registered)} de {c.capacity} lugares disponibles.</p>}
   </div>
  </div>
 </section>;
}
