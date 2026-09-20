import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api, { getErrorMessage } from '@/lib/api';

type Mode = 'six_payments' | 'six_calendar_months';
type Policy = { version: number; mode: Mode | null; pending: boolean; appliesTo: 'unassigned_enrollments' };
const labels = { six_payments: 'Seis pagos consecutivos', six_calendar_months: 'Seis meses de calendario' };

export function FoundingPolicySettings() {
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [mode, setMode] = useState<Mode | ''>('');
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [conflict, setConflict] = useState(false);
    const [saved, setSaved] = useState(false);
    async function load() {
        setLoading(true);
        try { const { data } = await api.get<Policy>('/founding50/policy'); setPolicy(data); setMode(data.mode || ''); setConfirmed(false); setError(''); setConflict(false); setSaved(false); }
        catch { setError('No pudimos consultar la regla Founding vigente.'); }
        finally { setLoading(false); }
    }
    useEffect(() => { void load(); }, []);
    async function save() {
        if (!policy || busy || conflict || (mode && !confirmed)) return;
        setBusy(true); setError(''); setSaved(false);
        try {
            const { data } = await api.put<Policy>('/founding50/policy', { expectedVersion: policy.version, mode: mode || null });
            setPolicy(data); setMode(data.mode || ''); setConfirmed(false); setSaved(true);
        } catch (failure: any) {
            if (failure.response?.status === 409) { setConflict(true); setError('Otra persona actualizó la regla Founding. Tu selección sigue aquí; recarga la versión vigente antes de guardar.'); }
            else setError(getErrorMessage(failure) || 'No pudimos guardar la regla Founding.');
        } finally { setBusy(false); }
    }
    return <section id="founding-rule" aria-labelledby="founding-rule-title" className="space-y-5 border-t pt-8">
        <div><h2 id="founding-rule-title" className="text-xl font-semibold">Regla de Founding 50</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">El criterio se asigna al siguiente pago aceptado de los miembros que todavía no tienen una regla asignada. Los pagos anteriores y las reglas ya asignadas se conservan.</p></div>
        {loading ? <p role="status">Consultando la regla Founding…</p> : policy ? <form className="space-y-5 rounded-2xl border bg-card p-5 md:p-7" onSubmit={event => { event.preventDefault(); void save(); }}>
            <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]"><div><Label htmlFor="founding-mode" className="text-base font-semibold">Duración del beneficio Founding</Label><p className="mt-2 text-sm text-muted-foreground">Vigente: {policy.mode ? labels[policy.mode] : 'Pendiente de configurar'} · Versión {policy.version}</p></div>
                <select id="founding-mode" className="min-h-11 w-full rounded-md border bg-background px-3 text-base" value={mode} disabled={busy} onChange={event => { setMode(event.target.value as Mode | ''); setConfirmed(false); setSaved(false); }}><option value="">Pendiente de configurar</option><option value="six_payments">Seis pagos consecutivos</option><option value="six_calendar_months">Seis meses de calendario</option></select>
            </div>
            <p className="max-w-prose text-sm">{mode === 'six_payments' ? 'El beneficio permite hasta seis pagos consecutivos. Después aplica el precio regular vigente.' : mode === 'six_calendar_months' ? 'El beneficio permite periodos de 30 días que comiencen antes de cumplir seis meses desde la activación. Según las fechas, puede incluir un séptimo pago.' : 'La interpretación queda pendiente. Esta selección no elimina las reglas que ya tienen asignadas los miembros.'}</p>
            {mode && mode !== policy.mode && <label className="flex max-w-prose cursor-pointer items-start gap-3 text-sm"><input className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy} /><span>Confirmo que esta regla se asignará al siguiente pago aceptado de los miembros sin regla asignada, sin modificar pagos anteriores ni reglas ya asignadas.</span></label>}
            {error && <div role="alert" className="space-y-3 text-sm text-destructive"><p>{error}</p>{conflict && <Button type="button" variant="outline" onClick={() => void load()}>Recargar regla y descartar mi selección</Button>}</div>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p role="status" className="text-sm text-muted-foreground">{saved ? 'Regla Founding guardada.' : 'Este cambio se guarda por separado.'}</p><Button type="submit" disabled={busy || conflict || mode === (policy.mode || '') || (!!mode && !confirmed)}>{busy ? 'Guardando…' : 'Guardar regla Founding'}</Button></div>
        </form> : <div role="alert" className="space-y-3"><p>{error}</p><Button variant="outline" onClick={() => void load()}>Consultar regla Founding</Button></div>}
    </section>;
}
