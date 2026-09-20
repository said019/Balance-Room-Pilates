import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api, { getErrorMessage } from '@/lib/api';
import type { BookingClient } from '@/types/booking';
import type { Class } from '@/types/class';
import { isLateCancellation } from './useMemberData';

export function RescheduleDialog({ booking, onClose, onChange }: { booking: BookingClient | null; onClose: () => void; onChange: (booking: BookingClient, target: Class) => Promise<unknown> }) {
  const [target,setTarget]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const end=new Date(`${today}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+28);
  const classes=useQuery<Class[]>({queryKey:['reschedule-classes',today],queryFn:async()=> (await api.get(`/classes?start=${today}&end=${end.toISOString().slice(0,10)}`)).data,enabled:!!booking,staleTime:0});
  const available=classes.data?.filter(c=>c.id!==booking?.class_id&&c.status==='scheduled'&&c.current_bookings<c.max_capacity&&new Date(`${c.date.slice(0,10)}T${c.start_time.slice(0,5)}:00-06:00`).getTime()>Date.now())||[];
  const late=booking&&booking.booking_status!=='waitlist'&&isLateCancellation(booking);
  async function submit(){const chosen=available.find(c=>c.id===target);if(!chosen||!booking)return;setBusy(true);setError('');try{await onChange(booking,chosen);setTarget('');onClose();}catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}}
  return <Dialog open={!!booking} onOpenChange={open=>{if(!open&&!busy){setTarget('');setError('');onClose();}}}><DialogContent className="member-dialog">
    <DialogTitle>Cambiar de sesión</DialogTitle><DialogDescription>Elige otra sesión. Tu reserva actual se conserva si el cambio no puede completarse.</DialogDescription>
    {late ? <p role="alert">El plazo de 4 horas para reagendar terminó.</p> : <>
      {classes.isLoading&&<p role="status">Buscando sesiones…</p>}
      {classes.isError&&<p role="alert">No pudimos consultar la agenda. <button onClick={()=>classes.refetch()}>Reintentar</button></p>}
      {!classes.isLoading&&!classes.isError&&<label className="grid gap-2">Nueva sesión<select className="min-h-12 w-full rounded-lg border bg-background px-3 text-base" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Selecciona una sesión</option>{available.map(c=><option key={c.id} value={c.id}>{c.date.slice(0,10)} · {c.start_time.slice(0,5)} · {c.class_type_name}</option>)}</select></label>}
      {!classes.isLoading&&!classes.isError&&!available.length&&<p>No hay otras sesiones disponibles en las próximas cuatro semanas.</p>}
    </>}
    {error&&<p role="alert" className="member-error">{error}</p>}
    <button className="member-button" disabled={busy||!target||!!late} onClick={()=>void submit()}>{busy?'Cambiando…':'Confirmar cambio'}</button>
    <button className="member-subtle-button" disabled={busy} onClick={onClose}>Conservar mi sesión</button>
  </DialogContent></Dialog>;
}
