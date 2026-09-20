import { PrivateMediaImage } from '@/components/PrivateMediaImage';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import '@/admin.css';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard,
    Calendar,
    Users,
    CreditCard,
    Settings,
    Dumbbell,
    ChevronRight,
    LogOut,
    Menu,
    Bell,
    Search,
    CalendarPlus as ClipboardList,
    IdCard as BadgeCheck,
    TrendingUp,
    DollarSign,
    CalendarCheck,
    UserPlus,
    PartyPopper,
    Megaphone,
    Tag,
    X,
    PanelLeftClose,
} from '@/components/brand/icons';
import { cn } from '@/lib/utils';
import { AdminBreadcrumbs } from '@/components/layout/AdminBreadcrumbs';
import api from '@/lib/api';

interface AdminLayoutProps {
    children: ReactNode;
}

type SidebarChild = {
    href: string;
    label: string;
};

type SidebarItem = {
    href?: string;
    label: string;
    icon: React.ElementType;
    children?: SidebarChild[];
};

const sidebarItems: SidebarItem[] = [
    { href: '/admin/dashboard', label: 'Pulso', icon: LayoutDashboard },
    { href: '/admin/events', label: 'Eventos', icon: PartyPopper },
    { href: '/admin/marketing', label: 'Comunicación', icon: Megaphone },
    { href: '/admin/discount-codes', label: 'Descuentos', icon: Tag },
    { href: '/admin/calendar', label: 'Agenda', icon: Calendar },
    {
        label: 'Reservas',
        icon: ClipboardList,
        children: [
            { href: '/admin/bookings', label: 'Reservas' },
            { href: '/admin/bookings/waitlist', label: 'Lista de espera' },
            { href: '/admin/totalpass/checkins', label: 'TotalPass hoy' },
        ],
    },
    {
        label: 'Clases',
        icon: Dumbbell,
        children: [
            { href: '/admin/classes/schedules', label: 'Horarios' },
            { href: '/admin/classes/types', label: 'Disciplinas' },
            { href: '/admin/facilities', label: 'Salas' },
            { href: '/admin/classes/prices', label: 'Precios y paquetes' },
        ],
    },
    {
        label: 'Comunidad',
        icon: Users,
        children: [
            { href: '/admin/members', label: 'Personas' },
            { href: '/admin/instructors', label: 'Coaches' },
        ],
    },
    {
        label: 'Membresías',
        icon: BadgeCheck,
        children: [
            { href: '/admin/memberships/all', label: 'Activas e historial' },
            { href: '/admin/memberships/paquetes', label: 'Planes' },
        ],
    },
    { href: '/admin/payments', label: 'Pagos', icon: CreditCard },
    {
        label: 'Reportes',
        icon: TrendingUp,
        children: [
            { href: '/admin/reports/overview', label: 'Vista general' },
            { href: '/admin/reports/classes', label: 'Clases' },
            { href: '/admin/reports/revenue', label: 'Ingresos' },
            { href: '/admin/reports/retention', label: 'Retención' },
            { href: '/admin/reports/instructors', label: 'Coaches' },
        ],
    },
    {
        label: 'Ajustes',
        icon: Settings,
        children: [
            { href: '/admin/settings/general', label: 'General' },
            { href: '/admin/settings/studio', label: 'Studio' },
            { href: '/admin/settings/policies', label: 'Políticas' },
            { href: '/admin/settings/cancellations', label: 'Cancelaciones' },
            { href: '/admin/settings/notifications', label: 'Notificaciones' },
            { href: '/admin/settings/whatsapp', label: 'WhatsApp' },
            { href: '/admin/settings/platforms', label: 'Plataformas' },
        ],
    },
];

