import {Link} from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api, { getErrorMessage } from '@/lib/api';

type Arrival = {id:string;class_id:string;name:string;date:string;start_time:string;status:string};
type Member = {id:string;display_name:string;phone:string;bookings:Arrival[]};

export default function ReceptionCheckin() {
  const [input,setInput]=useState('');
  const [search,setSearch]=useState('');
  const [notice,setNotice]=useState('');
  const {logout}=useAuthStore();
  const client=useQueryClient();
  const members=useQuery({queryKey:['reception-arrivals',search],enabled:search.length>=2,queryFn:async()=>{
    const {data}=await api.get<{members:Member[]}>(`/checkin/search?search=${encodeURIComponent(search)}`);return data.members;
  }});
  const checkin=useMutation({mutationFn:async(booking:Arrival)=>api.post('/checkin/manual',{bookingId:booking.id}),onSuccess:()=>{
    setNotice('Asistencia registrada.');void client.invalidateQueries({queryKey:['reception-arrivals']});
  },onError:(error)=>setNotice(getErrorMessage(error))});
  return <AuthGuard requiredRoles={['reception','admin','super_admin']}>
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5"><p className="font-heading text-xl">2707 ALTITUD</p><Button variant="ghost" onClick={()=>void logout()}>Cerrar sesión</Button></header>
        <nav aria-label="Operación de recepción"><Link to="/admin/founding50" className="inline-flex min-h-11 items-center underline underline-offset-4">Pagos Founding 50</Link></nav>
        <section className="space-y-3"><p className="text-sm uppercase tracking-widest text-muted-foreground">Recepción</p><h1 className="font-heading text-3xl">Llegadas de hoy</h1><p className="text-muted-foreground">Busca a la persona y registra su asistencia en la reserva de hoy.</p></section>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={e=>{e.preventDefault();setNotice('');setSearch(input.trim());}}>
          <label className="flex-1 space-y-2"><span className="text-sm">Nombre o teléfono</span><Input value={input} onChange={e=>setInput(e.target.value)} minLength={2} maxLength={100} placeholder="Escribe al menos dos caracteres" required /></label>
          <Button type="submit" className="min-h-11 sm:self-end" disabled={members.isFetching}>Buscar persona</Button>
        </form>
        <p role="status" aria-live="polite">{notice || (members.isFetching?'Buscando…':'')}</p>
        {members.isError && <p role="alert" className="text-destructive">{getErrorMessage(members.error)}</p>}
        {members.data?.length===0 && <p>No encontramos personas con esos datos.</p>}
        <div className="space-y-5">{members.data?.map(member=><article key={member.id} className="rounded-2xl border border-border p-5 space-y-4">
          <div><h2 className="font-heading text-xl">{member.display_name}</h2><p className="text-sm text-muted-foreground">{member.phone}</p></div>
          {member.bookings.length===0 && <p className="text-muted-foreground">Sin reservas para hoy.</p>}
          {member.bookings.map(booking=><div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
            <div><p>{booking.name}</p><p className="text-sm text-muted-foreground">{booking.start_time.slice(0,5)} · {booking.status==='checked_in'?'Asistencia registrada':booking.status==='waitlist'?'Lista de espera':'Reserva confirmada'}</p></div>
            {booking.status==='confirmed' && <Button disabled={checkin.isPending} onClick={()=>{setNotice('');checkin.mutate(booking);}}>Registrar asistencia</Button>}
          </div>)}
        </article>)}</div>
      </div>
    </main>
  </AuthGuard>;
}
