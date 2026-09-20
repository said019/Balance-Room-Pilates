import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import api, { getErrorMessage } from '@/lib/api';
import { FoundingPolicySettings } from './FoundingPolicySettings';

type RuleKey = 'cancellation_hours' | 'booking_advance_days' | 'max_active_bookings' | 'max_bookings_per_day';
type PendingDecision = { key: string; status: 'pending'; adminNote: string; currentBehavior: string; requiresImplementation: boolean };
type OperationalSettings = Record<RuleKey, number | null> & {
    version: number;
    pendingDecisions: PendingDecision[];
    checkin: Record<string, unknown>;
};
type Draft = Record<RuleKey, string> & { notes: Record<string, string> };
const rules: { key: RuleKey; label: string; detail: string; unit: string; min: number; max: number; optional?: boolean }[] = [
    { key: 'cancellation_hours', label: 'Anticipación para cancelar o reagendar', detail: 'Se aplica a las siguientes cancelaciones y cambios de clase, incluso de reservas ya creadas. El historial se conserva.', unit: 'horas', min: 0, max: 168 },
    { key: 'booking_advance_days', label: 'Anticipación máxima para reservar', detail: 'Días de calendario, según la fecha de Ciudad de México.', unit: 'días', min: 1, max: 365, optional: true },
    { key: 'max_active_bookings', label: 'Reservas activas por persona', detail: 'Cuenta las reservas futuras confirmadas y con asistencia registrada.', unit: 'reservas', min: 1, max: 100, optional: true },
    { key: 'max_bookings_per_day', label: 'Reservas por persona al día', detail: 'Cuenta las reservas confirmadas, asistencias e inasistencias de la misma fecha.', unit: 'reservas', min: 1, max: 100, optional: true },
];
const decisionLabels: Record<string, string> = {
    waitlist_mode: 'Lista de espera', founding_seventh_cycle: 'Criterio Founding 50', minor_policy: 'Entrenamiento para menores',
    freeze_policy: 'Congelación de membresías', guest_passes: 'Pases para invitados', gift_cards: 'Tarjetas de regalo',
    upgrade_policy: 'Cambios de paquete', no_show_penalties: 'Penalizaciones adicionales por inasistencia',
    partner_channels: 'Plataformas y convenios', payment_provider: 'Proveedor de pagos en línea', notification_provider: 'Proveedor de notificaciones',
    retention_messages: 'Mensajes de seguimiento', birthday_messages: 'Mensajes de cumpleaños',
};
const asDraft = (settings: OperationalSettings): Draft => ({
    cancellation_hours: String(settings.cancellation_hours),
    booking_advance_days: settings.booking_advance_days === null ? '' : String(settings.booking_advance_days),
    max_active_bookings: settings.max_active_bookings === null ? '' : String(settings.max_active_bookings),
    max_bookings_per_day: settings.max_bookings_per_day === null ? '' : String(settings.max_bookings_per_day),
    notes: Object.fromEntries(settings.pendingDecisions.map(item => [item.key, item.adminNote || ''])),
});

