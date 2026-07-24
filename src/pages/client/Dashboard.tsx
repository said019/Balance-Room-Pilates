import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { fetchMyMembership } from '@/lib/memberships';
import type { BookingClient } from '@/types/booking';
import type { ClientMembership } from '@/types/membership';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  RefreshCw,
  Leaf,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statusLabel: Record<ClientMembership['status'], string> = {
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  pending_payment: 'Pago pendiente',
  pending_activation: 'Pendiente',
  paused: 'Pausada',
};

export default function ClientDashboard() {
  const { user } = useAuthStore();

  const { data: membership, isLoading: membershipLoading } = useQuery<ClientMembership | null>({
    queryKey: ['my-membership'],
    queryFn: fetchMyMembership,
  });

  const isExpiredOrCancelled = membership?.status === 'expired' || membership?.status === 'cancelled';
  const isOutOfCredits = membership?.status === 'active' && membership?.class_limit && (membership?.classes_remaining ?? 0) <= 0;

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingClient[]>({
    queryKey: ['my-bookings'],
    queryFn: async () => (await api.get('/bookings/my-bookings')).data,
  });

  const upcomingClasses = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings
      .filter((booking) => booking.booking_status !== 'cancelled')
      .filter((booking) => {
        const classDate = parseISO(booking.date);
        // Show all classes from today onwards (not just future hours)
        return classDate >= today;
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.date}T${a.start_time}`);
        const dateB = parseISO(`${b.date}T${b.start_time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 2);
  }, [bookings]);

  const membershipEndDate = membership?.end_date ? parseISO(membership.end_date) : null;
  const daysRemaining = membershipEndDate
    ? Math.max(differenceInCalendarDays(membershipEndDate, new Date()), 0)
    : null;
  const classLimit = membership?.class_limit ?? null;
  const classesRemaining = membership?.classes_remaining ?? null;
  const classesProgress = classLimit && classesRemaining !== null
    ? (classesRemaining / classLimit) * 100
    : null;

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-balance-olive/25 bg-balance-olive/10 p-5 shadow-[0_22px_72px_-58px_rgba(51,42,34,0.75)] sm:p-7">
            <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-balance-olive/25 bg-balance-cream/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
                  <Leaf className="h-3.5 w-3.5" />
                  Tu espacio Balance
                </div>
                <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-balance-dark sm:text-4xl">
                  Hola, {user?.display_name?.split(' ')[0] || 'bienvenida'}. Tu siguiente clase empieza desde aquí.
                </h1>
                <p className="mt-3 max-w-[58ch] text-sm leading-6 text-balance-dark/62">
                  Reserva y revisa tus créditos en una experiencia pensada para clases pequeñas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DashboardMiniStat label="Clases" value={upcomingClasses.length} />
                <DashboardMiniStat label="Créditos" value={classesRemaining ?? 0} />
              </div>
            </div>
          </section>

          {/* Membership Card — Premium feel */}
          <Card className={`relative overflow-hidden rounded-[1.75rem] shadow-[0_18px_58px_-50px_rgba(51,42,34,0.58)] ${isExpiredOrCancelled || isOutOfCredits ? 'border-amber-300/40 bg-amber-50/70' : 'border-balance-olive/22 bg-[hsl(var(--card))]/88'}`}>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tu membresía</CardTitle>
                <Badge
                  variant={membership?.status === 'active' ? 'default' : 'secondary'}
                  className={
                    isOutOfCredits
                      ? 'bg-amber-100 text-amber-700 border border-amber-300 rounded-lg'
                      : membership?.status === 'active'
                        ? 'bg-balance-olive rounded-lg text-balance-cream'
                        : isExpiredOrCancelled
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 rounded-lg'
                          : 'rounded-lg'
                  }
                >
                  {isOutOfCredits ? 'Sin créditos' : membership ? statusLabel[membership.status] : 'Sin membresía'}
                </Badge>
              </div>
              <CardDescription>{membership?.plan_name || 'Activa tu plan para comenzar'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              {membershipLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : membership && isOutOfCredits ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800">
                        Agotaste tus {membership.class_limit} clases de {membership.plan_name}
                      </p>
                      <p className="text-xs text-amber-600">
                        Tu plan vence el {membership.end_date ? format(parseISO(membership.end_date), 'dd MMM yyyy', { locale: es }) : '—'}. Compra más clases para seguir reservando.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
                    <Link to="/app/checkout">
                      <Plus className="h-4 w-4 mr-2" />
                      Comprar más clases
                    </Link>
                  </Button>
                </div>
              ) : membership && isExpiredOrCancelled ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800">
                        Tu membresía {membership.status === 'expired' ? 'venció' : 'fue cancelada'}{membership.end_date ? ` el ${format(parseISO(membership.end_date), 'dd MMM yyyy', { locale: es })}` : ''}
                      </p>
                      <p className="text-xs text-amber-600">
                        Renueva para seguir reservando clases.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full rounded-xl bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
                    <Link to="/app/checkout">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renovar membresía
                    </Link>
                  </Button>
                </div>
              ) : membership ? (
                <>
                  {classLimit ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clases restantes</span>
                        <span className="font-medium">
                          {classesRemaining ?? 0} de {classLimit}
                        </span>
                      </div>
                      <Progress value={classesProgress ?? 0} className="h-2" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Clases ilimitadas activas
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {daysRemaining !== null ? `${daysRemaining} días restantes` : 'Sin fecha de vencimiento'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {membership.end_date ? `Vence: ${format(membershipEndDate!, 'dd MMM yyyy', { locale: es })}` : 'Sin vencimiento'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Aún no tienes una membresía activa.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/app/checkout">
                      <Plus className="h-4 w-4 mr-2" />
                      Comprar membresía
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Button asChild size="lg" className="h-auto w-full rounded-[1.35rem] bg-balance-olive py-5 text-balance-cream shadow-[0_18px_40px_-30px_rgba(51,42,34,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-balance-olive/90">
            <Link to="/app/book">
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Reservar clase</span>
            </Link>
          </Button>

          <Card className="rounded-[1.75rem] border-balance-sand/65 bg-[hsl(var(--card))]/88 shadow-[0_18px_58px_-50px_rgba(51,42,34,0.58)] transition-shadow duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Próximas clases</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <Link to="/app/classes">
                    Ver todas
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcomingClasses.length > 0 ? (
                <div className="space-y-3">
                  {upcomingClasses.map((cls) => (
                    <div
                      key={cls.booking_id}
                      className="flex items-center justify-between rounded-[1.15rem] border border-balance-sand/55 bg-balance-cream/45 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-balance-cream/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div 
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem]"
                          style={{ 
                            backgroundColor: cls.class_type_color ? `${cls.class_type_color}20` : 'hsl(var(--primary) / 0.1)'
                          }}
                        >
                          <Calendar 
                            className="h-5 w-5" 
                            style={{ color: cls.class_type_color || 'hsl(var(--primary))' }}
                          />
                        </div>
                        <div>
                          <p className="truncate font-semibold text-balance-dark">{cls.class_type_name}</p>
                          <p className="truncate text-sm text-balance-dark/55">
                            {format(parseISO(cls.date), 'EEE d MMM', { locale: es })} · {cls.start_time.slice(0, 5)} · {cls.instructor_name}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/app/classes/${cls.booking_id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="mx-auto h-10 w-10 text-balance-olive/60" />
                  <p className="mt-2 text-balance-dark/58">No tienes clases próximas</p>
                  <Button asChild className="mt-4 bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
                    <Link to="/app/book">Reservar ahora</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}

function DashboardMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.15rem] border border-balance-olive/16 bg-balance-cream/60 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-balance-dark/46">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-balance-dark">{value}</p>
    </div>
  );
}
