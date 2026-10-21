import { Link } from 'react-router-dom';

type MatAttendee = { booking_id: string; user_id: string; display_name: string; status: string; mat_number?: number | null };

export function ClassMatMap({ capacity, attendees, loading, error, onRetry }: {
  capacity: number; attendees: MatAttendee[]; loading: boolean; error: boolean; onRetry: () => void;
}) {
  const active = attendees.filter(person => ['confirmed', 'checked_in', 'no_show'].includes(person.status));
  const occupied = new Map(active.filter(person => person.mat_number != null).map(person => [Number(person.mat_number), person]));
  const unassigned = active.filter(person => person.mat_number == null);
  return <section aria-label="Mapa de mats" className="space-y-4 rounded-2xl border border-altitud-sand bg-altitud-cream/40 p-4">
    <div><h3 className="text-lg font-semibold">Mapa de mats</h3><p className="text-xs text-muted-foreground">Lugares numerados de esta clase. Distribución de referencia.</p></div>
    {loading ? <p role="status">Cargando reservas de mats…</p> : error ? <div role="alert">No se pudo consultar la ocupación. <button className="underline" onClick={onRetry}>Reintentar</button></div> : <>
      <p className="text-sm">{occupied.size} ocupados · {Math.max(0, capacity - occupied.size)} {unassigned.length ? 'sin asignación de mat' : 'libres'}</p>
      {unassigned.length > 0 && <p role="alert" className="text-sm">Hay {unassigned.length} reservas activas sin mat asignado. Revisa los asistentes antes de asignar un lugar.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Lugares de la clase">
        {Array.from({ length: capacity }, (_, index) => {
          const number = index + 1;
          const person = occupied.get(number);
          return <li key={number} className={`min-h-28 rounded-xl border p-3 ${person ? 'border-altitud-olive/40 bg-altitud-olive/10' : 'border-dashed border-altitud-sand bg-white/60'}`}>
            <p className="text-sm font-semibold">Mat {number}</p>
            {person ? <><Link className="mt-2 block break-words text-sm font-medium underline underline-offset-4" to={`/admin/members/${person.user_id}`}>{person.display_name}</Link><span className="mt-1 block text-xs">{person.status === 'checked_in' ? 'Check-in realizado' : person.status === 'no_show' ? 'Inasistencia' : 'Reservado'}</span></> : <p className="mt-2 text-sm">{unassigned.length ? 'Sin asignación' : 'Libre'}</p>}
          </li>;
        })}
      </ul>
    </>}
  </section>;
}
