import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function PoliciesSettings() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <header>
                    <h1 className="text-2xl font-heading font-bold">Políticas de reservación</h1>
                    <p className="text-muted-foreground">Consulta las reglas vigentes de 2707 Altitud.</p>
                </header>
                <Card>
                    <CardHeader>
                        <CardTitle>Cancelaciones y asistencia</CardTitle>
                        <CardDescription>Política vigente del studio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Las cancelaciones y los cambios de clase requieren un mínimo de 4 horas de anticipación.</p>
                        <p>Las inasistencias y las cancelaciones tardías consumen la clase.</p>
                        <Button asChild variant="outline"><Link to="/admin/settings/cancellations">Consultar política de cancelación</Link></Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Reglas adicionales</CardTitle>
                        <CardDescription>No disponibles para configurar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Los límites de anticipación, el máximo de reservas por persona y la promoción automática de la lista de espera todavía no están disponibles como ajustes. Esta pantalla no modifica esas reglas.</p>
                        <p className="text-muted-foreground">La lista de espera sigue disponible para clases llenas. Sus ajustes de activación y promoción automática aún no pueden configurarse.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Horarios y cupos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p>Los horarios publicados y los cupos se administran desde sus secciones habituales.</p>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="outline"><Link to="/admin/classes/schedules">Administrar horarios</Link></Button>
                            <Button asChild variant="outline"><Link to="/admin/calendar">Abrir agenda</Link></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
