import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import api, { getErrorMessage } from '@/lib/api';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2, Calendar, Clock, User, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import type { BookingClient } from '@/types/booking';

export default function MyBookings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: bookings, isLoading } = useQuery<BookingClient[]>({
        queryKey: ['my-bookings'],
        queryFn: async () => (await api.get('/bookings/my-bookings')).data,
    });

    const cancelMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return await api.post(`/bookings/${bookingId}/cancel`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['classes-public'] }); // Refresh calendar
            toast({ title: 'Reserva cancelada', description: 'Tu crédito ha sido devuelto (si aplica).' });
        },
        onError: (err) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) });
        },
    });

    const upcoming = bookings?.filter(b => !isPast(parseISO(`${b.date}T${b.end_time}`)) && b.booking_status !== 'cancelled') || [];
    const history = bookings?.filter(b => isPast(parseISO(`${b.date}T${b.end_time}`)) || b.booking_status === 'cancelled') || [];

    const BookingCard = ({ booking, isHistory = false }: { booking: BookingClient, isHistory?: boolean }) => (
        <div className={cn("flex flex-col gap-4 rounded-[1.4rem] border border-balance-sand/65 bg-[hsl(var(--card))]/88 p-4 shadow-[0_16px_48px_-40px_rgba(51,42,34,0.68)] transition-all duration-200 md:flex-row md:items-center md:justify-between",
            booking.booking_status === 'cancelled' && "opacity-60 bg-muted/20"
        )}>
            <div className="flex items-start gap-4">
                <div 
                    className="flex min-w-[64px] flex-col items-center justify-center rounded-[1.1rem] border px-3 py-2"
                    style={{ 
                        backgroundColor: booking.class_type_color ? `${booking.class_type_color}20` : 'hsl(var(--muted) / 0.2)',
                        borderColor: booking.class_type_color ? `${booking.class_type_color}55` : 'hsl(var(--border))',
                        color: booking.class_type_color || 'inherit'
                    }}
                >
                    <span className="text-xs uppercase font-medium">{format(parseISO(booking.date), 'MMM', { locale: es })}</span>
                    <span className="text-xl font-bold">{format(parseISO(booking.date), 'd')}</span>
                </div>
                <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: booking.class_type_color || '#7E8579' }} />
                        <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-balance-dark">{booking.class_type_name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-balance-dark/58">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.instructor_name}
                        </div>
                    </div>
                    {booking.booking_status === 'cancelled' && <Badge variant="destructive" className="mt-2 text-[10px]">Cancelada</Badge>}
                    {booking.booking_status === 'checked_in' && <Badge variant="secondary" className="mt-2 text-[10px] bg-success/10 text-success">Asististe</Badge>}
                    {booking.booking_status === 'no_show' && <Badge variant="destructive" className="mt-2 text-[10px]">No asististe</Badge>}
                </div>
            </div>

            <div className="flex items-center gap-2 md:justify-end">
                <Button variant="ghost" size="sm" className="rounded-full" asChild>
                    <Link to={`/app/classes/${booking.booking_id}`}>Ver detalle</Link>
                </Button>
                {!isHistory && booking.booking_status === 'confirmed' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                Cancelar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Si cancelas con anticipación, es posible que se te devuelva el crédito.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelMutation.mutate(booking.booking_id)} className="bg-destructive hover:bg-destructive/90">
                                    {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sí, Cancelar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );

    return (
        <AuthGuard requiredRoles={['client']}>
            <ClientLayout>
                <div className="space-y-6">
                    <section className="rounded-[2rem] border border-balance-olive/25 bg-balance-olive/10 p-5 shadow-[0_22px_72px_-58px_rgba(51,42,34,0.75)] sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-balance-olive/25 bg-balance-cream/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Tu asistencia
                                </div>
                                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance-dark sm:text-4xl">Mis clases</h1>
                                <p className="mt-1 text-sm text-balance-dark/62">Consulta próximas reservas, historial y cancelaciones.</p>
                            </div>
                            <Button asChild className="bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
                                <Link to="/app/book">Reservar clase</Link>
                            </Button>
                        </div>
                    </section>

                    <Tabs defaultValue="upcoming">
                        <TabsList className="rounded-full bg-balance-cream/65 p-1">
                            <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
                            <TabsTrigger value="history">Historial</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upcoming" className="mt-4 space-y-4">
                            {isLoading && <div className="py-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-balance-olive" /></div>}

                            {!isLoading && upcoming.length === 0 && (
                                <div className="rounded-[1.5rem] border border-dashed border-balance-sand/70 bg-balance-cream/35 py-12 text-center">
                                    <Calendar className="mx-auto mb-4 h-12 w-12 text-balance-olive/55" />
                                    <h3 className="text-lg font-medium">No tienes clases próximas</h3>
                                    <p className="text-muted-foreground mb-4">Explora el calendario y reserva tu próxima sesión.</p>
                                    <Button asChild className="bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
                                        <Link to="/app/book">Reservar clase</Link>
                                    </Button>
                                </div>
                            )}

                            {upcoming.map(b => (
                                <BookingCard key={b.booking_id} booking={b} />
                            ))}
                        </TabsContent>

                        <TabsContent value="history" className="mt-4 space-y-4">
                            {!isLoading && history.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No tienes historial aún.</p>
                            )}
                            {history.map(b => (
                                <BookingCard key={b.booking_id} booking={b} isHistory />
                            ))}
                        </TabsContent>
                    </Tabs>
                </div>
            </ClientLayout>
        </AuthGuard>
    );
}
