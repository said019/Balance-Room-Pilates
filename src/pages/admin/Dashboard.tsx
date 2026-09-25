import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowTopRightIcon,
    CalendarIcon,
    CheckCircledIcon,
    ChevronRightIcon,
    ClockIcon,
    CrossCircledIcon,
    FileTextIcon,
    HeartIcon,
    IdCardIcon,
    PersonIcon,
    PlusIcon,
    TokensIcon,
} from '@radix-ui/react-icons';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';
import type { AdminStats, Membership } from '@/types/auth';
import type { Order } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type BirthdayMember = {
    id: string;
    display_name: string;
    date_of_birth: string;
};

type Metric = {
    title: string;
    value: string | number;
    detail: string;
    icon: React.ElementType;
};

export default function AdminDashboard() {
    const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get('/admin/stats')).data,
    });
    const { data: memberships, isLoading: membershipsLoading, isError: membershipsError } = useQuery<Membership[]>({
        queryKey: ['recent-memberships'],
        queryFn: async () => (await api.get('/memberships')).data,
    });
    const { data: pendingOrders, isLoading: ordersLoading, isError: ordersError } = useQuery<Order[]>({
        queryKey: ['pending-orders'],
        queryFn: async () => (await api.get('/orders/pending')).data,
    });
    const { data: birthdays = [] } = useQuery<BirthdayMember[]>({
        queryKey: ['admin-birthdays'],
        queryFn: async () => (await api.get('/admin/birthdays')).data,
    });

    const recentMemberships = memberships?.slice(0, 5) || [];
    const pendingMemberships = memberships?.filter((membership) =>
        membership.status === 'pending_payment' || membership.status === 'pending_activation'
    ).length || 0;
    const pendingVerificationOrders = pendingOrders?.filter((order) =>
        order.status === 'pending_verification' || order.status === 'pending_payment'
    ) || [];
    const totalAttention = pendingVerificationOrders.length + pendingMemberships;

    const grossToday = (stats as AdminStats & { revenueGross?: number })?.revenueGross ?? stats?.revenue ?? 0;
    const netToday = (stats as AdminStats & { revenueNet?: number })?.revenueNet ?? stats?.revenue ?? 0;
    const cardFeesToday = (stats as AdminStats & { revenueCardFees?: number })?.revenueCardFees ?? 0;

    const metrics: Metric[] = [
        { title: 'Clases', value: stats?.scheduledClasses || 0, detail: 'programadas hoy', icon: CalendarIcon },
        { title: 'Reservas', value: stats?.confirmedBookings || 0, detail: 'lugares confirmados', icon: PersonIcon },
        { title: 'Paquetes', value: stats?.activeMemberships || 0, detail: 'miembros con créditos', icon: IdCardIcon },
        {
            title: 'Ingreso bruto',
            value: formatMoney(grossToday),
            detail: cardFeesToday > 0 ? `Neto ${formatMoney(netToday)}` : 'sin comisión de tarjeta',
            icon: TokensIcon,
        },
    ];

    const hasQueryError = statsError || membershipsError || ordersError;

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <div className="mx-auto max-w-[1480px] space-y-5 pb-4 sm:space-y-6">
                    <header className="animate-fade-up flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-altitud-olive">
                                <span className="relative flex h-2 w-2" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-altitud-olive/40 motion-reduce:animate-none" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-altitud-olive" />
                                </span>
                                Operación en vivo
                            </div>
                            <h1 className="mt-2 text-[2.15rem] font-heading leading-none text-altitud-dark sm:text-[2.65rem]">Pulso del studio</h1>
                            <p className="mt-2 text-sm capitalize text-altitud-dark/65 sm:text-base">
                                {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                            </p>
                        </div>

                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                            <Link
                                to="/admin/calendar"
                                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] border border-altitud-sand/70 bg-[hsl(var(--admin-panel))] px-4 text-sm font-semibold text-altitud-dark transition-all duration-300 hover:-translate-y-0.5 hover:border-altitud-olive/45 hover:bg-altitud-cream active:translate-y-0 active:scale-[0.98]"
                            >
                                <CalendarIcon className="h-4 w-4" /> Calendario
                            </Link>
                            <Link
                                to="/admin/payments?tab=manual-income"
                                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.9rem] bg-altitud-dark px-4 text-sm font-semibold text-altitud-cream transition-all duration-300 hover:-translate-y-0.5 hover:bg-altitud-olive active:translate-y-0 active:scale-[0.98]"
                            >
                                <PlusIcon className="h-4 w-4" /> Registrar ingreso
                            </Link>
                        </div>
                    </header>

                    {hasQueryError && <DashboardError />}

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
                        <div className="animate-fade-up delay-100 overflow-hidden rounded-[1.75rem] border border-altitud-sand/65 bg-[hsl(var(--admin-panel))] shadow-[0_24px_70px_-58px_rgba(28,28,25,0.7)]">
                            <div className="flex flex-col gap-4 border-b border-altitud-sand/55 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-altitud-dark/55">Hoy en números</p>
                                    <h2 className="mt-1 font-heading text-2xl text-altitud-dark">Actividad del día</h2>
                                </div>
                                <Link to="/admin/reports/overview" className="group inline-flex w-fit items-center gap-2 text-xs font-semibold text-altitud-olive transition-colors hover:text-altitud-dark">
                                    Ver reportes
                                    <ArrowTopRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4">
                                {metrics.map((metric, index) => <MetricCell key={metric.title} metric={metric} loading={statsLoading} index={index} />)}
                            </div>
                            <StudioDistribution studios={stats?.classesByStudio || []} loading={statsLoading} />
                        </div>

                        <AttentionCenter
                            total={totalAttention}
                            payments={pendingVerificationOrders.length}
                            memberships={pendingMemberships}
                        />
                    </section>

                    <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                        <PanelShell title="Movimientos recientes" description="Altas, renovaciones y cambios de paquete" to="/admin/memberships" action="Ver membresías">
                            <div className="divide-y divide-altitud-sand/45">
                                {membershipsLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => <ListSkeleton key={index} />)
                                ) : recentMemberships.length > 0 ? (
                                    recentMemberships.map((membership) => <MembershipRow key={membership.id} membership={membership} />)
                                ) : (
                                    <EmptyState icon={IdCardIcon} title="Sin movimientos recientes" text="Las nuevas asignaciones aparecerán aquí." />
                                )}
                            </div>
                        </PanelShell>

                        <PanelShell title="Cobros por resolver" description="Transferencias que necesitan validación" to="/admin/payments" action="Abrir pagos" accent>
                            <div className="divide-y divide-altitud-sand/45">
                                {ordersLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => <ListSkeleton key={index} />)
                                ) : pendingVerificationOrders.length > 0 ? (
                                    pendingVerificationOrders.slice(0, 5).map((order) => <PaymentRow key={order.id} order={order} />)
                                ) : (
                                    <EmptyState icon={CheckCircledIcon} title="Cobros al día" text="No hay pagos pendientes de verificar." />
                                )}
                            </div>
                        </PanelShell>
                    </section>

                    {birthdays.length > 0 && <BirthdayRail birthdays={birthdays} />}
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}

