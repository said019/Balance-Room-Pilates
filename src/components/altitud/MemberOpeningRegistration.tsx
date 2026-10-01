import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { InaugurationConfig } from '@/pages/Inauguration';

type OpeningRegistration = {
  attendeeCount: number;
  exercisesRegularly: boolean;
  exerciseType: string;
  activitiesInterest: boolean;
};

export function MemberOpeningRegistration() {
  const event = useQuery<InaugurationConfig>({
    queryKey: ['inauguration'],
    queryFn: async () => (await api.get('/inauguration')).data,
  });
  const registration = useQuery<OpeningRegistration | null>({
    queryKey: ['inauguration-mine'],
    queryFn: async () => (await api.get('/inauguration/registrations/me')).data,
  });
  const attendance = registration.data;

  return (
    <section className="my-8 overflow-hidden rounded-2xl border border-altitud-sand bg-white/40" aria-labelledby="my-opening">
      <header className="border-b border-altitud-sand/50 px-6 py-5 sm:px-8">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-altitud-olive">Nos vemos en Altitud</p>
        <h2 id="my-opening" className="text-3xl">Mi inauguración</h2>
      </header>
      <div className="space-y-5 px-6 py-6 sm:px-8">
        {event.isLoading || registration.isLoading ? (
          <p role="status">Consultando tu registro…</p>
        ) : event.isError || registration.isError ? (
          <p role="alert">
            No pudimos consultar tu registro.{' '}
            <button className="underline" onClick={() => { void event.refetch(); void registration.refetch(); }}>
              Reintentar
            </button>
          </p>
        ) : (
          <>
            <p className="text-lg">
              {event.data?.date?.split('-').reverse().join('/') || 'Fecha por confirmar'}
              {' · '}{event.data?.startTime || 'Hora por confirmar'}
              {event.data?.endTime ? ` a ${event.data.endTime} h` : ''}
            </p>
            {attendance ? (
              <>
                <p className="rounded-lg bg-altitud-olive/10 px-4 py-3 font-medium text-altitud-olive">
                  Asistencia registrada · {attendance.attendeeCount} {attendance.attendeeCount === 1 ? 'persona' : 'personas'}, incluyéndote
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ejercicio: {attendance.exercisesRegularly ? attendance.exerciseType : 'No regularmente'}.
                  {' '}Actividades y concursos: {attendance.activitiesInterest ? 'Sí' : 'No'}.
                </p>
                <Link className="member-text-link" to="/inauguracion">Ver o actualizar mi registro →</Link>
              </>
            ) : (
              <>
                <p>Aún no estás registrado al evento de inauguración.</p>
                <Link className="member-text-link" to="/inauguracion">Registrarme a la inauguración →</Link>
              </>
            )}
          </>
        )}
      </div>
      <footer className="space-y-2 border-t border-altitud-sand/50 px-6 py-4 sm:px-8">
        <p className="text-sm text-muted-foreground">Tus clases gratis son reservas independientes.</p>
        <Link className="member-text-link" to="/app/classes">Ver mis clases reservadas →</Link>
      </footer>
    </section>
  );
}