export function OperationalSettingsContent() {
    const [settings, setSettings] = useState<OperationalSettings | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [error, setError] = useState('');
    const [conflict, setConflict] = useState(false);
    const [saved, setSaved] = useState(false);
    const load = async () => {
        setLoading(true); setLoadError(false);
        try {
            const { data } = await api.get<OperationalSettings>('/operational-settings');
            setSettings(data); setDraft(asDraft(data)); setConflict(false); setError(''); setSaved(false);
        } catch { setLoadError(true); }
        finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);
    const dirty = settings && draft ? JSON.stringify(draft) !== JSON.stringify(asDraft(settings)) : false;
    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (!settings || !draft || saving || conflict) return;
        const values = {} as Record<RuleKey, number | null>;
        for (const rule of rules) {
            const value = draft[rule.key].trim();
            if (rule.optional && value === '') { values[rule.key] = null; continue; }
            const number = Number(value);
            if (value === '' || !Number.isInteger(number) || number < rule.min || number > rule.max) {
                setError(`${rule.label}: escribe un número entero entre ${rule.min} y ${rule.max}.`); return;
            }
            values[rule.key] = number;
        }
        setSaving(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put<OperationalSettings>('/operational-settings', {
                expectedVersion: settings.version, ...values, pendingDecisionNotes: draft.notes,
            });
            setSettings(data); setDraft(asDraft(data)); setSaved(true);
        } catch (failure: any) {
            if (failure.response?.status === 409) {
                setConflict(true); setError('Otra persona actualizó la configuración. Tus cambios siguen aquí. Recarga la versión vigente antes de volver a editar.');
            } else setError(getErrorMessage(failure) || 'No pudimos guardar la configuración. Tus cambios siguen aquí.');
        } finally { setSaving(false); }
    };
    const update = (key: RuleKey, value: string) => { setDraft(previous => previous ? { ...previous, [key]: value } : previous); setSaved(false); };

    return <div className="mx-auto max-w-5xl space-y-8">
        <header className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ajustes del studio</p>
            <h1 className="mt-2 text-3xl">Operación y pendientes</h1>
            <p className="mt-3 text-muted-foreground">Define las reglas de reservación y conserva las decisiones que tu equipo todavía necesita confirmar.</p>
        </header>
        {loading ? <div role="status" aria-label="Consultando configuración" className="space-y-4"><Skeleton className="h-12 w-56" /><Skeleton className="h-72 w-full" /></div> : loadError ?
            <div role="alert" className="space-y-4 rounded-xl border p-6"><p>No pudimos consultar la configuración. Vuelve a intentarlo para ver los valores vigentes.</p><Button onClick={() => void load()}>Volver a consultar</Button></div> : settings && draft &&
            <form noValidate onSubmit={save} className="space-y-8">
                <section aria-labelledby="rules-title">
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2"><h2 id="rules-title" className="text-xl font-semibold">Reglas que aplica el sistema</h2><span className="text-sm text-muted-foreground">Versión {settings.version}</span></div>
                    <div className="divide-y rounded-2xl border bg-card px-5 md:px-7">
                        {rules.map(rule => <div key={rule.key} className="grid gap-4 py-6 md:grid-cols-[1.5fr_1fr] md:gap-8">
                            <div><Label htmlFor={rule.key} className="text-base font-semibold">{rule.label}</Label><p id={`${rule.key}-help`} className="mt-2 max-w-prose text-sm text-muted-foreground">{rule.detail}</p></div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3"><Input id={rule.key} type="number" inputMode="numeric" min={rule.min} max={rule.max} step="1" value={draft[rule.key]} onChange={event => update(rule.key, event.target.value)} disabled={saving} aria-describedby={`${rule.key}-help ${rule.key}-state`} className="max-w-40" /><span className="text-sm text-muted-foreground">{rule.unit}</span></div>
                                <p id={`${rule.key}-state`} className="text-sm">{settings[rule.key] === null ? <><span className="font-medium text-altitud-earth">Pendiente de configurar</span><span className="mt-1 block text-muted-foreground">Sin límite configurado. Deja el campo vacío para conservarlo así.</span></> : <><span className="font-medium text-altitud-olive">Vigente: {settings[rule.key]} {settings[rule.key] === 1 && rule.unit === 'reservas' ? 'reserva' : rule.unit}</span>{rule.optional && <span className="mt-1 block text-muted-foreground">Vacío elimina este límite.</span>}</>}</p>
                            </div>
                        </div>)}
                    </div>
                    <p className="mt-3 max-w-prose text-sm text-muted-foreground">Las inasistencias y las cancelaciones tardías consumen la clase. Los valores que escribas se aplican después de guardar.</p>
                </section>
                <details className="rounded-2xl border bg-card p-5 md:p-7">
                    <summary className="cursor-pointer text-lg font-semibold">Registro de asistencia · solo consulta</summary>
                    <p className="mt-3 max-w-prose text-sm text-muted-foreground">Estos valores se aplican actualmente. Su edición no está disponible en esta pantalla.</p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        {[
                            ['checkin_before_minutes', 'Apertura antes de la clase', 'minutos'],
                            ['checkin_after_minutes', 'Cierre después del inicio', 'minutos'],
                            ['late_after_minutes', 'Retardo después del inicio', 'minutos'],
                            ['self_checkin_radius_meters', 'Radio para registrar asistencia', 'metros'],
                        ].map(([key, label, unit]) => <div key={key} className="flex flex-wrap justify-between gap-2 border-b pb-2"><dt className="text-muted-foreground">{label}</dt><dd>{typeof settings.checkin[key] === 'number' ? `${settings.checkin[key]} ${unit}` : 'No informado'}</dd></div>)}
                        <div className="flex flex-wrap justify-between gap-2 border-b pb-2"><dt className="text-muted-foreground">Registro desde la app</dt><dd>{settings.checkin.self_checkin_enabled === true ? 'Habilitado' : settings.checkin.self_checkin_enabled === false ? 'Deshabilitado' : 'No informado'}</dd></div>
                    </dl>
                    <p className="mt-4 text-xs text-muted-foreground">Origen: {settings.checkin.source === 'system_settings' ? 'configuración del studio' : 'reglas vigentes del sistema'}.</p>
                </details>
                <section aria-labelledby="decisions-title">
                    <h2 id="decisions-title" className="text-xl font-semibold">Decisiones por confirmar</h2>
                    <p className="mt-2 mb-5 max-w-prose text-sm text-muted-foreground">Guarda requisitos y acuerdos para retomarlos con tu equipo. Una nota no activa servicios ni cambia el comportamiento actual. Evita incluir contraseñas o claves privadas.</p>
                    <div className="divide-y rounded-2xl border bg-card px-5 md:px-7">
                        {settings.pendingDecisions.filter(item => item.key !== 'founding_seventh_cycle').map(item => <details key={item.key} className="group py-1">
                            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                                <span className="font-medium">{decisionLabels[item.key] || item.key}</span><span className="flex shrink-0 items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:inline">Pendiente de configurar</span><span aria-hidden="true" className="text-xl group-open:rotate-45">+</span></span>
                            </summary>
                            <div className="space-y-4 pb-6"><p className="text-sm font-medium text-altitud-earth sm:hidden">Pendiente de configurar</p>
                                <p className="max-w-prose text-sm text-muted-foreground">{item.currentBehavior}</p>
                                {item.requiresImplementation && <p className="max-w-prose text-sm text-muted-foreground">Requiere confirmar la política y completar su implementación antes de poder activarla.</p>}
                                <div><Label htmlFor={`note-${item.key}`}>Nota administrativa: {decisionLabels[item.key] || item.key}</Label><Textarea id={`note-${item.key}`} className="mt-2 min-h-24" maxLength={2000} value={draft.notes[item.key] || ''} disabled={saving} onChange={event => { const value = event.target.value; setDraft(previous => previous ? { ...previous, notes: { ...previous.notes, [item.key]: value } } : previous); setSaved(false); }} /></div>
                            </div>
                        </details>)}
                    </div>
                </section>
                <div className="space-y-4 border-t pt-5">
                    {error && <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm text-destructive">{error}</p>{conflict && <Button type="button" variant="outline" onClick={() => void load()}>Recargar y descartar mis cambios</Button>}</div>}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p role="status" className="text-sm text-muted-foreground">{saved ? 'Configuración guardada.' : dirty ? 'Tienes cambios sin guardar.' : 'Los valores mostrados son los vigentes.'}</p><Button type="submit" disabled={saving || !dirty || conflict}>{saving ? 'Guardando…' : 'Guardar configuración'}</Button></div>
                </div>
            </form>}
        <FoundingPolicySettings />
        <section className="border-t pt-6"><h2 className="text-lg font-semibold">Horarios, cupos y paquetes</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">Administra cada sesión y sus condiciones en su sección habitual.</p><div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/admin/calendar">Abrir agenda</Link></Button><Button asChild variant="outline"><Link to="/admin/memberships/paquetes">Ver planes</Link></Button></div></section>
    </div>;
}

export default function OperationalSettings() {
    return <AuthGuard requiredRoles={['admin', 'super_admin']}><AdminLayout><OperationalSettingsContent /></AdminLayout></AuthGuard>;
}
