import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SCHEDULE_DAYS, civilTimeLabel, type PublishedSlot } from '@/components/schedule/PublishedHours';

type Slot = PublishedSlot & { is_published: boolean };
export function PublishedScheduleEditor() {
  const cache = useQueryClient();
  const [editing, setEditing] = useState<Slot | null>(null);
  const [day, setDay] = useState('1');
  const [time, setTime] = useState('');
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');
  const slots = useQuery<Slot[]>({ queryKey: ['schedule-slots-admin'], queryFn: async () => (await api.get('/schedules/slots')).data });
  const refresh = () => Promise.all(['schedule-public', 'schedule-slots-admin', 'schedules'].map(key => cache.invalidateQueries({ queryKey: [key] })));
  const change = useMutation({
    mutationFn: async ({ id, action, body }: { id?: string; action: 'save' | 'delete' | 'toggle'; body?: unknown }) => {
      if (action === 'delete') return api.delete(`/schedules/slots/${id}`);
      return id ? api.patch(`/schedules/slots/${id}`, body) : api.post('/schedules/slots', body);
    },
    onSuccess: async (_result, input) => { await refresh(); setError(''); if (input.action === 'save') { setEditing(null); setTime(''); setPublished(false); } },
    onError: err => setError(getErrorMessage(err)),
  });
  return <section className="space-y-5 rounded-2xl border bg-card p-4 md:p-6" aria-labelledby="published-hours-title">
    <div><h2 id="published-hours-title" className="text-xl font-heading">Horario publicado</h2><p className="mt-2 text-sm text-muted-foreground">Estos horarios alimentan la web y la app. Guarda un borrador o publícalo cuando esté confirmado. Las clases reservables se programan por separado.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); change.mutate({ id: editing?.id, action: 'save', body: { dayOfWeek: Number(day), startTime: time, isPublished: published } }); }}>
      <label className="grid gap-2 text-sm">Día<select className="h-11 rounded-md border bg-background px-3" value={day} onChange={event => setDay(event.target.value)}>{[1,2,3,4,5,6,0].map(d => <option key={d} value={d}>{SCHEDULE_DAYS[d]}</option>)}</select></label>
      <label className="grid gap-2 text-sm">Hora de inicio<Input required type="time" className="h-11" value={time} onChange={event => setTime(event.target.value)} /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} />Publicado</label>
      <Button disabled={change.isPending} type="submit">{editing ? 'Guardar horario' : 'Agregar horario'}</Button>
      {editing && <Button type="button" variant="outline" onClick={() => {setEditing(null);setTime('');setPublished(false);}}>Cancelar edición</Button>}
    </form>
    {slots.isLoading && <p role="status">Consultando horarios…</p>}
    {slots.isError && <p role="alert">No pudimos cargar el horario. <button onClick={() => slots.refetch()}>Reintentar</button></p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6,0].map(d => <div className="min-w-0 rounded-xl border p-3" key={d}><h3 className="font-semibold">{SCHEDULE_DAYS[d]}</h3><ul className="mt-3 space-y-3">{slots.data?.filter(slot => slot.day_of_week === d).map(slot => <li key={slot.id} className="flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="mr-auto tabular-nums">{civilTimeLabel(slot.start_time)}<small className="block text-muted-foreground">{slot.is_published ? 'Publicado' : 'Borrador'}</small></span>
      <Button size="sm" variant="outline" onClick={() => {setEditing(slot);setDay(String(slot.day_of_week));setTime(slot.start_time);setPublished(slot.is_published);}}>Editar</Button>
      <Button size="sm" variant="outline" disabled={change.isPending} onClick={() => change.mutate({id:slot.id,action:'toggle',body:{isPublished:!slot.is_published}})}>{slot.is_published ? 'Ocultar' : 'Publicar'}</Button>
      <Button size="sm" variant="ghost" disabled={change.isPending} aria-label={`Eliminar ${SCHEDULE_DAYS[d]} ${slot.start_time}`} onClick={() => change.mutate({id:slot.id,action:'delete'})}>Eliminar</Button>
    </li>)}</ul>{!slots.data?.some(slot => slot.day_of_week === d) && <p className="mt-3 text-sm text-muted-foreground">Sin horarios confirmados.</p>}</div>)}</div>
  </section>;
}
