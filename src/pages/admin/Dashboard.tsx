import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import api from '@/lib/api';
import type { AdminStats, Membership } from '@/types/auth';
import type { Order } from '@/types/order';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Users,
    CreditCard,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    CheckCircle2,
    UserPlus,
    Receipt,
    Clock,
    Banknote,
    Sparkles,
    Ticket,
    Cake,
    ArrowUpRight,
    Dumbbell,
    BadgeCheck,
} from 'lucide-react';

const panelMotion = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
    const { user } = useAuthStore();

    const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        },
    });

    const { data: memberships, isLoading: membershipsLoading } = useQuery<Membership[]>({
        queryKey: ['recent-memberships'],
        queryFn: async () => {
            const { data } = await api.get('/memberships');
            return data;
        },
    });

    const { data: pendingOrders, isLoading: ordersLoading } = useQuery<Order[]>({
        queryKey: ['pending-orders'],
        queryFn: async () => {
            const { data } = await api.get('/orders/pending');
            return data;
        },
    });

    const { data: pendingEventRegs = [] } = useQuery<any[]>({
        queryKey: ['pending-event-registrations'],
        queryFn: async () => {
            const { data } = await api.get('/events/registrations/pending');
            return data;
        },
    });

    const { data: birthdays = [] } = useQuery<any[]>({
        queryKey: ['admin-birthdays'],
        queryFn: async () => {
            const { data } = await api.get('/admin/birthdays');
            return data;
        },
    });

    const recentMemberships = memberships?.slice(0, 5) || [];
    const pendingMemberships = memberships?.filter(m =>
        m.status === 'pending_payment' || m.status === 'pending_activation'
    ).length || 0;

    const pendingVerificationOrders = pendingOrders?.filter(o =>
        o.status === 'pending_verification' || o.status === 'pending_payment'
    ) || [];

    const firstName = user?.display_name?.split(' ')[0] || 'equipo';
    const totalAttention = pendingVerificationOrders.length + pendingMemberships + pendingEventRegs.length;

    const kpis = [
        {
            title: 'Clases hoy',
            value: stats?.scheduledClasses || 0,
            detail: 'sesiones programadas',
            icon: Calendar,
            tone: 'sage',
        },
        {
            title: 'Reservas',
            value: stats?.confirmedBookings || 0,
            detail: 'lugares confirmados',
            icon: Users,
            tone: 'taupe',
        },
        {
            title: 'Paquetes activos',
            value: stats?.activeMemberships || 0,
            detail: 'clientas con créditos',
            icon: BadgeCheck,
            tone: 'cream',
        },
        {
            title: 'Ingresos hoy',
            value: formatMoney(stats?.revenue || 0),
            detail: 'registrado en caja',
            icon: CreditCard,
            tone: 'dark',
        },
    ];

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    transition={{ staggerChildren: 0.055 }}
                    className="space-y-6"
                >
                    <motion.section
                        variants={panelMotion}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]"
                    >
                        <div className="relative overflow-hidden rounded-[2rem] bg-balance-dark p-6 text-balance-cream shadow-[0_24px_80px_-48px_rgba(51,42,34,0.9)] sm:p-8">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(207,200,184,0.26),transparent_28%),radial-gradient(circle_at_86%_2%,rgba(126,133,121,0.34),transparent_32%)]" />
                            <div className="relative grid gap-8 xl:grid-cols-[1fr_21rem]">
                                <div>
                                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-balance-cream/12 bg-balance-cream/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-balance-sand">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Studio en movimiento
                                    </div>
                                    <h2 className="max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-4xl">
                                        Buenos días, {firstName}. Hoy cuidamos agenda, cupos y caja con calma.
                                    </h2>
                                    <p className="mt-4 max-w-[58ch] text-sm leading-6 text-balance-sand/78">
                                        {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}. Cada clase tiene 6 lugares, así que el panel prioriza lo que necesita atención antes de que llegue la siguiente sesión.
                                    </p>
                                </div>

                                <div className="rounded-[1.5rem] border border-balance-cream/12 bg-balance-cream/8 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-balance-sand">Atención</span>
                                        <span className="rounded-full bg-balance-cream px-2.5 py-1 text-xs font-bold text-balance-dark">{totalAttention}</span>
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        <FocusRow icon={Banknote} label="Pagos por revisar" value={pendingVerificationOrders.length} />
                                        <FocusRow icon={AlertCircle} label="Paquetes pendientes" value={pendingMemberships} />
                                        <FocusRow icon={Ticket} label="Eventos pendientes" value={pendingEventRegs.length} />
                                    </div>
                                    <Link
                                        to="/admin/payments"
                                        className="group mt-5 inline-flex w-full items-center justify-between rounded-full bg-balance-cream px-4 py-2.5 text-sm font-semibold text-balance-dark transition-all duration-200 hover:bg-balance-sand active:scale-[0.98]"
                                    >
                                        Revisar operación
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-balance-dark/10 transition-transform group-hover:translate-x-0.5">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] p-5 shadow-[0_20px_70px_-54px_rgba(51,42,34,0.65)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-balance-gold">Capacidad</p>
                                    <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-balance-dark">Estudios pequeños</h3>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-balance-olive/12 text-balance-olive">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-7 grid grid-cols-3 gap-2">
                                {['Yoga', 'Pilates', 'Barre'].map((label) => (
                                    <div key={label} className="rounded-[1rem] bg-balance-cream/75 p-3">
                                        <p className="text-2xl font-semibold tabular-nums tracking-[-0.04em] text-balance-dark">6</p>
                                        <p className="mt-1 text-[11px] font-medium text-balance-dark/55">{label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-5 text-sm leading-6 text-balance-dark/62">
                                La navegación prioriza agenda, clientas, paquetes y pagos para operar el studio sin perder contexto entre pantallas.
                            </p>
                        </div>
                    </motion.section>

                    {totalAttention > 0 && (
                        <motion.div
                            variants={panelMotion}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="grid gap-3 lg:grid-cols-2"
                        >
                            {pendingVerificationOrders.length > 0 && (
                                <AttentionBanner
                                    icon={Banknote}
                                    label={`${pendingVerificationOrders.length} pago${pendingVerificationOrders.length > 1 ? 's' : ''} pendiente${pendingVerificationOrders.length > 1 ? 's' : ''} de verificación`}
                                    to="/admin/payments"
                                    action="Ver pagos"
                                />
                            )}

                            {pendingMemberships > 0 && (
                                <AttentionBanner
                                    icon={AlertCircle}
                                    label={`${pendingMemberships} paquete${pendingMemberships > 1 ? 's' : ''} requieren atención`}
                                    to="/admin/memberships/pending"
                                    action="Ver paquetes"
                                />
                            )}
                        </motion.div>
                    )}

                    <motion.section
                        variants={panelMotion}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    >
                        {kpis.map((kpi, index) => (
                            <MetricCard key={kpi.title} kpi={kpi} loading={statsLoading} index={index} />
                        ))}
                    </motion.section>

                    <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                        <motion.div variants={panelMotion} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                            <PanelShell
                                title="Movimientos recientes"
                                description="Asignaciones y cambios de paquetes"
                                to="/admin/memberships"
                                action="Ver todo"
                            >
                                <div className="space-y-2">
                                    {membershipsLoading ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <ListSkeleton key={i} />
                                        ))
                                    ) : recentMemberships.length > 0 ? (
                                        recentMemberships.map((membership) => (
                                            <Link
                                                key={membership.id}
                                                to={`/admin/members/${membership.user_id || ''}`}
                                                className="group flex items-start gap-3 rounded-[1.15rem] bg-balance-cream/55 p-3 transition-all duration-200 hover:bg-balance-cream active:scale-[0.995]"
                                            >
                                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-balance-olive/12 text-balance-olive">
                                                    <UserPlus className="h-[18px] w-[18px]" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-balance-dark transition-colors group-hover:text-balance-olive">
                                                        {membership.user_name}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-balance-dark/55">
                                                        {membership.plan_name} · {translateMembershipStatus(membership.status)}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[11px] text-balance-dark/45">
                                                    {new Date(membership.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                </span>
                                            </Link>
                                        ))
                                    ) : (
                                        <EmptyState icon={Users} title="Sin movimientos recientes" text="Las asignaciones aparecerán aquí cuando se registren nuevos paquetes." />
                                    )}
                                </div>
                            </PanelShell>
                        </motion.div>

                        <motion.div variants={panelMotion} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                            <PanelShell
                                title="Cobros por resolver"
                                description="Transferencias, eventos y pagos en físico"
                                to="/admin/payments"
                                action="Ir a pagos"
                            >
                                <div className="space-y-2">
                                    {ordersLoading ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <ListSkeleton key={i} />
                                        ))
                                    ) : (pendingVerificationOrders.length > 0 || pendingEventRegs.length > 0) ? (
                                        <>
                                            {pendingVerificationOrders.slice(0, 5).map((order) => (
                                                <PaymentRow key={order.id} order={order} />
                                            ))}
                                            {pendingEventRegs.slice(0, 5).map((reg: any) => (
                                                <Link
                                                    key={reg.id}
                                                    to="/admin/events"
                                                    className="group flex items-start gap-3 rounded-[1.15rem] bg-balance-cream/55 p-3 transition-all duration-200 hover:bg-balance-cream active:scale-[0.995]"
                                                >
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-balance-sand/35 text-balance-dark">
                                                        <Ticket className="h-[18px] w-[18px]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold text-balance-dark transition-colors group-hover:text-balance-olive">{reg.user_name}</p>
                                                        <p className="mt-1 truncate text-xs text-balance-dark/55">
                                                            {reg.event_title} · {formatMoney(Number(reg.amount))}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="rounded-full border-balance-sand/80 bg-balance-sand/25 text-[10px] text-balance-dark/70">
                                                        Evento
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </>
                                    ) : (
                                        <EmptyState icon={CheckCircle2} title="Cobros al día" text="No hay pagos pendientes de verificar por ahora." />
                                    )}
                                </div>
                            </PanelShell>
                        </motion.div>
                    </section>

                    {birthdays.length > 0 && (
                        <motion.section
                            variants={panelMotion}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-[2rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] p-5 shadow-[0_20px_70px_-54px_rgba(51,42,34,0.65)]"
                        >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-balance-olive/12 text-balance-olive">
                                        <Cake className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-balance-gold">Comunidad</p>
                                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-balance-dark">Cumpleaños del mes</h3>
                                    </div>
                                </div>
                                <Badge className="rounded-full bg-balance-dark px-3 py-1 text-balance-cream">
                                    {birthdays.length}
                                </Badge>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {birthdays.map((b: any) => {
                                    const bday = new Date(b.date_of_birth);
                                    const day = bday.getUTCDate();
                                    const today = new Date();
                                    const isToday = day === today.getDate();
                                    const isPast = day < today.getDate();

                                    return (
                                        <Link
                                            key={b.id}
                                            to={`/admin/members/${b.id}`}
                                            className={`flex items-center gap-3 rounded-[1.15rem] p-3 transition-all duration-200 active:scale-[0.995] ${
                                                isToday
                                                    ? 'bg-balance-dark text-balance-cream'
                                                    : isPast
                                                    ? 'bg-balance-cream/42 opacity-65'
                                                    : 'bg-balance-cream/72 hover:bg-balance-cream'
                                            }`}
                                        >
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                                                isToday ? 'bg-balance-cream text-balance-dark' : 'bg-balance-sand/35 text-balance-dark'
                                            }`}>
                                                {day}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{b.display_name}</p>
                                                <p className={`truncate text-xs ${isToday ? 'text-balance-sand' : 'text-balance-dark/55'}`}>
                                                    {isToday ? 'Cumple años hoy' : `${day} de ${format(bday, 'MMMM', { locale: es })}`}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.section>
                    )}
                </motion.div>
            </AdminLayout>
        </AuthGuard>
    );
}

function FocusRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[1rem] bg-balance-dark/22 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm text-balance-sand">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
            </span>
            <span className="font-semibold tabular-nums text-balance-cream">{value}</span>
        </div>
    );
}

function AttentionBanner({
    icon: Icon,
    label,
    to,
    action,
}: {
    icon: React.ElementType;
    label: string;
    to: string;
    action: string;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-[1.45rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] p-4 shadow-[0_18px_58px_-48px_rgba(51,42,34,0.7)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.05rem] bg-balance-olive/12 text-balance-olive">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-balance-dark">{label}</span>
            </div>
            <Link
                to={to}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-balance-dark px-4 py-2 text-sm font-semibold text-balance-cream transition-all duration-200 hover:bg-balance-olive active:scale-[0.98]"
            >
                {action}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
}

function MetricCard({
    kpi,
    loading,
    index,
}: {
    kpi: {
        title: string;
        value: string | number;
        detail: string;
        icon: React.ElementType;
        tone: string;
    };
    loading: boolean;
    index: number;
}) {
    const Icon = kpi.icon;
    const toneClass = {
        sage: 'bg-balance-olive/12 text-balance-olive',
        taupe: 'bg-balance-sand/35 text-balance-dark',
        cream: 'bg-balance-cream text-balance-dark',
        dark: 'bg-balance-dark text-balance-cream',
    }[kpi.tone] || 'bg-balance-cream text-balance-dark';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
            className="group rounded-[1.6rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] p-4 shadow-[0_18px_58px_-48px_rgba(51,42,34,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:border-balance-olive/35"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-balance-dark/62">{kpi.title}</span>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ${toneClass}`}>
                    <Icon className="h-[18px] w-[18px]" />
                </div>
            </div>
            {loading ? (
                <Skeleton className="mt-5 h-9 w-24 rounded-xl" />
            ) : (
                <p className="mt-5 text-3xl font-semibold tabular-nums tracking-[-0.05em] text-balance-dark">
                    {kpi.value}
                </p>
            )}
            <p className="mt-1 text-xs font-medium text-balance-dark/50">{kpi.detail}</p>
        </motion.div>
    );
}

function PanelShell({
    title,
    description,
    to,
    action,
    children,
}: {
    title: string;
    description: string;
    to: string;
    action: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[2rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] p-5 shadow-[0_20px_70px_-54px_rgba(51,42,34,0.65)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-balance-dark">{title}</h3>
                    <p className="mt-1 text-sm text-balance-dark/55">{description}</p>
                </div>
                <Link
                    to={to}
                    className="group inline-flex items-center gap-2 rounded-full border border-balance-sand/65 bg-balance-cream/65 px-3.5 py-2 text-xs font-semibold text-balance-dark transition-all duration-200 hover:bg-balance-dark hover:text-balance-cream active:scale-[0.98]"
                >
                    {action}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
            </div>
            {children}
        </div>
    );
}

function PaymentRow({ order }: { order: Order }) {
    const isVerification = order.status === 'pending_verification';

    return (
        <Link
            to="/admin/payments"
            className="group flex items-start gap-3 rounded-[1.15rem] bg-balance-cream/55 p-3 transition-all duration-200 hover:bg-balance-cream active:scale-[0.995]"
        >
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-balance-olive/12 text-balance-olive">
                <Receipt className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-balance-dark transition-colors group-hover:text-balance-olive">
                    {order.user_name}
                </p>
                <p className="mt-1 truncate text-xs text-balance-dark/55">
                    {order.plan_name} · {formatMoney(Number(order.total))}
                </p>
            </div>
            <div className="shrink-0 text-right">
                <Badge variant="outline" className="rounded-full border-balance-sand/80 bg-balance-sand/25 text-[10px] text-balance-dark/70">
                    <Clock className="mr-1 h-3 w-3" />
                    {isVerification ? 'Verificar' : 'Cobrar'}
                </Badge>
                <p className="mt-1 text-[11px] text-balance-dark/45">
                    {format(parseISO(order.created_at), 'd MMM', { locale: es })}
                </p>
            </div>
        </Link>
    );
}

function EmptyState({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
    return (
        <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-[1.35rem] bg-balance-cream/48 px-6 py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-balance-sand/35 text-balance-dark/65">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-balance-dark">{title}</p>
            <p className="mt-1 max-w-[28ch] text-xs leading-5 text-balance-dark/52">{text}</p>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="flex items-center gap-3 rounded-[1.15rem] bg-balance-cream/45 p-3">
            <Skeleton className="h-10 w-10 rounded-[1rem]" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-44 rounded-full" />
                <Skeleton className="h-3 w-28 rounded-full" />
            </div>
        </div>
    );
}

function formatMoney(value: number) {
    return `$${Number(value || 0).toLocaleString('es-MX')}`;
}

function translateMembershipStatus(status: string) {
    if (status === 'active') return 'Activa';
    if (status === 'pending_payment') return 'Pendiente de pago';
    if (status === 'pending_activation') return 'Pendiente de activación';
    return status;
}
