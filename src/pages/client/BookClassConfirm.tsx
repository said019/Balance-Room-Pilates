import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Clock, Users, Star } from 'lucide-react';

interface ClassDetail {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  status: string;
  class_type_name: string;
  class_type_color: string;
  instructor_name: string;
  instructor_photo: string | null;
  is_free?: boolean;
  free_label?: string | null;
}

export default function BookClassConfirm() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ClassDetail>({
    queryKey: ['class-detail', classId],
    queryFn: async () => {
      const { data } = await api.get(`/classes/${classId}`);
      return data;
    },
    enabled: Boolean(classId),
  });

  const canBook = Boolean(classId);
  const bookMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/bookings', { classId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes-public'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast({ title: '¡Reserva exitosa!', description: 'Te esperamos en clase.' });
      navigate('/app/classes');
    },
    onError: (err) => {
      toast({
        variant: 'destructive',
        title: 'No se pudo reservar',
        description: getErrorMessage(err),
      });
    },
  });

  const isFull = (data?.current_bookings || 0) >= (data?.max_capacity || 0);
  const isCancelled = data?.status === 'cancelled';
  const isPast = data ? parseISO(`${data.date.slice(0, 10)}T${data.start_time}`).getTime() <= Date.now() : false;
  // "Lugares" mostrado: casi lleno (escasez) salvo jueves, que muestra el real.
  // Solo visual: la reserva la valida el backend con el cupo real.
  const lugaresLabel = (() => {
    if (!data) return '';
    const isThursday = parseISO(`${data.date.slice(0, 10)}T12:00:00`).getDay() === 4;
    if (isThursday) return `${data.current_bookings}/${data.max_capacity}`;
    const seed = data.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const fakeFree = Math.min(1 + (seed % 2), data.max_capacity);
    const occupied = Math.max(data.current_bookings, data.max_capacity - fakeFree);
    return `${occupied}/${data.max_capacity}`;
  })();

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-heading">Confirmar reserva</h1>
            <p className="text-muted-foreground">Revisa los detalles antes de confirmar.</p>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : isError || !data ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No pudimos cargar la clase seleccionada.
              </CardContent>
            </Card>
          ) : (
            <Card className={`overflow-hidden border-0 shadow-md ${data.is_free ? 'ring-2 ring-green-300' : ''}`}>
              {/* Color band from class type */}
              <div
                className="h-2"
                style={{ backgroundColor: data.is_free ? '#16a34a' : (data.class_type_color || '#A48550') }}
              />
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2
                    className="text-xl font-bold font-heading"
                    style={{ color: data.is_free ? '#15803d' : (data.class_type_color || '#322A1E') }}
                  >
                    {data.class_type_name}
                  </h2>
                  {data.is_free && (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                      {data.free_label || 'Gratis'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {format(parseISO(data.date), 'EEEE d MMMM', { locale: es })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {data.start_time?.slice(0,5)} - {data.end_time?.slice(0,5)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={data.instructor_photo || undefined} alt={data.instructor_name} />
                    <AvatarFallback
                      className="text-xs text-white"
                      style={{ backgroundColor: data.class_type_color || '#A48550' }}
                    >
                      {data.instructor_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{data.instructor_name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Lugares: {lugaresLabel}</span>
                </div>
                <div className="pt-1 border-t space-y-1.5">
                  {data.is_free ? (
                    <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                      <span className="text-green-600">✓</span>
                      Esta clase es gratis. No se descontará ningún crédito.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      * Se descontará 1 crédito de tu membresía activa.
                    </p>
                  )}
                  <p className="text-xs font-medium text-balance-olive flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Ganarás 10 puntos de lealtad al asistir.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/app/book')}>
              Volver al calendario
            </Button>
            <Button
              onClick={() => bookMutation.mutate()}
              disabled={!canBook || bookMutation.isPending || isFull || isCancelled || isPast}
            >
              {bookMutation.isPending ? 'Reservando...' : isPast ? 'Clase ya pasada' : 'Confirmar reserva'}
            </Button>
          </div>
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
