import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from '@/components/brand/icons';

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const token = searchParams.get('token');

    const {
        register,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    useEffect(() => {
        if (!token) {
            setError('Token inválido o expirado. Por favor solicita un nuevo enlace.');
        }
    }, [token]);

    const onSubmit = async (data: ResetPasswordForm) => {
        if (!token) return;

        setIsLoading(true);
        setError(null);

        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password,
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };


    const password = watch('password') || '';
    return (
        <main className="min-h-dvh bg-[#F6F4EE] text-[#1C1C19] lg:grid lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="flex flex-col justify-between bg-[#1C1C19] px-7 py-6 text-[#F6F4EE] sm:px-12 lg:min-h-dvh lg:p-16">
                <Link to="/" aria-label="Volver a 2707 Altitud" className="inline-block w-fit">
                    <img src="/brand/logo-light.svg" alt="2707 Altitud" className="h-16 w-auto lg:h-24" />
                </Link>
                <div className="hidden lg:block">
                    <p className="mb-7 text-xs tracking-[0.22em] text-[#CFBD9D]">TU ESPACIO EN ALTITUD</p>
                    <h2 className="font-heading text-6xl leading-[1.08]">El siguiente<br />nivel empieza<br /><span className="text-[#CFBD9D]">contigo.</span></h2>
                    <p className="mt-8 max-w-xs text-lg leading-relaxed text-[#CFBD9D]">Vuelve a tu cuenta.<br />Haz espacio para tu próximo entrenamiento.</p>
                </div>
                <p className="hidden border-t border-[#CFBD9D]/25 pt-6 text-xs tracking-[0.15em] text-[#CFBD9D] lg:block">DISCIPLINA · COMUNIDAD · EVOLUCIÓN</p>
            </aside>
            <section className="flex min-w-0 flex-col px-6 py-7 sm:px-12 lg:px-20 lg:py-12">
                <Link to="/login" className="w-fit py-2 text-sm text-[#5F632C] underline-offset-4 hover:underline">← Volver al inicio de sesión</Link>
                <div className="mx-auto w-full max-w-[420px] flex-1 py-10 lg:flex lg:flex-col lg:justify-center lg:py-16">
                    {!token ? <div className="space-y-6">
                        <AlertTriangle className="h-8 w-8 text-[#7F6146]" />
                        <h1 className="font-heading text-4xl">Necesitas un nuevo enlace.</h1>
                        <p className="leading-relaxed text-muted-foreground">Abre el enlace completo de tu correo o solicita uno nuevo para recuperar tu acceso.</p>
                        <Button asChild className="h-12 w-full rounded-full"><Link to="/forgot-password">Solicitar nuevo enlace</Link></Button>
                    </div> : success ? <div role="status" className="space-y-6">
                        <CheckCircle className="h-10 w-10 text-[#5F632C]" />
                        <h1 className="font-heading text-4xl">Tu acceso está listo.</h1>
                        <p className="leading-relaxed text-muted-foreground">Guardamos tu nueva contraseña. Ya puedes entrar a tu cuenta.</p>
                        <Button asChild className="h-12 w-full rounded-full"><Link to="/login">Iniciar sesión</Link></Button>
                    </div> : <>
                        <p className="mb-4 text-xs tracking-[0.18em] text-[#7F6146]">ACCESO A TU CUENTA</p>
                        <h1 className="font-heading text-4xl leading-tight sm:text-5xl">Una nueva contraseña.<br />Tu mismo impulso.</h1>
                        <p className="mb-8 mt-5 leading-relaxed text-muted-foreground">Elige una contraseña que solo tú conozcas para volver a entrenar con nosotros.</p>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {error && <Alert variant="destructive"><AlertDescription>{error} <Link to="/forgot-password" className="underline">Solicitar otro enlace</Link></AlertDescription></Alert>}
                            {([{id:'password',label:'Nueva contraseña',show:showPassword,toggle:()=>setShowPassword(!showPassword)},
                              {id:'confirmPassword',label:'Confirma tu contraseña',show:showConfirmPassword,toggle:()=>setShowConfirmPassword(!showConfirmPassword)}] as const).map(field=>(
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    <div className="relative">
                                        <Input id={field.id} type={field.show?'text':'password'} autoComplete="new-password"
                                            aria-invalid={!!errors[field.id]} aria-describedby={field.id+'-hint'}
                                            className="h-14 rounded-lg border-[#CFBD9D] bg-transparent pl-4 pr-14 text-base shadow-none"
                                            {...register(field.id)} disabled={isLoading} />
                                        <button type="button" disabled={isLoading} onClick={field.toggle}
                                            aria-label={(field.show?'Ocultar':'Mostrar')+' '+field.label.toLowerCase()}
                                            aria-pressed={field.show}
                                            className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5F632C]">
                                            {field.show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                    <p id={field.id+'-hint'} className={'text-sm '+(errors[field.id]?'text-destructive':'text-muted-foreground')}>
                                        {errors[field.id]?.message || (field.id==='password'?(password.length>=8?'✓ Mínimo de 8 caracteres cumplido':'Usa al menos 8 caracteres.'):'Escríbela otra vez para confirmarla.')}
                                    </p>
                                </div>
                            ))}
                            <Button type="submit" className="h-14 w-full rounded-full text-base" disabled={isLoading}>
                                {isLoading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Guardando…</>:'Guardar nueva contraseña →'}
                            </Button>
                            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Lock className="h-3 w-3"/>Tu contraseña es personal. No la compartas.</p>
                        </form>
                    </>}
                </div>
                <p className="text-center text-xs text-muted-foreground">2707 Altitud · Zinacantepec, México</p>
            </section>
        </main>
    );
}
