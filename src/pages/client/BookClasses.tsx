import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isSameDay, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import type { Class } from '@/types/class';
import type { BookingClient } from '@/types/booking';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Users, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const DAYS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

export default function BookClasses() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const navigate = useNavigate();

    useEffect(() => {
        setWeekStart(startOfWeek(currentDate, { weekStartsOn: 0 }));
    }, [currentDate]);

    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const { data: classes, isLoading } = useQuery<Class[]>({
        queryKey: ['classes-public', startStr, endStr],
        queryFn: async () => {
            const { data } = await api.get(`/classes?start=${startStr}&end=${endStr}`);
            return data;
        },
        // Always refetch when the user navigates to this view or switches weeks —
        // class availability changes second-to-second so stale data is misleading.
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const { data: myBookings } = useQuery<BookingClient[]>({
        queryKey: ['my-bookings'],
        queryFn: async () => (await api.get('/bookings/my-bookings')).data,
    });

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const getClassesForDay = (day: Date) => {
        return classes
            ?.filter(c => isSameDay(parseISO(c.date), day))
            .filter(c => roomFilter === 'all' || c.facility_name === roomFilter)
            .sort((a, b) => a.start_time.localeCompare(b.start_time)) || [];
    };

    const isBooked = (classId: string) => {
        return myBookings?.some(b => b.class_id === classId && b.booking_status !== 'cancelled');
    };

    const isClassPast = (c: Class) => {
        const classDateTime = parseISO(`${c.date.slice(0, 10)}T${c.start_time}`);
        return classDateTime.getTime() <= Date.now();
    };
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const activeClasses = (classes?.filter((c) => c.status !== 'cancelled') || [])
        .filter(c => roomFilter === 'all' || c.facility_name === roomFilter);
    const availableClasses = activeClasses.filter((c) => c.current_bookings < c.max_capacity && !isClassPast(c));
    const weekRange = `${format(weekStart, 'd MMM', { locale: es })} al ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}`;

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="space-y-5 pb-8">
                    <section className="overflow-hidden rounded-[2rem] border border-balance-olive/25 bg-balance-olive/10 shadow-[0_22px_72px_-58px_rgba(51,42,34,0.75)]">
                        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-balance-olive/25 bg-balance-cream/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Agenda boutique
                                </div>
                                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance-dark sm:text-4xl">Reservar clase</h1>
                                <p className="mt-1 text-sm text-balance-dark/62">{weekRange}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:min-w-[18rem]">
                                <div className="rounded-[1.15rem] border border-balance-olive/16 bg-balance-cream/60 px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-balance-dark/46">Disponibles</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums text-balance-dark">{availableClasses.length}</p>
                                </div>
                                <div className="rounded-[1.15rem] border border-balance-olive/16 bg-balance-cream/60 px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-balance-dark/46">Semana</p>
                                    <p className="mt-1 text-2xl font-semibold tabular-nums text-balance-dark">{activeClasses.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-balance-olive/18 bg-balance-cream/36 p-4">
                            <div className="text-sm font-medium capitalize text-balance-dark/64">
                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                            </div>
                            <div className="flex items-center overflow-hidden rounded-full border border-balance-sand/65 bg-balance-cream/75">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handlePrevWeek}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" className="h-9 rounded-full px-4 text-sm font-semibold" onClick={() => setCurrentDate(new Date())}>
                                    Hoy
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={handleNextWeek}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
                        {[
                            { id: 'all', label: 'Todas' },
                            { id: 'Wunda', label: 'Wunda' },
                            { id: 'Barre', label: 'Barre' },
                            { id: 'Hot Room', label: 'Hot Room' },
                        ].map((room) => (
                            <button
                                key={room.id}
                                onClick={() => setRoomFilter(room.id)}
                                className={cn(
                                    'shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-all',
                                    roomFilter === room.id
                                        ? 'bg-balance-olive text-white'
                                        : 'bg-balance-cream/60 text-balance-dark/70 border border-balance-sand/65 hover:border-balance-olive/40'
                                )}
                            >
                                {room.label}
                            </button>
                        ))}
                    </div>

                    {isLoading && (
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="h-64 animate-pulse rounded-[1.5rem] bg-balance-cream/55" />
                            ))}
                        </div>
                    )}

                    {!isLoading && (
                    <>
                    <div className="sm:hidden">
                        <div className="flex overflow-x-auto gap-2 pb-3 snap-x snap-mandatory -mx-4 px-4">
                            {weekDays.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                const isPastDay = isPast(day) && !isToday;
                                const dayClasses = getClassesForDay(day);

                                return (
                                    <div 
                                        key={`mobile-${i}`}
                                        className={cn(
                                            "w-[170px] flex-shrink-0 snap-start overflow-hidden rounded-[1.4rem] border bg-[hsl(var(--card))]/90 shadow-[0_16px_46px_-38px_rgba(51,42,34,0.7)]",
                                            isToday && "border-balance-olive ring-2 ring-balance-olive/15",
                                            !isToday && "border-balance-sand/65",
                                            isPastDay && "opacity-50"
                                        )}
                                    >
                                        {/* Day header */}
                                        <div className={cn(
                                            "px-3 py-3 text-left",
                                            isToday && "bg-balance-olive text-balance-cream",
                                            !isToday && "bg-balance-cream/55"
                                        )}>
                                            <div className={cn(
                                                "text-[10px] font-medium tracking-wider",
                                                isToday ? "text-balance-cream/80" : "text-balance-dark/52"
                                            )}>
                                                {DAYS[i]}
                                            </div>
                                            <div className={cn(
                                                "text-lg font-bold",
                                                isToday ? "text-balance-cream" : "text-balance-dark"
                                            )}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>

                                        {/* Classes */}
                                        <div className="min-h-[220px] space-y-2 p-2">
                                            {dayClasses.map(c => {
                                                const booked = isBooked(c.id);
                                                const full = c.current_bookings >= c.max_capacity;
                                                const spotsLeft = c.max_capacity - c.current_bookings;
                                                const cancelled = c.status === 'cancelled';
                                                const pastTime = isPastDay || isClassPast(c);

                                                return (
                                                    <button
                                                        key={c.id}
                                                        disabled={cancelled || full || pastTime}
                                                        onClick={() => !booked && !full && !cancelled && !pastTime && navigate(`/app/book/${c.id}`)}
                                                        style={c.theme === 'mexico' && !booked ? { background: 'linear-gradient(135deg, rgba(0,104,71,0.16) 0%, rgba(255,255,255,0.82) 45%, rgba(206,17,38,0.16) 100%)' } : undefined}
                                                        className={cn(
                                                            "w-full overflow-hidden rounded-[1rem] border text-left transition-all duration-200",
                                                            booked && "border-balance-olive/30 bg-balance-olive/10",
                                                            !booked && !full && !cancelled && !pastTime && "cursor-pointer border-balance-sand/65 bg-balance-cream/50 hover:-translate-y-0.5 hover:border-balance-olive/35 hover:bg-balance-cream/80",
                                                            (full || cancelled || pastTime) && !booked && "cursor-not-allowed border-balance-sand/45 bg-muted/40 opacity-60"
                                                        )}
                                                    >
                                                        {c.theme === 'mexico' ? (
                                                            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#006847 0 33.3%,#ffffff 33.3% 66.6%,#CE1126 66.6% 100%)' }} />
                                                        ) : (
                                                            <div className="h-1 w-full" style={{ backgroundColor: c.class_type_color || '#9ca3af' }} />
                                                        )}
                                                        <div className="p-2">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-bold text-sm tabular-nums">{c.start_time.slice(0, 5)}</span>
                                                                {booked && <Check className="h-3 w-3 text-success ml-auto" />}
                                                            </div>
                                                            <p className="text-xs font-medium leading-tight mb-0.5">{c.class_type_name}{c.theme === 'mexico' ? ' 🇲🇽' : ''}</p>
                                                            {c.instructor_name && (
                                                                <p className="text-[10px] text-muted-foreground truncate mb-1">{c.instructor_name}</p>
                                                            )}
                                                            {!booked && (
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Users className="h-3 w-3" />
                                                                    <span className="text-[10px]">
                                                                        {cancelled ? 'Cancelada' : full ? 'Lleno' : pastTime ? 'Pasada' : `${spotsLeft} lugares`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {dayClasses.length === 0 && (
                                                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground italic">
                                                    Sin clases
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop: 7-column grid */}
                    <div className="hidden sm:grid grid-cols-7 gap-2">
                        {/* Day Headers */}
                        {weekDays.map((day, i) => {
                            const isToday = isSameDay(day, new Date());
                            const isPastDay = isPast(day) && !isToday;

                            return (
                                <div 
                                    key={`header-${i}`} 
                                    className={cn(
                                        "rounded-t-[1.4rem] border border-balance-sand/60 px-3 py-3 text-left",
                                        isToday && "border-balance-olive bg-balance-olive text-balance-cream",
                                        !isToday && "bg-balance-cream/55"
                                    )}
                                >
                                    <div className={cn(
                                        "text-[10px] font-medium tracking-wider",
                                        isToday ? "text-balance-cream/80" : "text-balance-dark/52",
                                        isPastDay && "opacity-50"
                                    )}>
                                        {DAYS[i]}
                                    </div>
                                    <div className={cn(
                                        "text-lg font-bold",
                                        isToday ? "text-balance-cream" : "text-balance-dark",
                                        isPastDay && "opacity-50"
                                    )}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Classes for each day */}
                        {weekDays.map((day, i) => {
                            const isToday = isSameDay(day, new Date());
                            const isPastDay = isPast(day) && !isToday;
                            const dayClasses = getClassesForDay(day);

                            return (
                                <div 
                                    key={`classes-${i}`} 
                                    className={cn(
                                        "min-h-[30rem] rounded-b-[1.4rem] border-x border-b border-balance-sand/60 p-2",
                                        isToday && "border-balance-olive/35 bg-balance-olive/8",
                                        !isToday && "bg-[hsl(var(--card))]/88",
                                        isPastDay && "opacity-60"
                                    )}
                                >
                                    <div className="space-y-1.5">
                                        {dayClasses.map(c => {
                                            const booked = isBooked(c.id);
                                            const full = c.current_bookings >= c.max_capacity;
                                            const spotsLeft = c.max_capacity - c.current_bookings;
                                            const cancelled = c.status === 'cancelled';
                                            const pastTime = isPastDay || isClassPast(c);

                                            return (
                                                <button
                                                    key={c.id}
                                                    disabled={cancelled || full || pastTime}
                                                    onClick={() => !booked && !full && !cancelled && !pastTime && navigate(`/app/book/${c.id}`)}
                                                    className={cn(
                                                        "w-full overflow-hidden rounded-[1rem] border text-left transition-all duration-200",
                                                        booked && "border-balance-olive/30 bg-balance-olive/10",
                                                        !booked && !full && !cancelled && !pastTime && "cursor-pointer border-balance-sand/65 bg-balance-cream/45 hover:-translate-y-0.5 hover:border-balance-olive/35 hover:bg-balance-cream/80",
                                                        (full || cancelled || pastTime) && !booked && "cursor-not-allowed border-balance-sand/45 bg-muted/40 opacity-60"
                                                    )}
                                                >
                                                    {/* Color bar */}
                                                    <div
                                                        className="h-1 w-full"
                                                        style={{ backgroundColor: c.is_free ? '#3aa775' : (c.class_type_color || '#9ca3af') }}
                                                    />

                                                    <div className="p-2 sm:p-2.5">
                                                        {/* Time + free badge */}
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span className="font-bold text-sm tabular-nums">
                                                                    {c.start_time.slice(0, 5)}
                                                                </span>
                                                            </div>
                                                            {c.is_free ? (
                                                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                                                                    Gratis
                                                                </span>
                                                            ) : booked && (
                                                                <div className="flex items-center gap-0.5 text-success dark:text-success">
                                                                    <Check className="h-3 w-3" />
                                                                    <span className="hidden text-[10px] font-medium sm:inline">Reservado</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Class name */}
                                                        <p className={cn(
                                                            "text-xs font-medium truncate mb-0.5",
                                                            cancelled && "line-through text-muted-foreground"
                                                        )}>
                                                            {c.class_type_name}
                                                        </p>

                                                        {/* Instructor */}
                                                        {c.instructor_name && (
                                                            <p className="text-[10px] text-muted-foreground truncate mb-1">{c.instructor_name}</p>
                                                        )}

                                                        {/* Spots */}
                                                        {!booked && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Users className="h-3 w-3" />
                                                                <span className="text-[10px]">
                                                                    {cancelled ? 'Cancelada' : full ? 'Lleno' : pastTime ? 'Pasada' : `${spotsLeft} lugares`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}

                                        {dayClasses.length === 0 && (
                                            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground italic">
                                                Sin clases
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-balance-dark/55">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-success/10 to-success/10 border border-success/30" />
                            <span>Reservado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-card border border-border" />
                            <span>Disponible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-muted border border-border" />
                            <span>Lleno / Pasado</span>
                        </div>
                    </div>
                    </>
                    )}
                </div>
            </ClientLayout>
        </AuthGuard>
    );
}
