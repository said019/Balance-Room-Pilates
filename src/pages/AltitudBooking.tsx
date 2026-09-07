import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SiteHeader, SiteFooter, Arrow } from '@/components/altitud/SiteShell';

type Session = { id: string; time: string; type: string; duration: string; day: string };
const storageKey = 'altitud2707-preview-bookings';
function readBookings(): Session[] {
  try { const data = JSON.parse(localStorage.getItem(storageKey) || '[]'); return Array.isArray(data) ? data.filter(x => typeof x.id === 'string' && typeof x.day === 'string' && typeof x.type === 'string' && typeof x.time === 'string') : []; } catch { return []; }
}
export default function AltitudBooking() {
  const [params] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState(0);
  const [week, setWeek] = useState(0);
  const [filter, setFilter] = useState(params.get('tipo') || 'Todas');
  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Session[]>(readBookings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + week * 7); return d; });
  const date = days[selectedDay];
  const dateKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const sessions: Session[] = date.getDay() === 0 ? [] : [
    { id: `${dateKey}-0700`, time: '07:00', type: 'Híbrido', duration: '50 min', day: dateKey },
    { id: `${dateKey}-0830`, time: '08:30', type: 'Funcional', duration: '50 min', day: dateKey },
    { id: `${dateKey}-1800`, time: '18:00', type: 'Híbrido', duration: '50 min', day: dateKey },
  ];
  const filtered = sessions.filter(s => filter === 'Todas' || s.type === filter);
  function persist(next: Session[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setBookings(next); setError(''); return true; } catch { setError('No pudimos guardar en este navegador. Activa el almacenamiento local e inténtalo de nuevo.'); return false; }
  }
  function confirm() { if (session && persist([...bookings.filter(b=>b.id!==session.id),session])) setSaved(true); }
  return <div className="alt-site"><SiteHeader /><main className="alt-booking-page"><div className="alt-eyebrow">TU MOMENTO DE ENTRENAR</div><div className="alt-booking-title"><h1>HAZ ESPACIO<br /><span>PARA TI.</span></h1><p>Elige tu entrenamiento.<br />Llega con ganas. Nosotros te acompañamos.</p></div>
    <div className="alt-preview-notice"><span>AGENDA DE MUESTRA</span><p>Explora la experiencia de reserva. Estos horarios, duraciones y reservas son ilustrativos; no corresponden a clases reales.</p></div>
    <div className="alt-schedule-toolbar"><div className="alt-filter" aria-label="Filtrar entrenamientos">{['Todas','Híbrido','Funcional'].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="alt-week-control"><button onClick={()=>{setWeek(Math.max(0,week-1));setSelectedDay(0);}} disabled={week===0} aria-label="Semana anterior">←</button><span>{days[0].toLocaleDateString('es-MX',{month:'long',year:'numeric'})}</span><button onClick={()=>{setWeek(week+1);setSelectedDay(0);}} aria-label="Semana siguiente">→</button></div></div>
    <div className="alt-days">{days.map((d,i)=><button key={d.toISOString()} onClick={()=>setSelectedDay(i)} aria-pressed={selectedDay===i} aria-label={d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})}><span>{d.toLocaleDateString('es-MX',{weekday:'short'}).replace('.','')}</span><strong>{String(d.getDate()).padStart(2,'0')}</strong>{i===0&&week===0?<small>HOY</small>:<small>{d.toLocaleDateString('es-MX',{month:'short'})}</small>}</button>)}</div>
    <p className="alt-schedule-date" aria-live="polite">{date.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})} · {filtered.length} sesiones de muestra</p>
    <div className="alt-session-list">{filtered.length ? filtered.map(s=>{const booked=bookings.some(b=>b.id===s.id);return <article key={s.id}><span className="alt-session-time">{s.time}<small>{s.duration}</small></span><div><span className="alt-eyebrow">{s.type==='Híbrido'?'FUERZA + RESISTENCIA':'MOVIMIENTO + CONTROL'}</span><h2>{s.type}</h2><p>Grupos pequeños · Todos los niveles</p></div><button className={`alt-button ${booked?'alt-button-muted':'alt-button-dark'}`} onClick={()=>{setSession(s);setSaved(booked);setError('');}}>{booked?'Ver mi reserva':'Probar reserva'}<Arrow /></button></article>}) : <div className="alt-empty"><span className="alt-eyebrow">TAMBIÉN SE CRECE AL RECUPERAR</span><h2>Un respiro en tu semana.</h2><p>No hay sesiones de muestra para este día. Explora otra fecha o entrenamiento.</p><button className="alt-text-link" onClick={()=>{setSelectedDay((selectedDay+1)%7);setFilter('Todas');}}>Ver otro día →</button></div>}</div>
    {bookings.length>0&&<section className="alt-saved-bookings"><div className="alt-eyebrow">TUS RESERVAS DE MUESTRA</div>{bookings.map(b=><div key={b.id}><span>{b.type} · {b.day} · {b.time}</span><button onClick={()=>persist(bookings.filter(x=>x.id!==b.id))}>Cancelar muestra</button></div>)}</section>}
    {error&&<p role="alert" className="alt-error">{error}</p>}<div className="alt-booking-help"><p>¿Es tu primera vez? Todo empieza con dar el primer paso.</p><Link to="/#preguntas" className="alt-text-link">Resuelve tus dudas <Arrow /></Link></div>
  </main><SiteFooter /><Dialog open={!!session} onOpenChange={open=>{if(!open)setSession(null);}}><DialogContent className="alt-booking-dialog"><div className="alt-eyebrow">2707 ALTITUD · EXPERIENCIA DE MUESTRA</div><DialogTitle className="alt-dialog-title">{saved?'YA TIENES TU MOMENTO.':'TU SIGUIENTE PASO.'}</DialogTitle><DialogDescription>{saved?'Tu reserva de muestra quedó guardada en este navegador. No se ha realizado una reserva real.':'Revisa tu sesión de muestra antes de continuar. No se realizará ningún cargo ni reserva real.'}</DialogDescription>{session&&<div className="alt-booking-summary"><h3>{session.type}</h3><p>{session.day} · {session.time} · {session.duration}</p><p>Entrenamiento en grupos pequeños</p></div>}{error&&<p role="alert" className="alt-error">{error}</p>}{saved?<button className="alt-button alt-button-olive" onClick={()=>setSession(null)}>Volver a la agenda <Arrow /></button>:<button className="alt-button alt-button-olive" onClick={confirm}>Confirmar reserva de muestra <Arrow /></button>}</DialogContent></Dialog></div>;
}
