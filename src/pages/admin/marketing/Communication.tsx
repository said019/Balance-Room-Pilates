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
import { useToast } from '@/components/ui/use-toast';
import { Cake, Megaphone, Send, Loader2, MessageCircle, Mail, ShieldCheck } from 'lucide-react';

interface BirthdayClient {
    id: string;
    display_name: string;
    email: string | null;
    phone: string | null;
}

export default function Communication() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [greetingId, setGreetingId] = useState<string | null>(null);

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [discountCode, setDiscountCode] = useState('');
    const [useEmail, setUseEmail] = useState(true);
    const [useWhatsapp, setUseWhatsapp] = useState(false);
    const [waBroadcastId, setWaBroadcastId] = useState<string | null>(null);

    // Poll the WhatsApp broadcast progress (it sends gradually in the background).
    const { data: waStatus } = useQuery<{ total: number; sent: number; failed: number; status: string; error: string | null }>({
        queryKey: ['wa-broadcast', waBroadcastId],
        queryFn: async () => (await api.get(`/marketing/broadcasts/${waBroadcastId}`)).data,
        enabled: !!waBroadcastId,
        refetchInterval: (q) => {
            const s = (q.state.data as any)?.status;
            return s && ['done', 'aborted', 'error'].includes(s) ? false : 4000;
        },
    });

    const { data: birthdays = [], isLoading: loadingBdays } = useQuery<BirthdayClient[]>({
        queryKey: ['marketing-birthdays'],
        queryFn: async () => (await api.get('/marketing/birthdays')).data,
    });

    const greetMutation = useMutation({
        mutationFn: async (userId: string) => {
            setGreetingId(userId);
            return (await api.post(`/marketing/birthdays/${userId}/greet`)).data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['marketing-birthdays'] });
            toast({
                title: 'Saludo enviado 🎉',
                description: data.sent
                    ? 'WhatsApp de cumpleaños enviado.'
                    : (data.hasPhone ? 'No se pudo enviar el WhatsApp (revisa la conexión).' : 'El cliente no tiene teléfono; solo se otorgaron los puntos.'),
                variant: data.sent || !data.hasPhone ? 'default' : 'destructive',
            });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
        onSettled: () => setGreetingId(null),
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
            })).data;
        },
        onSuccess: (data) => {
            const parts: string[] = [];
            if (data.email) parts.push(`Correo enviado a ${data.email.sent}/${data.email.total}`);
            if (data.whatsapp) {
                parts.push(`WhatsApp: enviando a ${data.whatsapp.total} (~${data.whatsapp.estimateMinutes} min, en segundo plano)`);
                setWaBroadcastId(data.whatsapp.broadcastId);
            }
            toast({ title: 'Envío iniciado', description: parts.join(' · ') || 'Listo.' });
            setSubject('');
            setMessage('');
            setDiscountCode('');
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
                        <p className="text-muted-foreground">Saludos de cumpleaños y correos masivos de promociones.</p>
                    </div>

                    {/* Cumpleaños de hoy */}
                    <section className="rounded-xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Cake className="h-5 w-5 text-balance-olive" />
                            <h2 className="text-lg font-semibold">Cumpleaños de hoy</h2>
                        </div>
                        {loadingBdays ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : birthdays.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nadie cumple años hoy. 🎂</p>
                        ) : (
                            <div className="space-y-2">
                                {birthdays.map((b) => (
                                    <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{b.display_name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {b.phone || 'Sin teléfono'}{b.email ? ` · ${b.email}` : ''}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => greetMutation.mutate(b.id)}
                                            disabled={greetMutation.isPending}
                                        >
                                            {greetingId === b.id
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <>🎉 Enviar saludo</>}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Correo masivo */}
                    <section className="rounded-xl border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Megaphone className="h-5 w-5 text-balance-olive" />
                            <h2 className="text-lg font-semibold">Correo masivo (promociones)</h2>
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

                            <div className="space-y-2">
                                <Label>Enviar por</Label>
                                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                                    <Checkbox checked={useEmail} onCheckedChange={(v) => setUseEmail(v === true)} />
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Correo electrónico</span>
                                </label>
                                <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer">
                                    <Checkbox checked={useWhatsapp} onCheckedChange={(v) => setUseWhatsapp(v === true)} />
                                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">WhatsApp</span>
                                </label>
                                {useWhatsapp && (
                                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
                                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            Por seguridad, WhatsApp se envía <strong>poco a poco</strong> (con pausas y personalizado con el nombre) para no arriesgar el número. Tarda varios minutos y, si la conexión se cae, se detiene solo.
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        const ch = [useEmail && 'correo', useWhatsapp && 'WhatsApp'].filter(Boolean).join(' y ');
                                        if (confirm(`¿Enviar por ${ch} a TODOS los clientes?`)) {
                                            broadcastMutation.mutate();
                                        }
                                    }}
                                    disabled={!canSend || broadcastMutation.isPending}
                                >
                                    {broadcastMutation.isPending
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                                        : <><Send className="mr-2 h-4 w-4" /> Enviar a todos los clientes</>}
                                </Button>
                            </div>

                            {waStatus && (
                                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <MessageCircle className="h-4 w-4" /> Envío por WhatsApp
                                    </div>
                                    <p className="mt-1 text-muted-foreground">
                                        {waStatus.status === 'running' && `Enviando… ${waStatus.sent}/${waStatus.total} (puede tardar varios minutos; puedes cerrar esta página).`}
                                        {waStatus.status === 'done' && `✅ Completado: ${waStatus.sent} enviados${waStatus.failed ? `, ${waStatus.failed} fallaron` : ''}.`}
                                        {waStatus.status === 'aborted' && `⛔ Detenido por seguridad: ${waStatus.error || ''} (${waStatus.sent} enviados).`}
                                        {waStatus.status === 'error' && `⚠️ Error: ${waStatus.error || ''} (${waStatus.sent} enviados).`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
