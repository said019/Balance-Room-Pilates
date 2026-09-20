import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
export type PublishedSlot = { id: string; day_of_week: number; start_time: string; is_published?: boolean };
export const SCHEDULE_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export function civilTimeLabel(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
export function usePublishedHours() {
  return useQuery<{ timezone: string; slots: PublishedSlot[] }>({
    queryKey: ['schedule-public'],
    queryFn: async () => (await api.get('/schedules/public')).data,
    staleTime: 0,
    refetchInterval: 30000,
  });
}
export function PublishedHours() {
  const hours = usePublishedHours();
  if (hours.isError) return <div role="alert"><p>No pudimos consultar los horarios.</p><button type="button" onClick={() => hours.refetch()}>Volver a consultar</button></div>;
  if (hours.isLoading) return <p role="status">Consultando horarios…</p>;
  if (!hours.data?.slots.length) return <p>Los horarios se publicarán próximamente.</p>;
  return <div data-published-schedule>
    {[1,2,3,4,5,6,0].map(day => {
      const slots = hours.data.slots.filter(slot => slot.day_of_week === day);
      return slots.length ? <div key={day} className="mb-4"><h3>{SCHEDULE_DAYS[day]}</h3><ul className="flex flex-wrap gap-x-4 gap-y-2">{slots.map(slot => <li key={slot.id} data-slot-id={slot.id} data-day={day} data-time={slot.start_time}>{civilTimeLabel(slot.start_time)}</li>)}</ul></div> : null;
    })}
    <p className="text-sm">Hora del studio · Ciudad de México. Consulta las sesiones disponibles para reservar.</p>
  </div>;
}
