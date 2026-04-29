import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    Gift,
    User,
    LogOut,
    Menu,
    X,
    Bell,
    Play,
    PartyPopper,
    ShoppingBag,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientLayoutProps {
    children: ReactNode;
}

const navItems = [
    { href: '/app', label: 'Inicio', icon: LayoutDashboard },
    { href: '/app/book', label: 'Reservar', icon: Calendar },
    { href: '/app/classes', label: 'Mis Clases', icon: ClipboardList },
    { href: '/app/checkout', label: 'Comprar', icon: ShoppingBag },
    { href: '/app/events', label: 'Eventos', icon: PartyPopper },
    { href: '/app/videos', label: 'Videos', icon: Play },
    { href: '/app/wallet', label: 'Lealtad', icon: Gift },
];

// Bottom nav: only 5 most important items for mobile
const bottomNavItems = [
    { href: '/app', label: 'Inicio', icon: LayoutDashboard },
    { href: '/app/book', label: 'Reservar', icon: Calendar },
    { href: '/app/checkout', label: 'Comprar', icon: ShoppingBag },
    { href: '/app/classes', label: 'Clases', icon: ClipboardList },
    { href: '/app/wallet', label: 'Lealtad', icon: Gift },
];

export function ClientLayout({ children }: ClientLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isActivePath = (href: string) => {
        if (href === '/app') return location.pathname === '/app';
        return location.pathname === href || location.pathname.startsWith(`${href}/`);
    };

    return (
        <div className="client-app-shell min-h-screen bg-[hsl(var(--background))] text-balance-dark">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(126,133,121,0.2),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(207,200,184,0.42),transparent_34%),radial-gradient(circle_at_74%_92%,rgba(126,133,121,0.12),transparent_34%)]" />
            <header className="sticky z-40 w-full border-b border-balance-sand/45 bg-[hsl(var(--background))]/84 backdrop-blur-xl" style={{ top: '0', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="mx-auto flex h-[4.75rem] max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <Link to="/app" className="flex min-w-0 items-center gap-3">
                        <img 
                            src="/balance-room-logo-transparent.png" 
                            alt="Balance Room Pilates" 
                            className="h-11 w-auto object-contain"
                        />
                        <div className="hidden min-w-0 sm:block">
                            <span className="block truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-balance-dark">Balance Room</span>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-balance-olive">Pilates studio</span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-1 rounded-full border border-balance-sand/55 bg-balance-cream/55 p-1 lg:flex">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActivePath(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98]',
                                        isActive
                                            ? 'bg-balance-olive text-balance-cream shadow-[0_14px_32px_-26px_rgba(51,42,34,0.8)]'
                                            : 'text-balance-dark/58 hover:bg-balance-cream hover:text-balance-dark'
                                    )}
                                >
                                    <Icon className="h-[17px] w-[17px]" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full border border-balance-sand/65 bg-balance-cream/70 text-balance-dark transition-all hover:bg-balance-olive hover:text-balance-cream active:scale-[0.96]"
                            asChild
                        >
                            <Link to="/app/notifications" aria-label="Notificaciones">
                                <Bell className="h-[18px] w-[18px]" />
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 transition-transform active:scale-[0.96]">
                                    <Avatar className="h-10 w-10 border border-balance-sand/70 bg-balance-cream">
                                        <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                                        <AvatarFallback className="bg-balance-dark text-sm font-semibold text-balance-cream">
                                            {user?.display_name ? getInitials(user.display_name) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 rounded-[1.25rem] border-balance-sand/70 bg-[hsl(var(--card))]" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex items-center gap-3 py-1">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={user?.photo_url || undefined} alt={user?.display_name} />
                                            <AvatarFallback className="bg-balance-dark text-balance-cream">
                                                {user?.display_name ? getInitials(user.display_name) : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold leading-none text-balance-dark">{user?.display_name}</p>
                                            <p className="mt-1 truncate text-xs leading-none text-balance-dark/55">{user?.email}</p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/app/profile" className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Mi perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/app/orders" className="cursor-pointer">
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        <span>Mis Órdenes</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full border border-balance-sand/65 bg-balance-cream/70 text-balance-dark lg:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Abrir navegación"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <nav className="border-t border-balance-sand/45 bg-[hsl(var(--background))]/96 p-4 lg:hidden">
                        <div className="mx-auto grid max-w-[1480px] gap-2 sm:grid-cols-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActivePath(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            'flex items-center justify-between rounded-[1rem] px-3 py-3 text-sm font-semibold transition-colors',
                                            isActive
                                                ? 'bg-balance-olive text-balance-cream'
                                                : 'text-balance-dark/64 hover:bg-balance-cream hover:text-balance-dark'
                                        )}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon className="h-5 w-5" />
                                            <span>{item.label}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                )}
            </header>

            <main className="relative mx-auto max-w-[1480px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">{children}</main>

            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-balance-sand/55 bg-[hsl(var(--background))]/92 backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'relative flex min-w-0 flex-col items-center gap-0.5 rounded-[1rem] px-1 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-[0.96]',
                                    isActive ? 'bg-balance-olive text-balance-cream' : 'text-balance-dark/52'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="lg:hidden" style={{ height: 'calc(80px + env(safe-area-inset-bottom, 0px))' }} />
        </div>
    );
}
