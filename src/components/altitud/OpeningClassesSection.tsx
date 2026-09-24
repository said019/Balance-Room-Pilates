import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
type Session={id:string;date:string;start_time:string;end_time:string;class_type_name:string;max_capacity:number;current_bookings:number};
export function OpeningClassesSection(){
 const query=useQuery<Session[]>({queryKey:['opening-public'],queryFn:async()=>(await api.get('/opening-classes')).data});
 if(!query.data?.length)return null;
 return <section id="apertura" className="mx-auto max-w-6xl px-6 py-16 md:py-24" aria-labelledby="opening-public-title"><div className="mb-8 grid gap-5 md:grid-cols-2"><div><p className="text-xs uppercase tracking-[0.2em] text-altitud-olive">21 al 23 de octubre de 2026</p><h2 id="opening-public-title" className="mt-3 text-4xl md:text-5xl">Tu primera Altitud.<br/>Ven a entrenar.</h2></div><p className="max-w-md self-end text-lg text-muted-foreground">Conoce el studio en nuestras clases gratuitas de apertura. Reserva tu lugar con tu cuenta, sin comprar un paquete. Hasta 12 personas por sesión.</p></div><div className="divide-y border-y">{query.data.map(s=><div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="text-sm text-altitud-earth">{s.date.slice(8,10)} de octubre · {s.start_time.slice(0,5)} h</p><h3 className="mt-1 text-2xl">{s.class_type_name}</h3></div><div className="flex items-center gap-5"><span className="text-sm text-muted-foreground">{Math.max(0,s.max_capacity-s.current_bookings)} lugares disponibles</span><Link className="alt-button alt-button-olive" to={'/app/book/'+s.id}>Ver sesión</Link></div></div>)}</div><p className="mt-3 text-sm text-muted-foreground">Horario de Ciudad de México. La disponibilidad se confirma al reservar.</p></section>;
}
