import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Megaphone, Send, Loader2, MessageCircle, Mail, ShieldCheck, Pause, Play, History, Users } from 'lucide-react';

interface WaBroadcast {
    id: string;
    channel?: string;
    subject: string | null;
    total: number;
    sent: number;
    failed: number;
    status: string; // running | paused | done | aborted | error
    pending?: number;
    error?: string | null;
    created_at?: string;
}

const statusLabel = (s: string): string =>
    ({ running: '⏳ En curso', paused: '⏸️ Pausado', done: '✅ Completado', aborted: '⛔ Detenido', error: '⚠️ Error' } as Record<string, string>)[s] || s;

export default function Communication() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [useEmail, setUseEmail] = useState(true);
    const [useWhatsapp, setUseWhatsapp] = useState(false);
    const [audience, setAudience] = useState<'all' | 'active' | 'inactive'>('all');
    const [waBroadcastId, setWaBroadcastId] = useState<string | null>(null);

    // How many clients match the selected audience (per channel, after opt-out).
    const { data: counts } = useQuery<{ email: number; whatsapp: number }>({
        queryKey: ['recipients-count', audience],
        queryFn: async () => (await api.get(`/marketing/recipients-count?audience=${audience}`)).data,
    });
    const audienceLabel: Record<string, string> = {
        all: 'Todos los clientes',
        active: 'Con membresía activa',
        inactive: 'Sin membresía activa',
    };

    // Poll the WhatsApp broadcast progress (it sends gradually in the background).
    const { data: waStatus } = useQuery<WaBroadcast>({
        queryKey: ['wa-broadcast', waBroadcastId],
        queryFn: async () => (await api.get(`/marketing/broadcasts/${waBroadcastId}`)).data,
        enabled: !!waBroadcastId,
        refetchInterval: (q) => {
            const s = (q.state.data as any)?.status;
            return s && ['running', 'paused'].includes(s) ? 4000 : false;
        },
    });

    // History of WhatsApp broadcasts (so the admin can resume/pause any of them).
    const { data: allBroadcasts = [] } = useQuery<WaBroadcast[]>({
        queryKey: ['wa-broadcasts'],
        queryFn: async () => (await api.get('/marketing/broadcasts')).data,
        refetchInterval: 8000,
    });
    const waBroadcasts = allBroadcasts.filter((b) => b.channel === 'whatsapp');

    const pauseMutation = useMutation({
        mutationFn: async (id: string) => (await api.post(`/marketing/broadcasts/${id}/pause`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wa-broadcasts'] });
            queryClient.invalidateQueries({ queryKey: ['wa-broadcast'] });
            toast({ title: 'Envío pausado', description: 'Se reanudará donde quedó cuando le des Reanudar.' });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const resumeMutation = useMutation({
        mutationFn: async (id: string) => (await api.post(`/marketing/broadcasts/${id}/resume`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wa-broadcasts'] });
            queryClient.invalidateQueries({ queryKey: ['wa-broadcast'] });
            toast({ title: 'Envío reanudado', description: 'Continúa desde donde se había quedado.' });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const broadcastMutation = useMutation({
        mutationFn: async () => {
            const channels: string[] = [];
            if (useEmail) channels.push('email');
            if (useWhatsapp) channels.push('whatsapp');
            return (await api.post('/marketing/broadcast', {
                subject: subject.trim(),
                message: message.trim(),
                discountCode: discountCode.trim() || undefined,
                channels,
                audience,
            })).data;
        },
        onSuccess: (data) => {
            const parts: string[] = [];
            if (data.email) parts.push(`Correo enviado a ${data.email.sent}/${data.email.total}`);
            if (data.whatsapp) {
                if (data.whatsapp.broadcastId) {
                    parts.push(`WhatsApp: en cola para ${data.whatsapp.total} (~1 cada ${data.whatsapp.intervalMinutes} min, máx ${data.whatsapp.dailyCap}/día)`);
                    setWaBroadcastId(data.whatsapp.broadcastId);
                } else {
                    parts.push(data.whatsapp.note || 'WhatsApp: sin destinatarios.');
                }
            }
            toast({ title: 'Envío iniciado', description: parts.join(' · ') || 'Listo.' });
            setSubject('');
            setMessage('');
            setDiscountCode('');
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const loadPromosMutation = useMutation({
        mutationFn: async () => (await api.get('/marketing/active-promos')).data as Array<{ name: string; price: number; promo_price: number; promo_label: string | null }>,
        onSuccess: (promos) => {
            if (!promos || promos.length === 0) {
                toast({ title: 'Sin promociones', description: 'No hay planes con precio promocional activo. Configúralos en Membresías → Planes.' });
                return;
            }
            const lines = promos.map((p) => {
                const before = Number(p.price).toLocaleString('es-MX');
                const now = Number(p.promo_price).toLocaleString('es-MX');
                const label = p.promo_label ? ` (${p.promo_label})` : '';
                return `💛 ${p.name}\nAntes $${before} → Ahora $${now} MXN${label}`;
            });
            setSubject('🎉 Promociones por tiempo limitado — 2707 Altitud');
            setMessage(`¡Aprovecha nuestras promos!\n\n${lines.join('\n\n')}\n\n¡Te esperamos! 🧘`);
            toast({ title: 'Promos cargadas', description: `${promos.length} plan(es) en promoción. Revisa el mensaje y envíalo.` });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const canSend = subject.trim().length >= 2 && message.trim().length >= 2 && (useEmail || useWhatsapp);

    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="space-y-6 max-w-3xl">
                    <div>
                        <h1 className="text-2xl font-heading font-bold">Comunicación</h1>
                        <p className="text-muted-foreground">Correos masivos de promociones por email y WhatsApp.</p>
                    </div>

                    {/* Correo masivo */}
                    <section className="rounded-xl border bg-card p-6">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-altitud-olive" />
                                <h2 className="text-lg font-semibold">Correo masivo (promociones)</h2>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPromosMutation.mutate()}
                                disabled={loadPromosMutation.isPending}
                            >
                                {loadPromosMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Cargar promociones actuales
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="subject">Asunto</Label>
                                <Input
                                    id="subject"
                                    placeholder="Ej. ¡20% de descuento esta semana!"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    maxLength={200}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="message">Mensaje</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Escribe tu promoción o descuento aquí…"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={6}
                                    maxLength={5000}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="discount">Código de descuento (opcional)</Label>
                                <Input
                                    id="discount"
                                    placeholder="Ej. BALANCE20"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    maxLength={50}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Enviar a</Label>
                                <Select value={audience} onValueChange={(v) => setAudience(v as 'all' | 'active' | 'inactive')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los clientes</SelectItem>
                                        <SelectItem value="active">Con membresía activa</SelectItem>
                                        <SelectItem value="inactive">Sin membresía activa (recuperar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Enviar por</Label>
                                <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer">
                                    <span className="flex items-center gap-3">
                                        <Checkbox checked={useEmail} onCheckedChange={(v) => setUseEmail(v === true)} />
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Correo electrónico</span>
                                    </span>
                                    {useEmail && counts && <span className="text-xs text-muted-foreground">{counts.email} destinatarios</span>}
                                </label>
                                <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer">
                                    <span className="flex items-center gap-3">
                                        <Checkbox checked={useWhatsapp} onCheckedChange={(v) => setUseWhatsapp(v === true)} />
                                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">WhatsApp</span>
                                    </span>
                                    {useWhatsapp && counts && <span className="text-xs text-muted-foreground">{counts.whatsapp} destinatarios</span>}
                                </label>
                                {useWhatsapp && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            Por seguridad, WhatsApp se envía <strong>poco a poco</strong> (1 cada pocos minutos, personalizado y con opción de baja) para no arriesgar el número. Si la conexión se cae, se pausa solo y se reanuda al volver.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        const ch = [useEmail && 'correo', useWhatsapp && 'WhatsApp'].filter(Boolean).join(' y ');
                                        const who = audienceLabel[audience].toLowerCase();
                                        if (confirm(`¿Enviar por ${ch} a: ${who}?`)) {
                                            broadcastMutation.mutate();
                                        }
                                    }}
                                    disabled={!canSend || broadcastMutation.isPending}
                                >
                                    {broadcastMutation.isPending
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                                        : <><Send className="mr-2 h-4 w-4" /> Enviar a {audienceLabel[audience].toLowerCase()}</>}
                                </Button>
                            </div>

                            {waStatus && (
                                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 font-medium">
                                            <MessageCircle className="h-4 w-4" /> Envío por WhatsApp
                                        </div>
                                        {waStatus.status === 'running' && (
                                            <Button size="sm" variant="outline" onClick={() => pauseMutation.mutate(waStatus.id)} disabled={pauseMutation.isPending}>
                                                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar
                                            </Button>
                                        )}
                                        {['paused', 'aborted', 'error'].includes(waStatus.status) && (
                                            <Button size="sm" variant="outline" onClick={() => resumeMutation.mutate(waStatus.id)} disabled={resumeMutation.isPending}>
                                                <Play className="mr-1.5 h-3.5 w-3.5" /> Reanudar
                                            </Button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-muted-foreground">
                                        {waStatus.status === 'running' && `Enviando… ${waStatus.sent}/${waStatus.total}${waStatus.pending != null ? ` · ${waStatus.pending} pendientes` : ''}. Se envía poco a poco; puedes cerrar esta página.`}
                                        {waStatus.status === 'paused' && `⏸️ Pausado en ${waStatus.sent}/${waStatus.total}. Reanuda donde quedó.`}
                                        {waStatus.status === 'done' && `✅ Completado: ${waStatus.sent} enviados${waStatus.failed ? `, ${waStatus.failed} fallaron` : ''}.`}
                                        {waStatus.status === 'aborted' && `⛔ Detenido: ${waStatus.error || ''} (${waStatus.sent} enviados). Puedes reanudar.`}
                                        {waStatus.status === 'error' && `⚠️ Error: ${waStatus.error || ''} (${waStatus.sent} enviados). Puedes reanudar.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Historial de envíos por WhatsApp (pausar / reanudar) */}
                    <section className="rounded-xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="h-5 w-5 text-altitud-olive" />
                            <h2 className="text-lg font-semibold">Historial de WhatsApp</h2>
                        </div>
                        {waBroadcasts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aún no hay envíos por WhatsApp.</p>
                        ) : (
                            <div className="space-y-2">
                                {waBroadcasts.map((b) => (
                                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{b.subject || '(sin asunto)'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {statusLabel(b.status)} · {b.sent}/{b.total}{b.failed ? ` · ${b.failed} fallidos` : ''}
                                                {b.created_at ? ` · ${new Date(b.created_at).toLocaleDateString('es-MX')}` : ''}
                                            </div>
                                        </div>
                                        {b.status === 'running' && (
                                            <Button size="sm" variant="outline" onClick={() => pauseMutation.mutate(b.id)} disabled={pauseMutation.isPending}>
                                                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar
                                            </Button>
                                        )}
                                        {['paused', 'aborted', 'error'].includes(b.status) && (
                                            <Button size="sm" variant="outline" onClick={() => resumeMutation.mutate(b.id)} disabled={resumeMutation.isPending}>
                                                <Play className="mr-1.5 h-3.5 w-3.5" /> Reanudar
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
