import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';

type OverviewData = {
    activeMembers: number;
    monthlyBookings: number;
    monthlyExpenses: number;
    netProfit: number;
    weeklyClasses: number;
    newMembers: number;
    attendanceRate: number;
    avgTicketPerClass: number;
};

type IncomeMonth = { month: string; amount: number; count: number };

type Transaction = {
    source: 'payment' | 'event' | 'manual_income';
    id: string;
    occurred_at: string;
    client_name: string;
    client_email: string | null;
    concept: string;
    payment_method: string;
    amount: number;
    currency: string;
    reference: string | null;
    processed_by_name: string | null;
};

type TransactionsData = { transactions: Transaction[]; total: number; count: number };
type SlotRow = { dow: number; slot: string; classes: number; seats: number; booked: number; occupancy: number | null };
type SlotData = { weeks: number; slots: SlotRow[] };

type ClassPerformance = {
    name: string;
    classesTotal: number;
    classesUpcoming: number;
    classesDone: number;
    bookings: number;
    attended: number;
    noShows: number;
    cancelled: number;
};

type CoachPerformance = {
    id: string;
    display_name: string;
    total_classes: string | number;
    total_students: string | number;
    avg_attendance: string | number;
    avg_occupancy: string | number;
    avg_rating: string | number;
};

const numberOf = (value: unknown) => Number(value ?? 0);
const money = (value: unknown) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
}).format(numberOf(value));
const todayKey = () => format(new Date(), 'yyyy-MM-dd');
const monthStartKey = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');

const monthFromRaw = (raw: string) => {
    const match = raw.match(/^(\d{4})-(\d{2})/);
    if (!match) return raw;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, 1, 12);
    const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
    return label.charAt(0).toLocaleUpperCase('es-MX') + label.slice(1);
};

const paymentLabels: Record<string, string> = {
    cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', online: 'En línea', credits: 'Créditos',
};
const sourceLabels: Record<Transaction['source'], string> = {
    payment: 'Paquete', event: 'Evento', manual_income: 'Ingreso manual',
};

