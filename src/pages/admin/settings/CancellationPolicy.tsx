import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Clock, RotateCcw, CalendarCheck } from '@/components/brand/icons';

export default function CancellationPolicy() {
  const policy = useQuery({ queryKey: ['cancellation-policy'], queryFn: async () => (await api.get('/settings/cancellation-policy')).data });
  return <AuthGuard requiredRoles={['admin', 'super_admin']}><AdminLayout>
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="text-xs uppercase tracking-[0.2em] text-altitud-olive">Operación del studio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-altitud-dark">Política de cancelación</h1>
        <p className="mt-2 text-sm text-muted-foreground">Las mismas reglas para tu equipo y tu comunidad.</p></div>
      {policy.isError ? <Card><CardContent className="space-y-3 pt-6"><p>No pudimos consultar la política vigente.</p><Button onClick={() => policy.refetch()}>Volver a intentar</Button></CardContent></Card> :
      policy.isLoading ? <p role="status">Consultando la política…</p> : <>
        <Card><CardHeader><CardTitle className="flex items-center gap-3"><Clock className="h-5 w-5 text-altitud-olive" />Con 4 horas de anticipación</CardTitle></CardHeader>
          <CardContent><p>Puedes cancelar o reagendar hasta 4 horas antes de la clase. El crédito vuelve al paquete de origen y conserva su vigencia.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-3"><RotateCcw className="h-5 w-5 text-altitud-olive" />Cuida cada reserva</CardTitle></CardHeader>
          <CardContent><p>Las cancelaciones tardías y las inasistencias consumen la clase. No hay un límite adicional de cancelaciones realizadas a tiempo por paquete.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-altitud-olive" />Vigencia de los paquetes</CardTitle></CardHeader>
          <CardContent><p>Los paquetes de 4, 8 y 12 clases y Unlimited tienen 30 días de vigencia. Las clases no utilizadas no son acumulables ni transferibles.</p></CardContent></Card>
        <p className="text-sm text-muted-foreground">Esta es la política vigente de 2707 Altitud para clases regulares. Los eventos pueden tener condiciones propias.</p>
      </>}
    </div>
  </AdminLayout></AuthGuard>;
}
