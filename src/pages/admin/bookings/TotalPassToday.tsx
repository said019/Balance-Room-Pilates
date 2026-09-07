import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TotalPassBadge } from '@/components/partners/TotalPassBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import api, { getErrorMessage } from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';

interface TotalPassBooking {
  bookingId: string;
  time: string;
  className: string;
  instructorName: string | null;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  bookingStatus: string;
  checkedInAt: string | null;
  localCheckin: boolean;
  checkinTotalPass: boolean;
  status: 'registered' | 'pending';
}

interface TotalPassTodayResponse {
  date: string;
  total: number;
  registered: number;
  pending: number;
  bookings: TotalPassBooking[];
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function TotalPassToday() {
  const [date, setDate] = useState(today());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useQuery<TotalPassTodayResponse>({
    queryKey: ['totalpass-today', date],
    queryFn: async () => (await api.get(`/partners/totalpass/today?date=${date}`)).data,
    refetchInterval: 60_000,
  });

  const checkInMutation = useMutation({
    mutationFn: async ({
      bookingId,
      retryTotalPass,
    }: {
      bookingId: string;
      retryTotalPass: boolean;
    }) => (
      retryTotalPass
        ? api.post(`/partners/totalpass/attendance/${bookingId}`)
        : api.post(`/bookings/${bookingId}/check-in`)
    ),
    onSuccess: (_response, variables) => {
      toast({
        title: variables.retryTotalPass ? 'TotalPass confirmado' : 'Asistencia enviada',
        description: variables.retryTotalPass
          ? 'La visita quedó registrada correctamente en TotalPass.'
          : '2707 Altitud registró el check-in y está confirmándolo con TotalPass.',
      });
      window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['totalpass-today'] });
      }, 1_000);
    },
    onError: (error) => {
      toast({
        title: 'No se pudo registrar',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const bookings = data?.bookings || [];

  return (
    <AuthGuard requiredRoles={['admin', 'instructor', 'reception']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2">
                <TotalPassBadge />
              </div>
              <h1 className="font-heading text-2xl font-bold">Check-ins de TotalPass</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reservas del día y confirmación real de la visita en TotalPass.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                aria-label="Fecha del tablero TotalPass"
                className="w-auto"
                onChange={(event) => setDate(event.target.value || today())}
                type="date"
                value={date}
              />
              <Button
                aria-label="Actualizar check-ins TotalPass"
                disabled={isFetching}
                onClick={() => refetch()}
                size="icon"
                variant="outline"
              >
                {isFetching
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Reservas del día" value={data?.total || 0} />
            <SummaryCard
              label="Registradas en TotalPass"
              tone="success"
              value={data?.registered || 0}
            />
            <SummaryCard
              label="Sin confirmar"
              tone="warning"
              value={data?.pending || 0}
            />
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-5 py-4">
            <Smartphone className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              La visita puede confirmarse desde la app de TotalPass o al registrar aquí
              la asistencia. El estado “Registrado” indica que TotalPass ya aceptó el
              check-in; la asistencia local por sí sola no sustituye esa confirmación.
            </p>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Hora</TableHead>
                  <TableHead>Clienta</TableHead>
                  <TableHead className="hidden md:table-cell">Clase</TableHead>
                  <TableHead>TotalPass</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell className="py-10 text-center" colSpan={5}>
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && bookings.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="py-10 text-center text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      No hay reservas de TotalPass para{' '}
                      {format(parseISO(date), "d 'de' MMMM", { locale: es })}.
                    </TableCell>
                  </TableRow>
                )}

                {bookings.map((booking) => {
                  const isCheckingIn =
                    checkInMutation.isPending
                    && checkInMutation.variables?.bookingId === booking.bookingId;
                  return (
                    <TableRow
                      className={booking.checkinTotalPass ? undefined : 'bg-warning/[0.04]'}
                      key={booking.bookingId}
                    >
                      <TableCell className="font-medium tabular-nums">
                        {booking.time}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{booking.userName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {booking.userPhone || booking.userEmail || 'Sin contacto'}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm">{booking.className}</p>
                        {booking.instructorName && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            con {booking.instructorName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.checkinTotalPass ? (
                          <Badge
                            className="border-success/30 bg-success/10 text-success"
                            variant="outline"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Registrado
                          </Badge>
                        ) : (
                          <Badge
                            className="border-warning/30 bg-warning/10 text-warning"
                            variant="outline"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!booking.checkinTotalPass && (
                          !booking.localCheckin || booking.bookingStatus === 'checked_in'
                        ) ? (
                          <Button
                            disabled={checkInMutation.isPending}
                            onClick={() => checkInMutation.mutate({
                              bookingId: booking.bookingId,
                              retryTotalPass: booking.localCheckin,
                            })}
                            size="sm"
                            variant="outline"
                          >
                            {isCheckingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {booking.localCheckin ? 'Reintentar TotalPass' : 'Registrar asistencia'}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {booking.localCheckin ? 'Asistencia local lista' : '—'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning' && value > 0
        ? 'text-warning'
        : 'text-foreground';
  return (
    <div className="rounded-xl border bg-card px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-light tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
