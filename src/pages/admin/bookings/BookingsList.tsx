import { useAuthStore } from '@/stores/authStore';
import ReceptionCheckin from './ReceptionCheckin';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { WellhubBadge } from '@/components/partners/WellhubBadge';
import { TotalPassBadge } from '@/components/partners/TotalPassBadge';
import api, { getErrorMessage } from '@/lib/api';
import type { BookingAdmin } from '@/types/booking';
import { CheckCircle2, Loader2, Search } from '@/components/brand/icons';

interface BookingsListProps {
  title?: string;
  description?: string;
  initialStatus?: string;
  statusLocked?: boolean;
}

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  waitlist: 'Lista de espera',
  checked_in: 'Check-in',
  no_show: 'No show',
  cancelled: 'Cancelada',
};

const statusStyles: Record<string, string> = {
  confirmed: 'bg-success/10 text-success border-success/30',
  waitlist: 'bg-warning/10 text-warning border-warning/30',
  checked_in: 'bg-info/10 text-info border-info/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  no_show: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function BookingsList({
  title = 'Reservas',
  description = 'Gestión de reservas y check-ins.',
  initialStatus = 'all',
  statusLocked = false,
}: BookingsListProps) {
  const isReception = useAuthStore(state => state.user?.role === 'reception');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [channel, setChannel] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<BookingAdmin[]>({
    queryKey: ['admin-bookings', status, channel, search],
    enabled: !isReception,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== 'all') params.append('status', status);
      if (channel !== 'all') params.append('channel', channel);
      if (search) params.append('search', search);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (bookingId: string) => api.post(`/bookings/${bookingId}/check-in`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Check-in realizado', description: 'Asistencia registrada.' });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
    },
  });

  const bookings = useMemo(() => data || [], [data]);

  if (isReception) return <AuthGuard requiredRoles={['reception']}><ReceptionCheckin /></AuthGuard>;
  return (
    <AuthGuard requiredRoles={['admin', 'super_admin', 'reception']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Buscar reservas por miembro o clase"
                placeholder="Buscar miembro o clase"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto xl:shrink-0">
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger aria-label="Filtrar por origen" className="w-full sm:w-52">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los orígenes</SelectItem>
                  <SelectItem value="wellhub">Wellhub</SelectItem>
                  <SelectItem value="totalpass">TotalPass</SelectItem>
                  <SelectItem value="balance">Altitud</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus} disabled={statusLocked}>
                <SelectTrigger aria-label="Filtrar por estado" className="w-full sm:w-56">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="waitlist">Lista de espera</SelectItem>
                  <SelectItem value="checked_in">Check-in</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table className="admin-record-table" role="table">
              <TableHeader role="rowgroup">
                <TableRow role="row">
                  <TableHead role="columnheader">Cliente</TableHead>
                  <TableHead role="columnheader">Origen</TableHead>
                  <TableHead role="columnheader">Clase</TableHead>
                  <TableHead role="columnheader">Horario</TableHead>
                  <TableHead role="columnheader">Estado</TableHead>
                  <TableHead role="columnheader">Check-in</TableHead>
                  <TableHead role="columnheader" className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody role="rowgroup">
                {isLoading ? (
                  <TableRow role="row">
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow role="row">
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron reservas.
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow role="row" key={booking.booking_id}>
                      <TableCell role="cell" data-label="Miembro" data-primary>
                          <div className="admin-record-value">
                            <div className="font-medium">{booking.user_name}</div>
                            <div className="text-xs text-muted-foreground">{booking.user_email}</div>
                          </div>
                      </TableCell>
                      <TableCell role="cell" data-label="Origen">
                          <div className="admin-record-value">
                            {booking.channel === 'wellhub' ? (
                              <WellhubBadge />
                            ) : booking.channel === 'totalpass' ? (
                              <TotalPassBadge />
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-altitud-sand/70 bg-altitud-cream/65 text-altitud-dark/65"
                              >
                                Altitud
                              </Badge>
                            )}
                          </div>
                      </TableCell>
                      <TableCell role="cell" data-label="Clase">
                          <div className="admin-record-value">
                            <div className="font-medium">{booking.class_name}</div>
                            <div className="text-xs text-muted-foreground">{booking.instructor_name}</div>
                          </div>
                      </TableCell>
                      <TableCell className="text-sm" role="cell" data-label="Horario">
                          <div className="admin-record-value">
                            <div className="font-medium">
                              {format(parseISO(booking.class_date), "EEE d MMM", { locale: es })}
                            </div>
                            <div className="text-muted-foreground">
                              {booking.class_start_time?.slice(0, 5)} - {booking.class_end_time?.slice(0, 5)}
                            </div>
                          </div>
                      </TableCell>
                      <TableCell role="cell" data-label="Estado">
                          <div className="admin-record-value">
                            <Badge variant="outline" className={statusStyles[booking.booking_status]}>
                              {statusLabel[booking.booking_status] || booking.booking_status}
                            </Badge>
                            {booking.booking_status === 'waitlist' && booking.waitlist_position !== null && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Posición #{booking.waitlist_position}
                              </div>
                            )}
                          </div>
                      </TableCell>
                      <TableCell className="text-sm" role="cell" data-label="Asistencia">
                          <div className="admin-record-value">
                            {booking.checked_in_at ? (
                              new Date(booking.checked_in_at).toLocaleTimeString()
                            ) : (
                              <span className="text-muted-foreground">Sin check-in</span>
                            )}
                          </div>
                      </TableCell>
                      <TableCell className="text-right" role="cell" data-label="Acciones" data-actions>
                          <div className="admin-record-value">
                            {booking.booking_status === 'confirmed' && (
                              <Button
                                disabled={checkInMutation.isPending}
                                size="sm"
                                variant="ghost"
                                className="text-success hover:text-success hover:bg-success/10"
                                onClick={() => checkInMutation.mutate(booking.booking_id)}
                              >
                                {checkInMutation.isPending && checkInMutation.variables === booking.booking_id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                {checkInMutation.isPending && checkInMutation.variables === booking.booking_id
                                  ? 'Registrando...'
                                  : 'Check-in'}
                              </Button>
                            )}
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
