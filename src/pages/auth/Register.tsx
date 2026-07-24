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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Cake,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
    Phone,
    PlusSquare,
    Share,
    Sparkles,
    User,
} from 'lucide-react';
import studioPilatesChairs from '@/assets/studio-pilates-chairs.jpg';

const registerSchema = z.object({
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z
        .string()
        .regex(/^\+52[0-9]{10}$/, 'Formato: +52 seguido de 10 dígitos'),
    dateOfBirth: z.string().optional().or(z.literal('')),
    password: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    acceptsTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
    acceptsCommunications: z.boolean().default(false),
    referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

const easeOut = [0.23, 1, 0.32, 1] as const;

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');
    const { register: registerUser, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            acceptsTerms: false,
            acceptsCommunications: false,
        },
    });

    const acceptsTerms = watch('acceptsTerms');
    const acceptsCommunications = watch('acceptsCommunications');

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(returnUrl || '/app', { replace: true });
        }
    }, [isAuthenticated, user, navigate, returnUrl]);

    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/[^\d+]/g, '');
        if (!value.startsWith('+52') && value.length > 0) {
            if (value.startsWith('52')) {
                value = '+' + value;
            } else if (value.startsWith('+')) {
                value = '+52' + value.substring(1);
            } else {
                value = '+52' + value;
            }
        }
        if (value.length > 13) {
            value = value.substring(0, 13);
        }
        e.target.value = value;
    };

    const onSubmit = async (data: RegisterForm) => {
        try {
            await registerUser({
                email: data.email,
                password: data.password,
                displayName: data.displayName,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth || undefined,
                acceptsTerms: data.acceptsTerms,
                acceptsCommunications: data.acceptsCommunications,
                referralCode: data.referralCode || undefined,
            });
        } catch {
            // Error is handled by the store
        }
    };

    const fieldClass = "h-12 rounded-2xl border-[#D8D0C2] bg-white/80 pl-11 shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:ring-[#7E8579]/30";
    const fieldMotion = {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: easeOut },
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#F3EEE2] text-[#332A22]">
            <div className="grid min-h-screen lg:grid-cols-[0.88fr_1.12fr]">
                <motion.aside
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, ease: easeOut }}
                    className="relative overflow-hidden h-52 sm:h-64 lg:h-auto lg:min-h-screen"
                >
                    <img
                        src={studioPilatesChairs}
                        alt="Balance Room studio"
                        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] saturate-[0.82]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#211B15]/78 via-[#211B15]/48 to-[#211B15]/72" />
                    <div className="absolute inset-0 bg-[#F3EEE2]/10 backdrop-blur-[1px]" />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#211B15]/95 via-[#211B15]/55 to-transparent" />

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
                                empieza aquí
                            </span>
                            <h1 className="font-heading text-5xl font-light leading-[0.98] text-white xl:text-6xl">
                                Una práctica cercana, constante y tuya.
                            </h1>
                            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-white/75">
                                Crea tu cuenta para reservar en grupos pequeños y comprar paquetes.
                            </p>
                        </div>

                        <div className="hidden lg:block rounded-[1.75rem] border border-white/10 bg-white/10 p-5 text-white backdrop-blur">
                            <p className="font-body text-xs uppercase tracking-[0.2em] text-white/60">
                                experiencia balance room
                            </p>
                            <div className="mt-4 grid gap-3">
                                {[
                                    '7 disciplinas para moverte distinto',
                                    '6 lugares por clase',
                                    'Seguimiento cercano en cada clase',
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-3 font-body text-sm text-white/80">
                                        <CheckCircle2 className="h-4 w-4 text-white/70" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.aside>

                <section className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(126,133,121,0.22),transparent_27%),radial-gradient(circle_at_92%_8%,rgba(138,129,116,0.18),transparent_24%)]" />

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: easeOut }}
                        className="relative w-full max-w-2xl"
                    >
                        <div className="mb-6 flex justify-end">
                            <Link
                                to="/login"
                                className="rounded-full border border-[#CFC8B8] px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-[#6F776C] transition-colors hover:bg-white/60"
                            >
                                Entrar
                            </Link>
                        </div>

                        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_24px_80px_rgba(51,42,34,0.12)] backdrop-blur-xl sm:p-8">
                            <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                                <div>
                                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#7E8579]/10 px-3 py-1.5 font-body text-[11px] uppercase tracking-[0.18em] text-[#6F776C]">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        nueva cuenta
                                    </span>
                                    <h2 className="font-heading text-4xl font-light leading-tight text-[#332A22]">
                                        Únete a Balance Room
                                    </h2>
                                </div>
                                <p className="font-body text-sm leading-relaxed text-muted-foreground">
                                    Reserva clases y compra paquetes desde una experiencia simple y cuidada.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive" className="rounded-2xl">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.04, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="displayName">Nombre completo</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="displayName"
                                                placeholder="Tu nombre"
                                                className={fieldClass}
                                                {...register('displayName')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.displayName && (
                                            <p className="text-sm text-destructive">{errors.displayName.message}</p>
                                        )}
                                    </motion.div>

                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.08, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="tu@email.com"
                                                className={fieldClass}
                                                {...register('email')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email.message}</p>
                                        )}
                                    </motion.div>

                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.12, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+524271234567"
                                                className={fieldClass}
                                                {...register('phone')}
                                                onChange={(e) => {
                                                    handlePhoneChange(e);
                                                    register('phone').onChange(e);
                                                }}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                                        )}
                                    </motion.div>

                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.16, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
                                        <div className="relative">
                                            <Cake className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                className={fieldClass}
                                                {...register('dateOfBirth')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.2, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="password">Contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className={`${fieldClass} pr-12`}
                                                {...register('password')}
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-150 hover:text-foreground active:scale-95"
                                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password.message}</p>
                                        )}
                                    </motion.div>

                                    <motion.div {...fieldMotion} transition={{ duration: 0.28, delay: 0.24, ease: easeOut }} className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8174]" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className={`${fieldClass} pr-12`}
                                                {...register('confirmPassword')}
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-150 hover:text-foreground active:scale-95"
                                                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                                        )}
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.28, ease: easeOut }}
                                    className="rounded-[1.5rem] border border-[#D8D0C2] bg-[#F8F4EC]/70 p-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="acceptsTerms"
                                                checked={acceptsTerms}
                                                onCheckedChange={(checked) => setValue('acceptsTerms', checked as boolean)}
                                                disabled={isLoading}
                                                className="mt-0.5"
                                            />
                                            <label htmlFor="acceptsTerms" className="cursor-pointer font-body text-sm leading-relaxed text-[#332A22]/80">
                                                Acepto los{' '}
                                                <Link to="/terms" className="font-medium text-[#6F776C] hover:text-[#332A22]">
                                                    términos y condiciones
                                                </Link>{' '}
                                                y la{' '}
                                                <Link to="/privacy" className="font-medium text-[#6F776C] hover:text-[#332A22]">
                                                    política de privacidad
                                                </Link>
                                            </label>
                                        </div>
                                        {errors.acceptsTerms && (
                                            <p className="text-sm text-destructive">{errors.acceptsTerms.message}</p>
                                        )}

                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="acceptsCommunications"
                                                checked={acceptsCommunications}
                                                onCheckedChange={(checked) => setValue('acceptsCommunications', checked as boolean)}
                                                disabled={isLoading}
                                                className="mt-0.5"
                                            />
                                            <label htmlFor="acceptsCommunications" className="cursor-pointer font-body text-sm leading-relaxed text-[#332A22]/80">
                                                Deseo recibir promociones y novedades por email.
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.32, ease: easeOut }}
                                    className="space-y-2"
                                >
                                    <Label htmlFor="referralCode">Código de referido</Label>
                                    <Input
                                        id="referralCode"
                                        placeholder="Opcional"
                                        {...register('referralCode')}
                                        disabled={isLoading}
                                        className="h-12 rounded-2xl border-[#D8D0C2] bg-white/80 uppercase shadow-sm focus-visible:ring-[#7E8579]/30"
                                    />
                                    <p className="font-body text-xs text-muted-foreground">
                                        Si alguien te invitó, ingresa su código para obtener 10% de descuento en tu primer paquete.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.36, ease: easeOut }}
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
                                                Creando cuenta...
                                            </>
                                        ) : (
                                            'Crear cuenta'
                                        )}
                                    </Button>

                                    <p className="text-center font-body text-sm text-muted-foreground">
                                        ¿Ya tienes cuenta?{' '}
                                        <Link
                                            to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
                                            className="font-semibold text-[#6F776C] transition-colors hover:text-[#332A22]"
                                        >
                                            Inicia sesión
                                        </Link>
                                    </p>
                                </motion.div>
                            </form>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#D8D0C2] bg-white/45 p-4 text-center">
                            <p className="font-body text-xs font-semibold text-[#332A22]/80">
                                Instala la app en tu celular
                            </p>
                            <p className="mt-1 font-body text-[11px] leading-relaxed text-muted-foreground">
                                <strong>iPhone:</strong> toca <Share className="inline h-3 w-3 -mt-0.5" /> en Safari y luego <em>Agregar a inicio</em>.
                                <br />
                                <strong>Android:</strong> toca <PlusSquare className="inline h-3 w-3 -mt-0.5" /> en Chrome o el menú (⋮) y <em>Instalar app</em>.
                            </p>
                        </div>
                    </motion.div>
                </section>
            </div>
        </main>
    );
}