const pageNames: Record<string, string> = {
    dashboard: 'Pulso del studio',
    events: 'Eventos',
    marketing: 'Comunicación',
    'discount-codes': 'Descuentos',
    calendar: 'Agenda',
    bookings: 'Reservas',
    totalpass: 'TotalPass',
    classes: 'Clases',
    members: 'Comunidad',
    memberships: 'Membresías',
    instructors: 'Coaches',
    payments: 'Pagos',
    reports: 'Reportes',
    settings: 'Ajustes',
    products: 'Productos',
};

export function AdminLayout({ children }: AdminLayoutProps) {
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        setMobileMenuOpen(false);
        const activeParents = sidebarItems
            .filter((item) => item.children?.some((child) => isActivePath(location.pathname, child.href)))
            .map((item) => item.label);
        if (activeParents.length > 0) {
            setExpandedItems((prev) => Array.from(new Set([...prev, ...activeParents])));
        }
    }, [location.pathname]);

    useEffect(() => {
        document.body.classList.add('altitud-admin');
        return () => document.body.classList.remove('altitud-admin');
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/admin/notifications');
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            } catch {
                // Notifications are auxiliary. The admin shell should still load.
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleExpand = (label: string) => {
        if (sidebarCollapsed) setSidebarCollapsed(false);
        setExpandedItems((prev) =>
            prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'ahora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    const isActive = (href: string) => isActivePath(location.pathname, href);
    const isParentActive = (children: SidebarChild[]) => children.some((child) => isActive(child.href));

    const sectionName = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';
    const pageTitle = pageNames[sectionName] || 'Admin';

    const renderSidebar = ({ mobile = false }: { mobile?: boolean } = {}) => (
        <div className="admin-navigation-scroll">
            <nav className="space-y-1" aria-label="Navegación de administración">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const expanded = expandedItems.includes(item.label);
                    const active = item.children ? isParentActive(item.children) : isActive(item.href!);
                    const labelVisible = !sidebarCollapsed || mobile;
                    const content = <><Icon aria-hidden="true" className="h-5 w-5 shrink-0" />{labelVisible && <span className="min-w-0 flex-1 text-left">{item.label}</span>}</>;
                    return <div key={item.label}>
                        {item.children ? <>
                            <button type="button" className={cn('admin-nav-link', active && 'is-active')}
                                aria-label={item.label} aria-expanded={expanded && labelVisible}
                                onClick={() => toggleExpand(item.label)}>
                                {content}
                                {labelVisible && <ChevronRight aria-hidden="true" className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />}
                            </button>
                            {expanded && labelVisible && <div className="admin-nav-children">
                                {item.children.map((child) => <Link key={child.href} to={child.href}
                                    className={cn('admin-nav-child', isActive(child.href) && 'is-active')}
                                    aria-current={isActive(child.href) ? 'page' : undefined}
                                    onClick={() => setMobileMenuOpen(false)}>{child.label}</Link>)}
                            </div>}
                        </> : <Link to={item.href!} className={cn('admin-nav-link', active && 'is-active')}
                            aria-label={item.label} aria-current={active ? 'page' : undefined}
                            onClick={() => setMobileMenuOpen(false)}>{content}</Link>}
                    </div>;
                })}
            </nav>
            <p className="admin-nav-caption">2707 Altitud · Studio</p>
        </div>
    );

    return (
        <div className="admin-shell min-h-screen text-altitud-dark">
            <a className="admin-skip-link" href="#admin-main">Ir al contenido</a>
            <aside className={cn('admin-rail fixed inset-y-0 left-0 z-40 hidden flex-col transition-[width] duration-200 lg:flex', sidebarCollapsed ? 'w-[5.25rem]' : 'w-[16rem]')}>
                <div className="flex min-h-24 shrink-0 items-center justify-between gap-4 px-5">
                    {!sidebarCollapsed && <Link to="/admin/dashboard" aria-label="2707 Altitud, inicio de administración">
                        <PrivateMediaImage src="/brand/logo-light.svg" alt="2707 Altitud" className="h-12 w-auto" />
                    </Link>}
                    <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="admin-rail-control" aria-label={sidebarCollapsed ? 'Expandir navegación' : 'Contraer navegación'}>
                        {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>
                </div>
                {renderSidebar()}
            </aside>

            <DialogPrimitive.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="admin-menu-overlay" />
                    <DialogPrimitive.Content className="admin-mobile-drawer" onCloseAutoFocus={(event) => { event.preventDefault(); menuTriggerRef.current?.focus(); }}>
                        <div className="flex min-h-24 shrink-0 items-center justify-between gap-4 px-5">
                            <PrivateMediaImage src="/brand/logo-light.svg" alt="2707 Altitud" className="h-12 w-auto" />
                            <DialogPrimitive.Title className="sr-only">Administración de 2707 Altitud</DialogPrimitive.Title>
                            <DialogPrimitive.Description className="sr-only">Secciones del administrador del studio.</DialogPrimitive.Description>
                            <DialogPrimitive.Close className="admin-rail-control" aria-label="Cerrar navegación"><X className="h-5 w-5" /></DialogPrimitive.Close>
                        </div>
                        {renderSidebar({ mobile: true })}
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>

            <div
                className={cn(
                    'relative flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ease-admin-flow',
                    sidebarCollapsed ? 'lg:pl-[5.25rem]' : 'lg:pl-[16rem]'
                )}
            >
                <header className="admin-topbar sticky top-0 z-30 px-4 py-3 md:px-6">
                    <div className="mx-auto flex max-w-[1480px] items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            ref={menuTriggerRef}
                            className="admin-header-control lg:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Abrir navegación"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-altitud-olive">
                                2707 Altitud
                            </div>
                            <p className="truncate text-base font-semibold text-altitud-dark md:text-lg">
                                {pageTitle}
                            </p>
                        </div>

                        <Link to="/admin/members" className="admin-community-search hidden items-center gap-3 xl:flex">
                            <Search className="h-4 w-4" aria-hidden="true" /> Buscar en comunidad
                        </Link>

                        <div className="flex items-center gap-2">
                            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="admin-header-control relative"
                                        aria-label="Notificaciones"
                                    >
                                        <Bell className="h-[18px] w-[18px]" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-altitud-olive px-1 text-[10px] font-bold text-altitud-cream">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[1.5rem] border-altitud-sand/70 bg-[hsl(var(--admin-panel))] p-0 shadow-[0_24px_70px_-42px_rgba(51,42,34,0.75)]" align="end">
                                    <div className="flex items-center justify-between border-b border-altitud-sand/50 px-4 py-3">
                                        <h4 className="text-sm font-semibold text-altitud-dark">Actividad reciente</h4>
                                        <span className="rounded-full bg-altitud-cream px-2.5 py-1 text-[11px] font-semibold text-altitud-dark/60">{unreadCount} nuevas</span>
                                    </div>
                                    <ScrollArea className="h-[380px]">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-altitud-dark/55">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-altitud-cream">
                                                    <Bell className="h-5 w-5" />
                                                </div>
                                                <p className="text-sm font-medium">Sin actividad reciente</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-balance-sand/45">
                                                {notifications.map((n: any) => {
                                                    const isRecent = new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                                                    const icon = n.type === 'payment' ? (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-altitud-olive/12 text-altitud-olive">
                                                            <DollarSign className="h-4 w-4" />
                                                        </div>
                                                    ) : n.type === 'membership' ? (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-altitud-sand/35 text-altitud-dark">
                                                            <UserPlus className="h-4 w-4" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] bg-altitud-cream text-altitud-dark">
                                                            <CalendarCheck className="h-4 w-4" />
                                                        </div>
                                                    );

                                                    const label = n.type === 'payment'
                                                        ? `Pago de $${parseFloat(n.title).toLocaleString('es-MX')} (${n.detail})`
                                                        : n.type === 'membership'
                                                            ? `Membresía "${n.title}" (${n.detail})`
                                                            : `Reserva: ${n.title}`;

                                                    const timeAgo = getTimeAgo(new Date(n.created_at));

                                                    return (
                                                        <button
                                                            key={`${n.type}-${n.id}`}
                                                            className={cn(
                                                                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-altitud-cream/60',
                                                                isRecent && 'bg-altitud-olive/5'
                                                            )}
                                                            onClick={() => {
                                                                setNotifOpen(false);
                                                                if (n.user_id) navigate(`/admin/members/${n.user_id}`);
                                                            }}
                                                        >
                                                            {icon}
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-semibold text-altitud-dark">{n.user_name}</span>
                                                                <span className="block truncate text-xs text-altitud-dark/55">{label}</span>
                                                            </span>
                                                            <span className="mt-0.5 shrink-0 text-[10px] text-altitud-dark/45">{timeAgo}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="admin-header-control relative rounded-full p-0" aria-label="Cuenta de administración">
                                        <Avatar className="h-10 w-10 border border-altitud-sand/70 bg-altitud-cream">
                                            <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                                            <AvatarFallback className="bg-altitud-dark text-sm font-semibold text-altitud-cream">
                                                {user?.display_name ? getInitials(user.display_name) : 'A'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {user?.is_instructor && (
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[hsl(var(--admin-bg))] bg-altitud-olive">
                                                <Dumbbell className="h-2.5 w-2.5 text-altitud-cream" />
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 rounded-[1.25rem] border-altitud-sand/70 bg-[hsl(var(--admin-panel))]" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex items-center gap-3 py-1">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                                                <AvatarFallback className="bg-altitud-dark text-altitud-cream">
                                                    {user?.display_name ? getInitials(user.display_name) : 'A'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold leading-none text-altitud-dark">{user?.display_name}</p>
                                                <p className="mt-1 truncate text-xs leading-none text-altitud-dark/55">{user?.email}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                                    <span className="inline-flex items-center rounded-md bg-altitud-olive/10 px-2 py-0.5 text-xs font-semibold capitalize text-altitud-olive">
                                                        {user?.role}
                                                    </span>
                                                    {user?.is_instructor && (
                                                        <span className="inline-flex items-center rounded-md bg-altitud-sand/40 px-2 py-0.5 text-xs font-semibold text-altitud-dark/70">
                                                            Coach
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {user?.is_instructor && (
                                        <>
                                            <DropdownMenuItem asChild>
                                                <Link to="/admin/calendar" className="cursor-pointer">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span>Mis clases</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link to="/admin/settings/general" className="cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Configuración</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main id="admin-main" className="admin-content min-w-0 flex-1 px-4 py-5 md:px-6 md:py-7" tabIndex={-1}>
                    <div className="mx-auto min-w-0 max-w-[1480px]">
                        <div className="mb-5">
                            <AdminBreadcrumbs />
                        </div>
                        {children}
                    </div>
                </main>
                <nav className="admin-bottom-nav lg:hidden" aria-label="Accesos principales">
                    {[
                        { href: '/admin/dashboard', label: 'Pulso', icon: LayoutDashboard },
                        { href: '/admin/calendar', label: 'Agenda', icon: Calendar },
                        { href: '/admin/members', label: 'Comunidad', icon: Users },
                        { href: '/admin/payments', label: 'Pagos', icon: CreditCard },
                    ].map(({ href, label, icon: Icon }) => <Link key={href} to={href}
                        className={cn('admin-bottom-link', isActive(href) && 'is-active')}
                        aria-current={isActive(href) ? 'page' : undefined}>
                        <Icon className="h-5 w-5" aria-hidden="true" /><span>{label}</span>
                    </Link>)}
                    <button type="button" className="admin-bottom-link" onClick={() => setMobileMenuOpen(true)} aria-label="Más secciones" aria-expanded={mobileMenuOpen}>
                        <Menu className="h-5 w-5" aria-hidden="true" /><span>Más</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}

function isActivePath(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}
