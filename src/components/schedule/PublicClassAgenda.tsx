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
    {query.isPending ? <p role="status">Cargando clases…</p> : query.isError ? <p role="alert">No pudimos cargar la agenda. <button className="underline" onClick={() => void query.refetch()}>Reintentar</button></p> : <div className="alt-week-scroll" tabIndex={0} role="region" aria-label="Calendario semanal de clases">
      <div className="alt-week-grid">
        <div className="alt-week-corner">Hora</div>
        {Array.from({ length: 7 }, (_, i) => <div className="alt-week-day" key={i}><span>{format(addDays(week,i), 'EEE', {locale:es})}</span><strong>{format(addDays(week,i),'d')}</strong></div>)}
        {Array.from(new Set((query.data || []).filter(c => c.status !== 'cancelled').map(c => c.start_time.slice(0,5)))).sort().map(time => <div className="alt-week-row" key={time}>
          <div className="alt-week-time">{time}</div>
          {Array.from({length:7},(_,i) => {
            const date = format(addDays(week,i),'yyyy-MM-dd');
            const sessions = (query.data || []).filter(c => c.date.slice(0,10) === date && c.start_time.slice(0,5) === time && c.status !== 'cancelled');
            return <div className="alt-week-cell" key={date}>{sessions.map(c => <Link key={c.id} to={`/app/book/${c.id}`} className="alt-week-class" aria-label={`Ver clase → ${c.class_type_name}, ${date}, ${time}`}>
              <span className="alt-week-duration">{time} – {c.end_time.slice(0,5)}</span>
              <h4>{c.class_type_name}</h4>
              {c.training_focus && <strong className="alt-week-focus">{c.training_focus}</strong>}
              <span>{c.instructor_name}</span>
              <span className="alt-week-book">Ver clase ↗</span>
            </Link>)}</div>;
          })}
        </div>)}
      </div>
      {!query.data?.some(c => c.status !== 'cancelled') && <p className="py-6">Sin clases programadas esta semana.</p>}
    </div>}

    <p className="mt-4 text-xs text-muted-foreground">Hora del studio · Ciudad de México</p>
  </div>;
}
