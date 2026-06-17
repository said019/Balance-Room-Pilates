import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addWeeks,
  differenceInMinutes,
  format,
  isPast,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Layers3, Loader2, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookingDialog } from './BookingDialog';
import api from '@/lib/api';

interface ScheduleClass {
  id: string;
  name: string;
  time: string;
  endTime: string;
  duration: number;
  instructor: string;
  instructorPhoto: string | null;
  spots: number;
  maxSpots: number;
  color: string;
  facilityName: string | null;
  isFree: boolean;
  freeLabel: string | null;
}

interface ClassItem {
  id: string;
  time: string;
  type: string;
  instructor: string;
  spots: number;
  duration: string;
  date?: Date;
  is_free?: boolean;
  free_label?: string | null;
}

interface ApiClass {
  id: string;
  date: string;
  class_date: string;
  start_time: string;
  end_time: string;
  class_type_name: string;
  class_type_color: string;
  theme?: string;
  instructor_name: string;
  instructor_photo: string | null;
  capacity: number;
  current_bookings: number;
  status: string;
  facility_name?: string | null;
  is_free?: boolean;
  free_label?: string | null;
}

const classColors: Record<string, string> = {
  Yoga: '#7E8579',
  'Hot yoga': '#8A8174',
  'Pilates Mat': '#A2A88B',
  'Pilates mat': '#A2A88B',
  'Hot Pilates': '#8F7D68',
  'Silla wunda': '#6F776C',
  Sculpt: '#9E927F',
  Barre: '#837A70',
};

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(addDays(weekStart, 13), 'yyyy-MM-dd');

  const { data: apiClasses, isLoading } = useQuery<ApiClass[]>({
    queryKey: ['public-classes', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/classes?start_date=${startDate}&end_date=${endDate}`);
      return data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 2,
  });

  const allClasses: ScheduleClass[] = useMemo(() => {
    if (!apiClasses) return [];

    return apiClasses
      .filter((cls) => cls.status !== 'cancelled')
      .map((cls) => {
        const dateStr = (cls.date || cls.class_date || '').split('T')[0];
        const available = cls.capacity - (cls.current_bookings || 0);

        return {
          id: cls.id,
          name: cls.class_type_name,
          time: `${dateStr}T${cls.start_time}`,
          endTime: cls.end_time || '',
          duration: 50,
          instructor: cls.instructor_name || 'Coach por confirmar',
          instructorPhoto: cls.instructor_photo || null,
          spots: Math.max(0, available),
          maxSpots: cls.capacity || 6,
          color: cls.class_type_color || classColors[cls.class_type_name] || '#7E8579',
          theme: cls.theme || 'none',
          facilityName: cls.facility_name ?? null,
          isFree: !!cls.is_free,
          freeLabel: cls.free_label ?? null,
        };
      });
  }, [apiClasses]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const dayClasses = useMemo(() => {
    return allClasses
      .filter((cls) => isSameDay(parseISO(cls.time), selectedDate))
      .filter((cls) => roomFilter === 'all' || cls.facilityName === roomFilter)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, allClasses, roomFilter]);

  const filteredClasses = useMemo(() => {
    if (filter === 'all') return dayClasses;
    return dayClasses.filter((c) => c.name === filter);
  }, [dayClasses, filter]);

  const uniqueTypes = useMemo(() => [...new Set(dayClasses.map((c) => c.name))], [dayClasses]);
  const morningClasses = filteredClasses.filter((cls) => Number(format(parseISO(cls.time), 'H')) < 12);
  const eveningClasses = filteredClasses.filter((cls) => Number(format(parseISO(cls.time), 'H')) >= 12);
  const groupedClasses = [
    { label: 'Mañana', detail: 'desde las 7:00', classes: morningClasses },
    { label: 'Tarde', detail: 'desde las 17:00', classes: eveningClasses },
  ].filter((group) => group.classes.length > 0);

  const getClassCount = (day: Date) => allClasses.filter((cls) => isSameDay(parseISO(cls.time), day)).length;

  const getTimeStatus = (cls: ScheduleClass) => {
    const classStart = parseISO(cls.time);
    if (!isToday(classStart)) return null;

    const dateStr = cls.time.split('T')[0];
    const endDateTime = cls.endTime
      ? parseISO(`${dateStr}T${cls.endTime}`)
      : new Date(classStart.getTime() + cls.duration * 60_000);

    if (now >= endDateTime) return { status: 'past' as const, label: 'Finalizada' };
    if (now >= classStart && now < endDateTime) {
      return { status: 'in-progress' as const, label: `En curso · ${differenceInMinutes(endDateTime, now)} min` };
    }

    const minsUntil = differenceInMinutes(classStart, now);
    if (minsUntil < 60) return { status: 'upcoming' as const, label: `En ${minsUntil} min` };
    const hours = Math.floor(minsUntil / 60);
    const mins = minsUntil % 60;
    return { status: 'upcoming' as const, label: mins === 0 ? `En ${hours}h` : `En ${hours}h ${mins}m` };
  };

  const formatTime = (t: string) => {
    try {
      return format(parseISO(t), 'HH:mm');
    } catch {
      return t;
    }
  };

  const handleBook = (cls: ScheduleClass) => {
    setSelectedClass({
      id: cls.id,
      time: formatTime(cls.time),
      type: cls.name,
      instructor: cls.instructor,
      spots: cls.spots,
      duration: `${cls.duration} min`,
      date: parseISO(cls.time),
      is_free: cls.isFree,
      free_label: cls.freeLabel,
    });
    setDialogOpen(true);
  };

  return (
    <section id="horarios" className="bg-background py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end mb-12">
          <div>
            <span className="text-sm font-body text-balance-olive tracking-widest uppercase mb-4 block">
              calendario
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-balance">
              Reserva tu espacio en una clase de 6.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarDays, label: '6 clases al día', value: '3 mañana · 3 tarde' },
              { icon: Layers3, label: '6 lugares', value: 'por clase' },
              { icon: Clock, label: 'Cancelación', value: '5 horas antes' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-card p-4 ring-1 ring-border/70">
                <item.icon className="h-4 w-4 text-balance-olive mb-4" />
                <p className="font-body text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="font-heading text-xl text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] bg-black/[0.035] p-1.5">
          <div className="rounded-[1.55rem] bg-[#F9F6EE] p-4 sm:p-6 lg:p-8 ring-1 ring-black/5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-7">
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                </p>
                <h3 className="font-heading text-3xl text-foreground mt-1">
                  {filteredClasses.length} clase{filteredClasses.length !== 1 ? 's' : ''} disponible{filteredClasses.length !== 1 ? 's' : ''}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
                  className="h-10 w-10 rounded-full bg-background text-foreground ring-1 ring-border hover:bg-muted transition-colors"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4 mx-auto" />
                </button>
                <span className="min-w-[140px] text-center font-body text-xs font-semibold uppercase tracking-[0.18em] text-balance-olive">
                  {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </span>
                <button
                  onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
                  className="h-10 w-10 rounded-full bg-background text-foreground ring-1 ring-border hover:bg-muted transition-colors"
                  aria-label="Semana siguiente"
                >
                  <ChevronRight className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-7">
              {weekDays.map((day) => {
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);
                const past = isPast(day) && !today;
                const count = getClassCount(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      if (!past) {
                        setSelectedDate(day);
                        setFilter('all');
                        setRoomFilter('all');
                      }
                    }}
                    disabled={past}
                    className={`min-h-[86px] rounded-2xl p-2 text-center transition-all duration-300 ${
                      selected
                        ? 'bg-balance-olive text-white shadow-[0_18px_40px_rgba(126,133,121,0.24)]'
                        : past
                          ? 'bg-muted/45 text-muted-foreground/45'
                          : 'bg-background text-foreground ring-1 ring-border hover:-translate-y-0.5 hover:ring-balance-olive/40'
                    }`}
                  >
                    <span className={`block font-body text-[10px] uppercase tracking-[0.14em] ${selected ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE', { locale: es })}
                    </span>
                    <span className="block font-heading text-3xl leading-none mt-2">{format(day, 'd')}</span>
                    <span className={`mt-3 mx-auto flex h-5 w-max min-w-5 items-center justify-center rounded-full px-2 font-body text-[10px] ${
                      selected ? 'bg-white/15 text-white' : today ? 'bg-balance-olive/10 text-balance-olive' : 'bg-muted text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
              {[
                { id: 'all', label: 'Todas las salas' },
                { id: 'Wunda', label: 'Wunda' },
                { id: 'Barre', label: 'Barre' },
                { id: 'Hot Room', label: 'Hot Room' },
              ].map((room) => (
                <button
                  key={room.id}
                  onClick={() => { setRoomFilter(room.id); setFilter('all'); }}
                  className={`shrink-0 rounded-full px-5 py-2 font-body text-xs font-semibold transition-all ${
                    roomFilter === room.id
                      ? 'bg-balance-olive/20 text-balance-olive ring-1 ring-balance-olive/40'
                      : 'bg-background text-muted-foreground ring-1 ring-border hover:text-foreground'
                  }`}
                >
                  {room.label}
                </button>
              ))}
            </div>

            {dayClasses.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-8">
                <button
                  onClick={() => setFilter('all')}
                  className={`shrink-0 rounded-full px-5 py-2 font-body text-xs font-semibold transition-all ${
                    filter === 'all' ? 'bg-balance-dark text-white' : 'bg-background text-muted-foreground ring-1 ring-border hover:text-foreground'
                  }`}
                >
                  Todas
                </button>
                {uniqueTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`shrink-0 rounded-full px-5 py-2 font-body text-xs font-semibold transition-all ${
                      filter === type ? 'bg-balance-dark text-white' : 'bg-background text-muted-foreground ring-1 ring-border hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-balance-olive" />
              </div>
            )}

            {!isLoading && filteredClasses.length === 0 && (
              <div className="rounded-3xl bg-background p-10 text-center ring-1 ring-border">
                <p className="font-heading text-2xl text-foreground">No hay clases disponibles este día</p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 rounded-full bg-balance-olive px-6 py-3 font-body text-sm font-semibold text-white"
                >
                  Ver todas
                </button>
              </div>
            )}

            {!isLoading && groupedClasses.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {groupedClasses.map((group) => (
                  <div key={group.label} className="rounded-3xl bg-background p-5 ring-1 ring-border">
                    <div className="flex items-end justify-between border-b border-border pb-4 mb-4">
                      <div>
                        <h4 className="font-heading text-3xl text-foreground">{group.label}</h4>
                        <p className="font-body text-xs uppercase tracking-[0.16em] text-muted-foreground mt-1">{group.detail}</p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 font-body text-xs text-muted-foreground">
                        {group.classes.length} clases
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.classes.map((cls) => {
                        // Display-only "filling up" look for the public landing: classes appear
                        // semi-full (busy but still bookable), varied per class so they don't all
                        // look identical; Thursday shows a couple more spots open. Cosmetic only —
                        // real availability in the client app (/app) is unaffected.
                        const classDow = new Date(cls.time.slice(0, 10) + 'T12:00:00').getDay();
                        const seed = cls.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
                        const fakeFree = classDow === 4 ? 2 + (seed % 2) : 1 + (seed % 3); // Jue: 2-3, resto: 1-3
                        const displaySpots = Math.min(fakeFree, cls.maxSpots);
                        const isFull = displaySpots === 0;
                        const timeStatus = getTimeStatus(cls);
                        const classPast = timeStatus?.status === 'past';
                        const classInProgress = timeStatus?.status === 'in-progress';
                        const canBook = !classPast && !classInProgress && !isFull;
                        const spotsPercent = ((cls.maxSpots - displaySpots) / cls.maxSpots) * 100;

                        return (
                          <article
                            key={cls.id}
                            style={cls.theme === 'mexico' ? { background: 'linear-gradient(135deg, rgba(0,104,71,0.16) 0%, rgba(255,255,255,0.82) 45%, rgba(206,17,38,0.16) 100%)' } : undefined}
                            className={`relative overflow-hidden rounded-2xl p-4 ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(51,42,34,0.08)] ${
                              cls.theme === 'mexico' ? 'ring-[#006847]/40' : cls.isFree ? 'bg-green-50 ring-green-200' : 'bg-[#FCFAF5] ring-border'
                            } ${canBook ? '' : 'opacity-65'}`}
                          >
                            <div
                              className="absolute left-0 top-0 h-full w-1.5"
                              style={cls.theme === 'mexico'
                                ? { background: 'linear-gradient(180deg,#006847 0 33.3%,#ffffff 33.3% 66.6%,#CE1126 66.6% 100%)' }
                                : { backgroundColor: cls.isFree ? '#16a34a' : cls.color }}
                            />
                            <div className="flex items-start justify-between gap-4 pl-3">
                              <div className="min-w-0">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  {cls.theme === 'mexico' && (
                                    <span className="inline-flex rounded-full bg-balance-cream px-2.5 py-1 font-body text-[10px] font-bold tracking-wide">
                                      🇲🇽 Especial
                                    </span>
                                  )}
                                  {cls.isFree && (
                                    <span className="inline-flex rounded-full bg-green-600 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-white">
                                      {cls.freeLabel || 'Gratis'}
                                    </span>
                                  )}
                                  {timeStatus && (
                                    <span className={`inline-flex rounded-full px-2.5 py-1 font-body text-[10px] font-semibold ${
                                      classPast ? 'bg-muted text-muted-foreground' : 'bg-balance-olive/10 text-balance-olive'
                                    }`}>
                                      {timeStatus.label}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-heading text-2xl text-foreground">{cls.name}</h5>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-balance-olive" />
                                    {formatTime(cls.time)} - {cls.endTime}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-balance-olive" />
                                    {cls.instructor}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-balance-olive" />
                                    {cls.facilityName || 'Studio'}
                                  </span>
                                </div>
                              </div>

                              {canBook ? (
                                <button
                                  onClick={() => handleBook(cls)}
                                  className={`shrink-0 rounded-full px-5 py-2.5 font-body text-xs font-semibold text-white transition-transform active:scale-[0.98] ${
                                    cls.isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-balance-olive hover:bg-balance-olive/90'
                                  }`}
                                >
                                  {cls.isFree ? 'Reservar gratis' : 'Reservar'}
                                </button>
                              ) : (
                                <span className="shrink-0 rounded-full bg-muted px-4 py-2 font-body text-xs font-semibold text-muted-foreground">
                                  {isFull ? 'Llena' : classInProgress ? 'En curso' : 'Finalizada'}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 pl-3">
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${spotsPercent}%`, backgroundColor: cls.color }}
                                />
                              </div>
                              <p className="mt-2 text-right font-body text-[11px] text-muted-foreground">
                                {displaySpots} / {cls.maxSpots} lugares libres
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-balance-dark p-7 text-center text-white">
          <p className="font-heading text-2xl">Créditos con vigencia de 1 mes</p>
          <p className="mx-auto mt-2 max-w-xl font-body text-sm text-white/70">
            Puedes cancelar hasta 5 horas antes. Si no asistes o cancelas tarde, se descuenta el crédito reservado.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex rounded-full bg-white px-6 py-3 font-body text-sm font-semibold text-balance-dark"
          >
            Entrar para reservar
          </Link>
        </div>
      </div>

      <BookingDialog classData={selectedClass} open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