function MetricCell({ metric, loading, index }: { metric: Metric; loading: boolean; index: number }) {
    const Icon = metric.icon;
    const isRevenue = index === 3;
    return (
        <div className={`group min-w-0 border-altitud-sand/45 px-4 py-5 transition-colors duration-300 sm:px-6 sm:py-7 ${index % 2 === 1 ? 'border-l' : ''} ${index >= 2 ? 'border-t sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l' : ''} ${isRevenue ? 'bg-altitud-dark text-altitud-cream' : 'hover:bg-altitud-cream/55'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${isRevenue ? 'text-altitud-sand' : 'text-altitud-dark/55'}`}>{metric.title}</span>
                <Icon className={`h-4 w-4 shrink-0 ${isRevenue ? 'text-altitud-sand' : 'text-altitud-olive'}`} />
            </div>
            {loading ? (
                <Skeleton className="mt-5 h-9 w-20 rounded-md bg-altitud-sand/25" />
            ) : (
                <p className={`mt-4 break-words font-heading text-[2rem] leading-none tabular-nums tracking-[-0.04em] sm:text-[2.45rem] ${isRevenue ? 'text-altitud-cream' : 'text-altitud-dark'}`}>{metric.value}</p>
            )}
            <p className={`mt-2 text-xs leading-4 ${isRevenue ? 'text-altitud-cream/65' : 'text-altitud-dark/60'}`}>{metric.detail}</p>
        </div>
    );
}

