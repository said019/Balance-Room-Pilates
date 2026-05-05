import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CalendarCheck,
    Eye,
    EyeOff,
    HeartHandshake,
    Loader2,
    Lock,
    Mail,
    PlusSquare,
    Share,
    Sparkles,
} from 'lucide-react';
import studioBarre from '@/assets/studio-barre.jpg';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

const easeOut = [0.23, 1, 0.32, 1] as const;

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (isAuthenticated && user) {
            if (returnUrl) {
                navigate(returnUrl, { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (user.role === 'instructor') {
                navigate('/coach', { replace: true });
            } else {
                navigate('/app', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate, returnUrl]);

    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const onSubmit = async (data: LoginForm) => {
        try {
            await login(data as any);
        } catch {
            // Error is handled by the store
        }
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#F3EEE2] text-[#332A22]">
            <div className="grid min-h-screen lg:grid-cols-[1.06fr_0.94fr]">
                <motion.section
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, ease: easeOut }}
                    className="relative overflow-hidden h-52 sm:h-64 lg:h-auto lg:min-h-screen"
                >
                    <img
                        src={studioBarre}
                        alt="Balance Room studio"
                        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] saturate-[0.82]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#211B15]/78 via-[#211B15]/48 to-[#211B15]/72" />
                    <div className="absolute inset-0 bg-[#F3EEE2]/10 backdrop-blur-[1px]" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#211B15]/95 via-[#211B15]/55 to-transparent" />

                    <div className="relative z-10 flex h-full flex-col justify-between p-6 lg:p-10 xl:p-14">
                        <Link to="/" className="flex w-fit items-center gap-3">
                            <img
                                src="/balance-room-logo-transparent.png"
                                alt="Balance Room Pilates"
                                className="h-10 lg:h-14 w-auto object-contain"
                            />
                            <div className="leading-none text-white">
                                <p className="font-heading text-lg lg:text-2xl font-semibold">Balance Room</p>
                                <p className="mt-1 font-body text-[10px] uppercase tracking-[0.28em] text-white/60">
                                    Pilates
                                </p>
                            </div>
                        </Link>

                        <div className="hidden lg:block max-w-xl">
                            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-body text-xs uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                                <Sparkles className="h-3.5 w-3.5" />
                                studio boutique
                            </span>
                            <h1 className="font-heading text-5xl font-light leading-[0.98] text-white xl:text-6xl">
                                Tu espacio para volver al cuerpo.
                            </h1>
                            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-white/75">
                                Clases pequenas, seguimiento cercano y una experiencia pensada para que reservar se sienta tan simple como llegar a tu mat.
                            </p>
                        </div>

                        <div className="hidden lg:grid max-w-xl grid-cols-3 gap-3">
                            {[
                                { icon: CalendarCheck, label: 'Reserva simple' },
                                { icon: HeartHandshake, label: 'Atencion cercana' },
                                { icon: Sparkles, label: 'Toque premium' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
                                    <item.icon className="mb-3 h-5 w-5 text-white/75" />
                                    <p className="font-body text-xs uppercase tracking-[0.14em] text-white/70">
                                        {item.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(126,133,121,0.2),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(138,129,116,0.18),transparent_25%)]" />
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: easeOut }}
                        className="relative w-full max-w-[450px]"
                    >
                        <div className="mb-8 flex justify-end">
                            <Link
                                to="/"
                                className="rounded-full border border-[#CFC8B8] px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#6F776C] transition-colors hover:bg-white/60"
                            >
                                Inicio
                            </Link>
                        </div>

                        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(51,42,34,0.12)] backdrop-blur-xl sm:p-8">
                            <div className="mb-8">
                                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7E8579]/10 px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.18em] text-[#6F776C]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    bienvenida
                                </span>
                                <h2 className="font-heading text-4xl font-light leading-tight text-[#332A22]">
                                    Entra a tu cuenta
                                </h2>
                                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                                    Reserva clases, consulta tus creditos y sigue tu programa de lealtad.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="rounded-2xl">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.08, ease: easeOut }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="h-12 rounded-2xl border-[#D8D0C2] bg-white/80 pl-11 shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#7E8579]/30"
                                            {...register('email')}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.14, ease: easeOut }}
                                    className="space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <Label htmlFor="password">Contraseña</Label>
                                        <Link
                                            to="/forgot-password"
                                            className="font-body text-sm font-medium text-[#6F776C] transition-colors hover:text-[#332A22]"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            className="h-12 rounded-2xl border-[#D8D0C2] bg-white/80 pl-11 pr-12 shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#7E8579]/30"
                                            {...register('password')}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-150 hover:text-foreground active:scale-95"
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password.message}</p>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.2, ease: easeOut }}
                                    className="space-y-4 pt-2"
                                >
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-2xl bg-[#332A22] font-body font-semibold text-white shadow-[0_14px_30px_rgba(51,42,34,0.18)] transition-transform duration-150 hover:bg-[#43382E] active:scale-[0.98]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Iniciando sesión...
                                            </>
                                        ) : (
                                            'Iniciar sesión'
                                        )}
                                    </Button>

                                    <p className="text-center font-body text-sm text-muted-foreground">
                                        ¿No tienes cuenta?{' '}
                                        <Link
                                            to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
                                            className="font-semibold text-[#6F776C] transition-colors hover:text-[#332A22]"
                                        >
                                            Regístrate
                                        </Link>
                                    </p>
                                </motion.div>
                            </form>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#D8D0C2] bg-white/45 p-4 text-center sm:hidden">
                            <p className="font-body text-xs font-semibold text-[#332A22]/80">
                                Instala la app en tu celular
                            </p>
                            <p className="mt-1 font-body text-[11px] leading-relaxed text-muted-foreground">
                                <strong>iPhone:</strong> toca <Share className="inline h-3 w-3 -mt-0.5" /> y luego <em>Agregar a inicio</em>.
                                <br />
                                <strong>Android:</strong> toca <PlusSquare className="inline h-3 w-3 -mt-0.5" /> o el menú y <em>Instalar app</em>.
                            </p>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}
