import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import type { User } from '@/types/auth';
import type { Order } from '@/types/order';
import { Calendar, Phone, Shield, User as UserIcon, KeyRound, Sparkles, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/client/ChangePasswordDialog';

interface ProfileResponse {
  user: User;
}

export default function Profile() {
  const { user: authUser } = useAuthStore();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ['profile', authUser?.id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${authUser?.id}`);
      return data;
    },
    enabled: Boolean(authUser?.id),
  });

  const profile = data?.user ?? authUser;

  // Pending orders so the user doesn't lose track of them while browsing.
  const { data: orders } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders/my-orders')).data,
    enabled: Boolean(authUser?.id),
  });

  const pendingOrders = (orders ?? []).filter(
    o => o.status === 'pending_payment' || o.status === 'pending_verification'
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
                Cuenta
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance-dark sm:text-4xl">Mi perfil</h1>
              <p className="mt-1 text-sm text-balance-dark/62">Administra tu información personal.</p>
            </div>
            <Button asChild className="bg-balance-olive text-balance-cream hover:bg-balance-olive/90">
              <Link to="/app/profile/edit">Editar perfil</Link>
            </Button>
          </div>
          </section>

          {pendingOrders.length > 0 && (
            <Card className="rounded-[1.75rem] border-amber-300/70 bg-amber-50/80 shadow-[0_18px_58px_-50px_rgba(51,42,34,0.58)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  Tienes {pendingOrders.length} {pendingOrders.length === 1 ? 'orden pendiente' : 'órdenes pendientes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-amber-800/80">
                  Completa el pago o sube tu comprobante para no perder tu compra.
                </p>
                {pendingOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/app/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-balance-cream/70 px-4 py-3 transition hover:bg-balance-cream"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 flex-shrink-0 text-amber-600" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-balance-dark">
                          {order.plan_name || 'Orden'} · #{order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.status === 'pending_payment' ? 'Esperando pago' : 'En revisión'}
                          {' · '}
                          {format(new Date(order.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={order.status === 'pending_payment' ? 'secondary' : 'outline'}
                        className="rounded-full"
                      >
                        ${Number(order.total).toLocaleString('es-MX')}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : profile ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="rounded-[1.75rem] border-balance-sand/65 bg-[hsl(var(--card))]/88 shadow-[0_18px_58px_-50px_rgba(51,42,34,0.58)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                    Datos del miembro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-16 w-16 border border-balance-sand/70">
                        <AvatarImage src={profile.photo_url || undefined} alt={profile.display_name} />
                        <AvatarFallback>
                          {profile.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold text-balance-dark">{profile.display_name}</p>
                        <p className="text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-balance-olive/10 text-balance-olive">Cliente</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {profile.date_of_birth
                          ? format(new Date(profile.date_of_birth.slice(0, 10) + 'T12:00:00'), 'dd MMM yyyy', { locale: es })
                          : 'Sin fecha de nacimiento'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Contacto de emergencia</p>
                      <p className="text-muted-foreground">
                        {profile.emergency_contact_name
                          ? `${profile.emergency_contact_name} • ${profile.emergency_contact_phone || 'Sin teléfono'}`
                          : 'No registrado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.75rem] border-balance-olive/25 bg-balance-olive/8 shadow-[0_18px_58px_-50px_rgba(51,42,34,0.58)]">
                <CardHeader>
                  <CardTitle>Atajos rápidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-between rounded-full border-balance-olive/25 bg-balance-cream/55" variant="outline">
                    <Link to="/app/profile/membership">Ver membresía <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button asChild className="w-full justify-between rounded-full border-balance-olive/25 bg-balance-cream/55" variant="outline">
                    <Link to="/app/profile/preferences">Preferencias <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                  <Button
                    className="w-full rounded-full border-balance-olive/25 bg-balance-cream/55"
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    Cambiar contraseña
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No pudimos cargar tu perfil.
              </CardContent>
            </Card>
          )}
        </div>

        <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      </ClientLayout>
    </AuthGuard>
  );
}