function StudioDistribution({ studios, loading }: { studios: AdminStats['classesByStudio']; loading: boolean }) {
    const maxCount = Math.max(1, ...studios.map((studio) => Number(studio.count) || 0));
    return (
        <div className="border-t border-altitud-sand/55 px-5 py-5 sm:px-7 sm:py-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-altitud-dark">Clases por studio</p>
                    <p className="mt-0.5 text-xs text-altitud-dark/55">Distribución de la jornada</p>
                </div>
                <span className="rounded-full bg-altitud-olive/10 px-3 py-1 text-xs font-semibold text-altitud-olive">
                    {studios.reduce((total, studio) => total + Number(studio.count || 0), 0)} en total
                </span>
            </div>
            {loading ? (
                <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></div>
            ) : studios.length > 0 ? (
                <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {studios.map((studio) => {
                        const count = Number(studio.count) || 0;
                        return (
                            <div key={studio.facilityId}>
                                <div className="flex items-center justify-between gap-4 text-sm">
                                    <span className="truncate font-medium text-altitud-dark/75">{studio.name}</span>
                                    <span className="font-heading text-xl tabular-nums text-altitud-dark">{count}</span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-altitud-sand/25">
                                    <div className="h-full origin-left rounded-full bg-altitud-olive transition-transform duration-700" style={{ transform: `scaleX(${count / maxCount})` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="rounded-xl border border-dashed border-altitud-sand/70 px-4 py-5 text-sm text-altitud-dark/60">Aún no hay clases programadas para hoy.</p>
            )}
        </div>
    );
}

function AttentionCenter({ total, payments, memberships }: { total: number; payments: number; memberships: number }) {
    const items = [
        { label: 'Pagos por revisar', value: payments, to: '/admin/payments', icon: TokensIcon },
        { label: 'Paquetes pendientes', value: memberships, to: '/admin/memberships/pending', icon: IdCardIcon },
    ];
    return (
        <aside className="animate-fade-up delay-200 flex min-h-full flex-col overflow-hidden rounded-[1.75rem] bg-altitud-dark p-5 text-altitud-cream shadow-[0_26px_72px_-54px_rgba(28,28,25,0.85)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-altitud-sand">Centro de atención</p>
                    <h2 className="mt-2 font-heading text-2xl text-altitud-cream">{total > 0 ? 'Hay decisiones pendientes' : 'Todo está en orden'}</h2>
                </div>
                <span className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-heading text-lg tabular-nums ${total > 0 ? 'bg-altitud-sand text-altitud-dark' : 'bg-altitud-cream/10 text-altitud-cream'}`}>{total}</span>
            </div>

            <div className="mt-6 divide-y divide-altitud-cream/10 border-y border-altitud-cream/10">
                {items.map((item) => {
                    const Icon = item.icon;
                    const pending = item.value > 0;
                    return (
                        <Link key={item.label} to={item.to} className="group flex min-h-[4.1rem] items-center gap-3 py-3 transition-colors duration-300 hover:text-altitud-sand active:scale-[0.99]">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] ${pending ? 'bg-altitud-sand/15 text-altitud-sand' : 'bg-altitud-cream/[0.06] text-altitud-cream/45'}`}>
                                {pending ? <Icon className="h-4 w-4" /> : <CheckCircledIcon className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0 flex-1 text-sm font-semibold">{item.label}</span>
                            <span className={`font-heading text-xl tabular-nums ${pending ? 'text-altitud-cream' : 'text-altitud-cream/45'}`}>{item.value}</span>
                            <ChevronRightIcon className="h-4 w-4 text-altitud-cream/35 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-altitud-sand" />
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Link to="/admin/payments" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] bg-altitud-cream px-4 text-sm font-semibold text-altitud-dark transition-all duration-300 hover:bg-altitud-sand active:scale-[0.98]">
                    Revisar operación <ArrowTopRightIcon className="h-4 w-4" />
                </Link>
                <Link to="/admin/payments?tab=register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.85rem] border border-altitud-cream/20 px-4 text-sm font-semibold text-altitud-cream transition-all duration-300 hover:bg-altitud-cream/10 active:scale-[0.98]">Registrar pago</Link>
            </div>
        </aside>
    );
}

function PanelShell({ title, description, to, action, children, accent = false }: { title: string; description: string; to: string; action: string; children: React.ReactNode; accent?: boolean }) {
    return (
        <section className={`animate-fade-up delay-300 overflow-hidden rounded-[1.6rem] border bg-[hsl(var(--admin-panel))] shadow-[0_22px_68px_-58px_rgba(28,28,25,0.72)] ${accent ? 'border-altitud-olive/35' : 'border-altitud-sand/65'}`}>
            <div className="flex flex-col gap-3 border-b border-altitud-sand/50 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                <div><h2 className="font-heading text-xl text-altitud-dark">{title}</h2><p className="mt-1 text-sm text-altitud-dark/60">{description}</p></div>
                <Link to={to} className="group inline-flex w-fit items-center gap-2 text-xs font-semibold text-altitud-olive transition-colors hover:text-altitud-dark">
                    {action}<ArrowTopRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
            </div>
            <div className="px-5 py-2 sm:px-6">{children}</div>
        </section>
    );
}

function MembershipRow({ membership }: { membership: Membership }) {
    return (
        <Link to={`/admin/members/${membership.user_id || ''}`} className="group flex items-center gap-3 py-4 transition-all duration-300 hover:pl-1 active:scale-[0.995]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-altitud-olive/10 text-altitud-olive"><PersonIcon className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-altitud-dark transition-colors group-hover:text-altitud-olive">{membership.user_name}</span>
                <span className="mt-0.5 block truncate text-xs text-altitud-dark/60">{membership.plan_name} · {translateMembershipStatus(membership.status)}</span>
            </span>
            <span className="shrink-0 text-xs text-altitud-dark/55">{new Date(membership.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-altitud-dark/30 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
    );
}

function PaymentRow({ order }: { order: Order }) {
    const isVerification = order.status === 'pending_verification';
    return (
        <Link to="/admin/payments" className="group flex items-center gap-3 py-4 transition-all duration-300 hover:pl-1 active:scale-[0.995]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-altitud-sand/30 text-altitud-dark"><FileTextIcon className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-altitud-dark transition-colors group-hover:text-altitud-olive">{order.user_name}</span>
                <span className="mt-0.5 block truncate text-xs text-altitud-dark/60">{order.plan_name} · {formatMoney(Number(order.total))}</span>
            </span>
            <span className="shrink-0 text-right">
                <Badge variant="outline" className="rounded-full border-altitud-sand/80 bg-altitud-sand/20 text-[10px] text-altitud-dark/70"><ClockIcon className="mr-1 h-3 w-3" />{isVerification ? 'Verificar' : 'Cobrar'}</Badge>
                <span className="mt-1 block text-[11px] text-altitud-dark/50">{format(parseISO(order.created_at), 'd MMM', { locale: es })}</span>
            </span>
        </Link>
    );
}

function BirthdayRail({ birthdays }: { birthdays: BirthdayMember[] }) {
    return (
        <section className="animate-fade-up delay-400 overflow-hidden rounded-[1.6rem] border border-altitud-sand/65 bg-[hsl(var(--admin-panel))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex shrink-0 items-center gap-3 lg:w-64">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-altitud-olive/10 text-altitud-olive"><HeartIcon className="h-5 w-5" /></span>
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-altitud-olive">Comunidad</p><h2 className="font-heading text-lg text-altitud-dark">Cumpleaños del mes</h2></div>
                </div>
                <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {birthdays.map((member) => {
                        const birthday = new Date(member.date_of_birth);
                        const day = birthday.getUTCDate();
                        const isToday = day === new Date().getDate();
                        return (
                            <Link key={member.id} to={`/admin/members/${member.id}`} className={`flex items-center gap-3 rounded-[0.95rem] px-3 py-2.5 transition-all duration-300 active:scale-[0.98] ${isToday ? 'bg-altitud-dark text-altitud-cream' : 'bg-altitud-cream/60 text-altitud-dark hover:bg-altitud-cream'}`}>
                                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-lg tabular-nums ${isToday ? 'bg-altitud-cream text-altitud-dark' : 'bg-altitud-sand/30'}`}>{day}</span>
                                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{member.display_name}</span><span className={`block truncate text-xs ${isToday ? 'text-altitud-sand' : 'text-altitud-dark/55'}`}>{isToday ? 'Cumple años hoy' : format(birthday, 'MMMM', { locale: es })}</span></span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function EmptyState({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
    return (
        <div className="flex min-h-[11rem] flex-col items-center justify-center px-6 py-8 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-altitud-olive/10 text-altitud-olive"><Icon className="h-5 w-5" /></span>
            <p className="text-sm font-semibold text-altitud-dark">{title}</p><p className="mt-1 max-w-[30ch] text-xs leading-5 text-altitud-dark/55">{text}</p>
        </div>
    );
}

function DashboardError() {
    return (
        <div role="alert" className="flex items-start gap-3 rounded-[1rem] border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-altitud-dark">
            <CrossCircledIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div><p className="text-sm font-semibold">Parte de la información no pudo actualizarse</p><p className="mt-0.5 text-xs text-altitud-dark/60">Puedes seguir usando el panel; vuelve a cargar para intentar de nuevo.</p></div>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="flex items-center gap-3 py-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-44 max-w-full rounded-full" /><Skeleton className="h-3 w-28 max-w-full rounded-full" /></div></div>
    );
}

function formatMoney(value: number) { return `$${Number(value || 0).toLocaleString('es-MX')}`; }

function translateMembershipStatus(status: string) {
    if (status === 'active') return 'Activa';
    if (status === 'pending_payment') return 'Pendiente de pago';
    if (status === 'pending_activation') return 'Pendiente de activación';
    return status;
}