function Metric({ label, value, hint, tone = '#7E8579', loading = false }: {
    label: string;
    value: React.ReactNode;
    hint: string;
    tone?: string;
    loading?: boolean;
}) {
    return (
        <div className="rounded-[1.15rem] border border-altitud-sand/55 bg-white/72 px-4 py-3.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">
                <span className="h-1 w-3 rounded-full" style={{ backgroundColor: tone }} />{label}
            </div>
            {loading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-altitud-dark">{value}</p>}
            <p className="mt-1 text-[11px] leading-snug text-altitud-dark/55">{hint}</p>
        </div>
    );
}

export default function Reports() {
    const [rangeStart, setRangeStart] = useState(monthStartKey());
    const [rangeEnd, setRangeEnd] = useState(todayKey());
    const validRange = Boolean(rangeStart && rangeEnd && rangeStart <= rangeEnd);

    const { data: overview, isLoading: loadingOverview } = useQuery<OverviewData>({
        queryKey: ['reports-overview', monthStartKey(), todayKey()],
        queryFn: async () => (await api.get('/reports/overview', { params: { startDate: monthStartKey(), endDate: todayKey() } })).data,
    });
    const { data: incomeHistory = [], isLoading: loadingHistory } = useQuery<IncomeMonth[]>({
        queryKey: ['reports-income-history', 12],
        queryFn: async () => (await api.get('/reports/income-history', { params: { months: 12 } })).data,
    });
    const { data: slots, isLoading: loadingSlots } = useQuery<SlotData>({
        queryKey: ['reports-occupancy-slots', 4],
        queryFn: async () => (await api.get('/reports/occupancy-by-slot', { params: { weeks: 4 } })).data,
    });
    const { data: transactions, isFetching: loadingTransactions } = useQuery<TransactionsData>({
        queryKey: ['reports-transactions', rangeStart, rangeEnd],
        queryFn: async () => (await api.get('/reports/transactions', { params: { startDate: rangeStart, endDate: rangeEnd } })).data,
        enabled: validRange,
    });
    const { data: classRows = [], isLoading: loadingClasses } = useQuery<ClassPerformance[]>({
        queryKey: ['reports-class-performance', rangeStart, rangeEnd],
        queryFn: async () => (await api.get('/reports/class-performance', { params: { startDate: rangeStart, endDate: rangeEnd } })).data,
        enabled: validRange,
    });
    const { data: coachRows = [], isLoading: loadingCoaches } = useQuery<CoachPerformance[]>({
        queryKey: ['reports-instructors', rangeStart, rangeEnd],
        queryFn: async () => (await api.get('/reports/instructors', { params: { startDate: rangeStart, endDate: rangeEnd } })).data,
        enabled: validRange,
    });

    const currentMonth = incomeHistory[incomeHistory.length - 1];
    const previousMonth = incomeHistory[incomeHistory.length - 2];
    const delta = previousMonth && previousMonth.amount > 0
        ? ((numberOf(currentMonth?.amount) - numberOf(previousMonth.amount)) / numberOf(previousMonth.amount)) * 100
        : null;
    const activeMonths = incomeHistory.filter((row) => numberOf(row.amount) > 0 || numberOf(row.count) > 0);
    const historyTotal = incomeHistory.reduce((sum, row) => sum + numberOf(row.amount), 0);
    const historyMovements = incomeHistory.reduce((sum, row) => sum + numberOf(row.count), 0);
    const maxHistoryAmount = Math.max(0, ...incomeHistory.map((row) => numberOf(row.amount)));

    const slotRows = useMemo(() => slots?.slots || [], [slots?.slots]);
    const slotDays = useMemo(() => [...new Set(slotRows.map((row) => row.dow))].sort((a, b) => a - b), [slotRows]);
    const slotHours = useMemo(() => [...new Set(slotRows.map((row) => row.slot))].sort(), [slotRows]);
    const slotIndex = useMemo(() => new Map(slotRows.map((row) => [`${row.dow}|${row.slot}`, row])), [slotRows]);
    const dayLabels: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
    const occupancyColor = (percentage: number) => {
        const from = [243, 238, 226];
        const to = [95, 99, 44];
        const ratio = Math.max(0, Math.min(1, percentage / 100));
        return `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * ratio)).join(',')})`;
    };
    const demandAt = (hour: string) => {
        const rows = slotRows.filter((row) => row.slot === hour && row.classes >= 2);
        const seats = rows.reduce((sum, row) => sum + row.seats, 0);
        return seats > 0 ? rows.reduce((sum, row) => sum + row.booked, 0) / seats : null;
    };
    const highDemand = slotHours.filter((hour) => (demandAt(hour) ?? 0) >= 0.9);
    const lowDemand = slotHours.filter((hour) => demandAt(hour) != null && (demandAt(hour) ?? 1) <= 0.4);
    const dateTime = (raw: string) => {
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="mx-auto max-w-6xl space-y-7">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-altitud-olive">Análisis</p>
                            <h1 className="mt-1 text-3xl font-heading text-altitud-dark">Reportes</h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Ingresos, asistencia y ocupación para tomar decisiones operativas con información de 2707 Altitud.</p>
                        </div>
                        <p className="rounded-full border border-altitud-sand/60 bg-altitud-cream/65 px-3 py-1.5 text-xs font-medium capitalize text-altitud-dark/60">
                            {format(new Date(), 'MMMM yyyy', { locale: es })} · historial de 12 meses
                        </p>
                    </header>

                    <Card className="overflow-hidden border-t-4 border-t-altitud-olive">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Ingresos del mes</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-end gap-4">
                                {loadingHistory ? <Skeleton className="h-12 w-52" /> : <p className="text-4xl font-semibold tabular-nums tracking-[-0.055em] text-altitud-dark sm:text-5xl">{money(currentMonth?.amount)}</p>}
                                {delta == null ? <span className="inline-flex items-center gap-1 rounded-full bg-altitud-sand/35 px-2.5 py-1 text-xs text-altitud-dark/65"><Minus className="h-3 w-3" /> sin comparación</span> : (
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${delta >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                        {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{delta >= 0 ? '+' : ''}{delta.toFixed(1)}% contra el mes anterior
                                    </span>
                                )}
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                                <Metric label="Reservas" value={numberOf(overview?.monthlyBookings)} hint="Registradas durante el mes" loading={loadingOverview} />
                                <Metric label="Asistencia" value={`${numberOf(overview?.attendanceRate)}%`} hint="Check-ins de clases ya impartidas" tone="#5F632C" loading={loadingOverview} />
                                <Metric label="Personas nuevas" value={numberOf(overview?.newMembers)} hint="Altas en el periodo" tone="#7F6146" loading={loadingOverview} />
                                <Metric label="Gastos" value={money(overview?.monthlyExpenses)} hint="Egresos registrados" tone="#B7794B" loading={loadingOverview} />
                                <Metric label="Resultado neto" value={money(overview?.netProfit)} hint={`${numberOf(overview?.activeMembers)} paquetes activos`} tone="#332A22" loading={loadingOverview} />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-altitud-sand/45 pt-3 text-xs text-altitud-dark/65">
                                <span><b className="text-altitud-dark">{numberOf(overview?.weeklyClasses)}</b> clases próximas</span>
                                <span><b className="text-altitud-dark">{money(overview?.avgTicketPerClass)}</b> ingreso promedio por clase vendida</span>
                                <span><b className="text-altitud-dark">{numberOf(currentMonth?.count)}</b> movimientos este mes</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                            <div><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Ocupación por horario</CardTitle><p className="mt-1 text-xs text-altitud-dark/50">Promedio de las últimas {slots?.weeks || 4} semanas</p></div>
                            {slotRows.length > 0 && <div className="flex shrink-0 items-center gap-2 text-[10px] text-altitud-dark/50"><span>0%</span><span className="h-2 w-20 rounded-full" style={{ background: `linear-gradient(90deg, ${occupancyColor(0)}, ${occupancyColor(100)})` }} /><span>100%</span></div>}
                        </CardHeader>
                        <CardContent>
                            {loadingSlots ? <Skeleton className="h-52 w-full" /> : slotRows.length === 0 ? <p className="py-8 text-center text-sm italic text-altitud-dark/55">Todavía no hay clases impartidas en este periodo.</p> : <>
                                <div className="overflow-x-auto"><div className="grid min-w-[520px] gap-1.5" style={{ gridTemplateColumns: `56px repeat(${slotDays.length}, minmax(0, 1fr))` }}>
                                    <div />{slotDays.map((day) => <div key={day} className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-altitud-dark/50">{dayLabels[day]}</div>)}
                                    {slotHours.map((hour) => <Fragment key={hour}><div className="flex items-center text-xs font-semibold tabular-nums text-altitud-dark">{hour}</div>{slotDays.map((day) => {
                                        const row = slotIndex.get(`${day}|${hour}`);
                                        return !row || row.occupancy == null ? <div key={day} className="h-9 rounded-md border border-dashed border-altitud-sand" title="Sin clases en esta franja" /> : <div key={day} className="grid h-9 place-items-center rounded-md text-xs font-semibold tabular-nums" title={`${row.booked} de ${row.seats} lugares en ${row.classes} clases`} style={{ background: occupancyColor(row.occupancy), color: row.occupancy >= 55 ? '#F3EEE2' : '#332A22' }}>{row.occupancy}%</div>;
                                    })}</Fragment>)}
                                </div></div>
                                {(highDemand.length > 0 || lowDemand.length > 0) && <p className="mt-4 border-t border-altitud-sand/45 pt-3 text-xs leading-relaxed text-altitud-dark/65"><b className="text-altitud-dark">Lectura:</b>{' '}{highDemand.length > 0 && `${highDemand.join(', ')} alcanza 90% o más. `}{lowDemand.length > 0 && `${lowDemand.join(', ')} no supera 40%; conviene revisar ese horario.`}</p>}
                            </>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Detalle por fechas</CardTitle><p className="mt-1 text-xs text-altitud-dark/50">Pagos de paquetes, eventos e ingresos manuales en un mismo lugar</p></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                                <div className="grid grid-cols-2 gap-3 sm:w-80">
                                    <label className="space-y-1 text-xs font-medium text-altitud-dark/65"><span>Desde</span><Input aria-label="Fecha inicial" type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} className="min-h-11" /></label>
                                    <label className="space-y-1 text-xs font-medium text-altitud-dark/65"><span>Hasta</span><Input aria-label="Fecha final" type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} className="min-h-11" /></label>
                                </div>
                                <div className="xl:ml-auto xl:text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-altitud-dark/50">Total del periodo</p><p className="text-2xl font-semibold tabular-nums text-altitud-dark">{loadingTransactions ? <Loader2 className="inline h-5 w-5 animate-spin" /> : money(transactions?.total)}</p><p className="text-xs text-altitud-dark/55">{numberOf(transactions?.count)} movimientos</p></div>
                            </div>
                            {!validRange && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">La fecha inicial no puede ser posterior a la final.</p>}
                            {validRange && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-altitud-sand/60 text-[10px] font-semibold uppercase tracking-[0.13em] text-altitud-dark/50"><th className="py-2 pr-3 text-left">Fecha</th><th className="py-2 pr-3 text-left">Persona</th><th className="py-2 pr-3 text-left">Concepto</th><th className="py-2 pr-3 text-left">Origen</th><th className="py-2 pr-3 text-left">Método</th><th className="py-2 text-right">Importe</th></tr></thead><tbody>
                                {loadingTransactions ? <tr><td colSpan={6} className="py-8 text-center text-altitud-dark/55"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando…</td></tr> : !transactions?.transactions.length ? <tr><td colSpan={6} className="py-8 text-center italic text-altitud-dark/55">No hay ingresos en este periodo.</td></tr> : transactions.transactions.map((row) => <tr key={`${row.source}-${row.id}`} className="border-b border-altitud-sand/35 last:border-0"><td className="whitespace-nowrap py-3 pr-3 text-altitud-dark/70">{dateTime(row.occurred_at)}</td><td className="py-3 pr-3"><p className="font-medium text-altitud-dark">{row.client_name}</p><p className="text-xs text-altitud-dark/50">{row.client_email || row.processed_by_name || '—'}</p></td><td className="py-3 pr-3 text-altitud-dark/70">{row.concept}</td><td className="py-3 pr-3 text-altitud-dark/70">{sourceLabels[row.source]}</td><td className="py-3 pr-3 text-altitud-dark/70">{paymentLabels[row.payment_method] || row.payment_method || '—'}</td><td className="py-3 text-right font-semibold tabular-nums text-altitud-dark">{money(row.amount)}</td></tr>)}
                            </tbody></table></div>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-end justify-between gap-4 pb-3"><div><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Ingresos por mes</CardTitle><p className="mt-1 text-xs text-altitud-dark/50">Últimos 12 meses con pagos, eventos e ingresos manuales</p></div><div className="flex gap-5 text-right"><div><p className="text-[10px] uppercase tracking-[0.14em] text-altitud-dark/45">Total 12m</p><p className="font-semibold tabular-nums text-altitud-dark">{money(historyTotal)}</p></div><div className="border-l border-altitud-sand pl-5"><p className="text-[10px] uppercase tracking-[0.14em] text-altitud-dark/45">Movimientos</p><p className="font-semibold tabular-nums text-altitud-dark">{historyMovements}</p></div></div></CardHeader>
                        <CardContent>{loadingHistory ? <Skeleton className="h-64 w-full" /> : activeMonths.length === 0 ? <p className="py-8 text-center italic text-altitud-dark/55">Aún no hay ingresos registrados.</p> : <ul className="divide-y divide-altitud-sand/40">{[...activeMonths].reverse().map((row) => <li key={row.month} className="flex items-center gap-4 py-3"><p className="w-36 shrink-0 text-sm font-medium text-altitud-dark">{monthFromRaw(row.month)}</p><div className="h-2 flex-1 overflow-hidden rounded-full bg-altitud-sand/35"><div className="h-full rounded-full bg-altitud-olive" style={{ width: `${maxHistoryAmount > 0 ? (row.amount / maxHistoryAmount) * 100 : 0}%` }} /></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums text-altitud-dark">{money(row.amount)}</p><p className="text-xs text-altitud-dark/50">{row.count} movimientos</p></div></li>)}</ul>}</CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Desempeño por tipo de clase</CardTitle><p className="mt-1 text-xs text-altitud-dark/50">Resultados del rango seleccionado en Detalle por fechas</p></CardHeader>
                        <CardContent>{loadingClasses ? <Skeleton className="h-48 w-full" /> : classRows.length === 0 ? <p className="py-8 text-center italic text-altitud-dark/55">Sin clases registradas en este periodo.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-altitud-sand/60 text-[10px] font-semibold uppercase tracking-[0.13em] text-altitud-dark/50"><th className="py-2 pr-4 text-left">Clase</th><th className="px-3 py-2 text-right">Próximas</th><th className="px-3 py-2 text-right">Impartidas</th><th className="px-3 py-2 text-right">Reservas</th><th className="px-3 py-2 text-right">Asistencias</th><th className="px-3 py-2 text-right">% asistencia</th><th className="py-2 pl-3 text-right">Canceladas</th></tr></thead><tbody>{classRows.map((row) => {
                            const rate = row.bookings > 0 ? Math.round((row.attended / row.bookings) * 100) : null;
                            return <tr key={row.name} className="border-b border-altitud-sand/35 last:border-0"><td className="py-3 pr-4 font-medium text-altitud-dark">{row.name}</td><td className="px-3 text-right tabular-nums text-altitud-dark/65">{row.classesUpcoming}</td><td className="px-3 text-right tabular-nums text-altitud-dark/65">{row.classesDone}</td><td className="px-3 text-right font-semibold tabular-nums text-altitud-dark">{row.bookings}</td><td className="px-3 text-right tabular-nums text-altitud-dark/65">{row.attended}</td><td className="px-3 text-right font-semibold tabular-nums text-altitud-olive">{rate == null ? '—' : `${rate}%`}</td><td className="pl-3 text-right tabular-nums text-altitud-dark/55">{row.cancelled}</td></tr>;
                        })}</tbody></table></div>}</CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-altitud-dark/55">Coaches</CardTitle><p className="mt-1 text-xs text-altitud-dark/50">Actividad del rango seleccionado</p></CardHeader>
                        <CardContent>{loadingCoaches ? <Skeleton className="h-48 w-full" /> : coachRows.length === 0 ? <p className="py-8 text-center italic text-altitud-dark/55">Sin coaches activos.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-altitud-sand/60 text-[10px] font-semibold uppercase tracking-[0.13em] text-altitud-dark/50"><th className="py-2 pr-4 text-left">Coach</th><th className="px-3 py-2 text-right">Clases</th><th className="px-3 py-2 text-right">Reservas</th><th className="px-3 py-2 text-right">Promedio</th><th className="px-3 py-2 text-right">Ocupación</th><th className="py-2 pl-3 text-right">Calificación</th></tr></thead><tbody>{coachRows.map((row) => <tr key={row.id} className="border-b border-altitud-sand/35 last:border-0"><td className="py-3 pr-4 font-medium text-altitud-dark">{row.display_name}</td><td className="px-3 text-right font-semibold tabular-nums text-altitud-dark">{numberOf(row.total_classes)}</td><td className="px-3 text-right tabular-nums text-altitud-dark/65">{numberOf(row.total_students)}</td><td className="px-3 text-right tabular-nums text-altitud-dark/65">{numberOf(row.avg_attendance).toFixed(1)}</td><td className="px-3 text-right font-semibold tabular-nums text-altitud-olive">{Math.round(numberOf(row.avg_occupancy))}%</td><td className="pl-3 text-right tabular-nums text-altitud-dark/65">{numberOf(row.avg_rating) > 0 ? `${numberOf(row.avg_rating).toFixed(1)} ★` : '—'}</td></tr>)}</tbody></table></div>}</CardContent>
                    </Card>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
