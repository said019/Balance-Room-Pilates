import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Cake, Megaphone, Send, Loader2 } from 'lucide-react';

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
            return (await api.post('/marketing/broadcast', {
                subject: subject.trim(),
                message: message.trim(),
                discountCode: discountCode.trim() || undefined,
            })).data;
        },
        onSuccess: (data) => {
            toast({
                title: 'Correo enviado',
                description: `Enviado a ${data.sent} de ${data.total} clientes${data.failed ? ` (${data.failed} fallaron)` : ''}.`,
            });
            setSubject('');
            setMessage('');
            setDiscountCode('');
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const canSend = subject.trim().length >= 2 && message.trim().length >= 2;

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
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => {
                                        if (confirm('¿Enviar este correo a TODOS los clientes?')) {
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
                        </div>
                    </section>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
