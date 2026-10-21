import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Arrow } from './SiteShell';
import { AdditionalPublicImage, ADDITIONAL_PUBLIC_IMAGES } from './AdditionalPublicImage';
export const OPENING_IMAGES = {
 classes: ADDITIONAL_PUBLIC_IMAGES.classes.src,
 inauguration: ADDITIONAL_PUBLIC_IMAGES.inauguration.src,
};
type Session={id:string;date:string;start_time:string;end_time:string;class_type_name:string;instructor_name:string;max_capacity:number;current_bookings:number;waitlist_count?:number};
export function OpeningClassesSection(){
 const query=useQuery<Session[]>({queryKey:['opening-public'],queryFn:async()=>(await api.get('/opening-classes')).data});
 return <section id="apertura" className="mx-auto max-w-6xl px-6 py-16 md:py-24" aria-labelledby="opening-public-title">
  <p className="alt-eyebrow">NOS VEMOS EN ALTITUD</p><h2 id="opening-public-title" className="my-5 text-4xl md:text-6xl">Dos formas de comenzar.</h2>
  <p className="mb-10 max-w-xl text-lg text-muted-foreground">Ven a entrenar en nuestra semana de clases gratis o acompáñanos en la inauguración. Cada experiencia tiene su propio registro.</p>
  <div className="grid gap-12 md:grid-cols-2">
   <article><AdditionalPublicImage image="classes" className="w-full rounded-xl"/><p className="mt-6 text-sm uppercase tracking-widest text-altitud-earth">21 al 23 de octubre · 2026</p><h3 className="mt-2 text-3xl">Primero, entrenamos.</h3><p className="my-4 max-w-prose text-muted-foreground">Sesiones de 50 minutos, sin costo y con 12 lugares. Elige tu clase; para ALT. TRAIN también eliges tu número de mat.</p><a href="#clases-gratis" className="alt-button alt-button-olive">Reservar clase gratis <Arrow/></a></article>
   <article><AdditionalPublicImage image="inauguration" className="w-full rounded-xl"/><h3 className="mt-6 text-3xl">Después, celebramos.</h3><p className="my-4 max-w-prose text-muted-foreground">Acompáñanos en la inauguración. Cuéntanos con cuántas personas vienes y si te gustaría participar en actividades y concursos.</p><Link to="/inauguracion" className="alt-button alt-button-dark">Registro de inauguración <Arrow/></Link></article>
  </div>
  <div id="clases-gratis" className="scroll-mt-32 pt-16"><h3 className="mb-6 text-3xl">Elige tu clase gratis.</h3>
   {query.isLoading?<p role="status">Consultando sesiones…</p>:query.isError?<p role="alert">No pudimos consultar las clases. <button className="underline" onClick={()=>void query.refetch()}>Reintentar</button></p>:!query.data?.length?<p>Estamos preparando la agenda de apertura. Las sesiones aparecerán aquí cuando estén publicadas.</p>:<div className="divide-y border-y">{query.data.map(s=>{const full=s.current_bookings>=s.max_capacity;return <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-6"><div><p className="text-sm text-altitud-earth">{s.date.slice(8,10)} de octubre · {s.start_time.slice(0,5)} a {s.end_time.slice(0,5)} h</p><h4 className="mt-1 text-2xl">{s.class_type_name}</h4><p className="text-sm text-muted-foreground">Coach {s.instructor_name}</p></div><div className="flex flex-wrap items-center gap-4"><span className="text-sm text-muted-foreground">{full?'Cupo completo':`${s.max_capacity-s.current_bookings} lugares disponibles`}</span><Link className="alt-button alt-button-olive" to={'/app/book/'+s.id}>{full?'Entrar a lista de espera':'Reservar gratis'}</Link></div></div>;})}</div>}
   <p className="mt-4 max-w-prose text-sm text-muted-foreground">Horario de Ciudad de México. Reserva con tu cuenta, sin comprar un paquete. La lista de espera no garantiza un lugar; podrás confirmar si se libera uno.</p>
  </div>
 </section>;
}
