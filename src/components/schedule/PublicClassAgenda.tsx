import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Class } from '@/types/class';

export function PublicClassAgenda() {
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const start = format(week, 'yyyy-MM-dd'), end = format(addDays(week, 6), 'yyyy-MM-dd');
  const query = useQuery<Class[]>({ queryKey: ['classes-public', start, end], queryFn: async () => (await api.get(`/classes?start=${start}&end=${end}`)).data });
  return <div className="public-class-agenda">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-altitud-sand pb-4">
      <h3 className="text-xl">{format(week, 'd MMM', { locale: es })} – {format(addDays(week, 6), 'd MMM', { locale: es })}</h3>
      <div className="flex gap-2"><button aria-label="Semana anterior" className="min-h-11 rounded-full border border-altitud-sand px-4" onClick={() => setWeek(addDays(week, -7))}>←</button><button aria-label="Semana siguiente" className="min-h-11 rounded-full border border-altitud-sand px-4" onClick={() => setWeek(addDays(week, 7))}>→</button></div>
    </div>
    {query.isPending ? <p role="status">Cargando clases…</p> : query.isError ? <p role="alert">No pudimos cargar la agenda. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></p> : Array.from({ length: 7 }, (_, i) => {
      const day = addDays(week, i), key = format(day, 'yyyy-MM-dd');
      const sessions = (query.data || []).filter(c => c.date.slice(0, 10) === key && c.status !== 'cancelled').sort((a,b) => a.start_time.localeCompare(b.start_time));
      return <details key={key} className="border-b border-altitud-sand py-3" open={i === 0 || undefined}>
        <summary className="min-h-11 cursor-pointer py-2 capitalize">{format(day, 'EEEE d', { locale: es })} <span className="text-sm text-muted-foreground">· {sessions.length} clases</span></summary>
        {!sessions.length ? <p className="py-3 text-sm text-muted-foreground">Sin clases programadas.</p> : sessions.map(c => <div key={c.id} className="flex items-start justify-between gap-4 border-t border-altitud-sand/40 py-4">
          <div><p className="text-sm">{c.start_time.slice(0,5)} – {c.end_time.slice(0,5)}</p><h4 className="text-lg">{c.class_type_name}</h4>{c.training_focus && <p className="text-sm font-semibold text-altitud-olive">{c.training_focus}</p>}<p className="text-sm text-muted-foreground">{c.instructor_name}</p></div>
          <Link to={`/app/book/${c.id}`} className="min-h-11 py-3 text-sm underline">Ver clase →</Link>
        </div>)}
      </details>;
    })}
    <p className="mt-4 text-xs text-muted-foreground">Hora del studio · Ciudad de México</p>
  </div>;
}
