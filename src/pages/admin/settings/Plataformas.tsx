import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import api from '@/lib/api';

const WELLHUB_RECEIVER_URL = 'https://wellhub-gateway-production.up.railway.app/webhooks/wellhub';

interface PlatformSettingsRow {
    channel: string;
    environment: 'sandbox' | 'production';
    is_enabled: boolean;
    api_base_url: string | null;
    booking_base_url: string | null;
    access_base_url: string | null;
    access_token: string | null;
    webhook_secret: string | null;
    gym_id: string | null;
    webhook_url: string | null;
    extra_config: Record<string, any>;
}

const EMPTY_WELLHUB: PlatformSettingsRow = {
    channel: 'wellhub',
    environment: 'sandbox',
    is_enabled: false,
    api_base_url: '',
    booking_base_url: '',
    access_base_url: '',
    access_token: '',
    webhook_secret: '',
    gym_id: '',
    webhook_url: '',
    extra_config: {},
};

const EMPTY_TOTALPASS: PlatformSettingsRow = {
    channel: 'totalpass',
    environment: 'sandbox',
    is_enabled: false,
    api_base_url: '',
    booking_base_url: '',
    access_base_url: '',
    access_token: '',
    webhook_secret: '',
    gym_id: '',
    webhook_url: '',
    extra_config: {},
};

export default function Plataformas() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [wellhub, setWellhub] = useState<PlatformSettingsRow>(EMPTY_WELLHUB);
    const [extraConfigText, setExtraConfigText] = useState('{}');
    const [totalpass, setTotalpass] = useState<PlatformSettingsRow>(EMPTY_TOTALPASS);
    const [tpTesting, setTpTesting] = useState(false);
    const [tpSubscribing, setTpSubscribing] = useState(false);

    const { data, isLoading } = useQuery<PlatformSettingsRow[]>({
        queryKey: ['partner-settings'],
        queryFn: async () => (await api.get('/partners/settings')).data,
    });

    useEffect(() => {
        const wh = data?.find((r) => r.channel === 'wellhub');
        if (wh) {
            setWellhub({ ...EMPTY_WELLHUB, ...wh });
            setExtraConfigText(JSON.stringify(wh.extra_config || {}, null, 2));
        }
        const tp = data?.find((r) => r.channel === 'totalpass');
        if (tp) setTotalpass({ ...EMPTY_TOTALPASS, ...tp });
    }, [data]);

    // extra_config helper for TotalPass
    const tpExtra = totalpass.extra_config || {};
    const setTpExtra = (patch: Record<string, any>) =>
        setTotalpass((t) => ({ ...t, extra_config: { ...(t.extra_config || {}), ...patch } }));

    const saveWellhub = useMutation({
        mutationFn: async () => {
            let extraConfig: Record<string, any>;
            try {
                extraConfig = JSON.parse(extraConfigText || '{}');
            } catch {
                throw new Error('El JSON de configuración extra no es válido');
            }
            return (await api.put('/partners/settings', [{ ...wellhub, extra_config: extraConfig }])).data;
        },
        onSuccess: () => {
            toast({ title: 'Guardado', description: 'Configuración de Wellhub actualizada' });
            queryClient.invalidateQueries({ queryKey: ['partner-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.details?.join?.(' · ')
                    || error?.response?.data?.error || error?.message || 'Error guardando configuración',
                variant: 'destructive',
            });
        },
    });

    const saveTotalpass = useMutation({
        mutationFn: async () => (await api.put('/partners/settings', [totalpass])).data,
        onSuccess: () => {
            toast({ title: 'Guardado', description: 'Configuración de TotalPass actualizada' });
            queryClient.invalidateQueries({ queryKey: ['partner-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.details?.join?.(' · ')
                    || error?.response?.data?.error || error?.message || 'Error guardando configuración',
                variant: 'destructive',
            });
        },
    });

    const testTotalpass = async () => {
        setTpTesting(true);
        try {
            const { data } = await api.get('/partners/totalpass/test');
            const plans = (data?.place?.plans || []).map((p: any) => `${p.name} (id ${p.id})`).join(', ');
            toast({ title: 'Conexión OK', description: `Place: ${data?.place?.name || '—'}. Planes: ${plans || '—'}` });
        } catch (error: any) {
            toast({ title: 'Falló la prueba', description: error?.response?.data?.error || error?.message, variant: 'destructive' });
        } finally {
            setTpTesting(false);
        }
    };

    const subscribeTotalpassWebhook = async () => {
        setTpSubscribing(true);
        try {
            await api.post('/partners/totalpass/webhook/subscribe');
            toast({ title: 'Webhook registrado', description: 'Se registró el webhook de check-in en TotalPass' });
        } catch (error: any) {
            toast({ title: 'Error', description: error?.response?.data?.error || error?.message, variant: 'destructive' });
        } finally {
            setTpSubscribing(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Plataformas</h2>
                <p className="text-muted-foreground">
                    Integraciones de convenios (Wellhub, TotalPass). Cada plataforma tiene sus
                    propias credenciales; el backend importa reservas, comparte cupo y confirma
                    check-ins.
                </p>
            </div>

            {/* ── Wellhub ─────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="w-5 h-5" />
                                Wellhub
                            </CardTitle>
                            <CardDescription>
                                URL única registrada en Wellhub (gateway compartido entre studios):{' '}
                                <code className="break-all">{WELLHUB_RECEIVER_URL}</code>
                            </CardDescription>
                        </div>
                        <Badge variant={wellhub.is_enabled ? 'default' : 'secondary'} className={wellhub.is_enabled ? 'bg-success' : ''}>
                            {wellhub.is_enabled ? 'Habilitado' : 'Deshabilitado'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={wellhub.is_enabled}
                            onCheckedChange={(checked) => setWellhub((w) => ({ ...w, is_enabled: checked }))}
                        />
                        <Label>Habilitar integración Wellhub</Label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Entorno</Label>
                            <Select
                                value={wellhub.environment}
                                onValueChange={(v: 'sandbox' | 'production') => setWellhub((w) => ({ ...w, environment: v }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">Sandbox</SelectItem>
                                    <SelectItem value="production">Producción</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Gym ID</Label>
                            <Input
                                value={wellhub.gym_id || ''}
                                onChange={(e) => setWellhub((w) => ({ ...w, gym_id: e.target.value }))}
                                placeholder="ID del studio en Wellhub"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Access Token</Label>
                        <Textarea
                            value={wellhub.access_token || ''}
                            onChange={(e) => setWellhub((w) => ({ ...w, access_token: e.target.value }))}
                            placeholder="Bearer token para llamar a la API de Wellhub"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Webhook Secret</Label>
                        <Input
                            value={wellhub.webhook_secret || ''}
                            onChange={(e) => setWellhub((w) => ({ ...w, webhook_secret: e.target.value }))}
                            placeholder="Secreto de firma HMAC-SHA1 que da Wellhub"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Configuración extra (JSON)</Label>
                        <Textarea
                            value={extraConfigText}
                            onChange={(e) => setExtraConfigText(e.target.value)}
                            rows={4}
                            className="font-mono text-xs"
                            placeholder='{"default_product_id": 123}'
                        />
                    </div>

                    <Button onClick={() => saveWellhub.mutate()} disabled={saveWellhub.isPending}>
                        {saveWellhub.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar Wellhub
                    </Button>
                </CardContent>
            </Card>

            {/* ── TotalPass ───────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="w-5 h-5" />
                                TotalPass
                            </CardTitle>
                            <CardDescription>
                                La <code>place_api_key</code> la genera el estudio en su panel de TotalPass
                                (Integraciones → WalletClub → Crear código). La <code>partner_api_key</code> es
                                la llave maestra de WalletClub.
                            </CardDescription>
                        </div>
                        <Badge variant={totalpass.is_enabled ? 'default' : 'secondary'} className={totalpass.is_enabled ? 'bg-success' : ''}>
                            {totalpass.is_enabled ? 'Habilitado' : 'Deshabilitado'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={totalpass.is_enabled}
                            onCheckedChange={(checked) => setTotalpass((t) => ({ ...t, is_enabled: checked }))}
                        />
                        <Label>Habilitar integración TotalPass</Label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Entorno</Label>
                            <Select
                                value={totalpass.environment}
                                onValueChange={(v: 'sandbox' | 'production') => setTotalpass((t) => ({ ...t, environment: v }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sandbox">Sandbox</SelectItem>
                                    <SelectItem value="production">Producción</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Unit ID (ID de la unidad del panel)</Label>
                            <Input
                                value={totalpass.gym_id || ''}
                                onChange={(e) => setTotalpass((t) => ({ ...t, gym_id: e.target.value }))}
                                placeholder="ej. 197529"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Place API Key (del panel del estudio)</Label>
                        <Input
                            value={tpExtra.place_api_key || ''}
                            onChange={(e) => setTpExtra({ place_api_key: e.target.value })}
                            placeholder="UUID que genera el estudio (Integraciones → WalletClub → Crear código)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Partner API Key (llave maestra WalletClub)</Label>
                        <Input
                            type="password"
                            value={tpExtra.partner_api_key || ''}
                            onChange={(e) => setTpExtra({ partner_api_key: e.target.value })}
                            placeholder="Llave secreta de WalletClub (una para todos los estudios)"
                        />
                        <p className="text-xs text-muted-foreground">
                            Llave maestra: sirve para todos los estudios. Manéjala con cuidado.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Plan ID (opcional — se deriva del place)</Label>
                            <Input
                                value={tpExtra.plan_id ?? ''}
                                onChange={(e) => setTpExtra({ plan_id: e.target.value ? Number(e.target.value) : null })}
                                placeholder="Se obtiene de getPlace() si se deja vacío"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Horas para cancelar antes del inicio</Label>
                            <Input
                                value={tpExtra.default_max_cancel_hours ?? ''}
                                onChange={(e) => setTpExtra({ default_max_cancel_hours: e.target.value ? Number(e.target.value) : null })}
                                placeholder="Default 4"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Webhook URL de check-in (este backend)</Label>
                        <Input
                            value={totalpass.webhook_url || ''}
                            onChange={(e) => setTotalpass((t) => ({ ...t, webhook_url: e.target.value }))}
                            placeholder="https://<tu-backend>/webhooks/totalpass/checkin"
                        />
                        <p className="text-xs text-muted-foreground">
                            Se registra en TotalPass con el botón "Registrar webhook check-in".
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => saveTotalpass.mutate()} disabled={saveTotalpass.isPending}>
                            {saveTotalpass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar TotalPass
                        </Button>
                        <Button variant="outline" onClick={testTotalpass} disabled={tpTesting}>
                            {tpTesting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Probar credenciales
                        </Button>
                        <Button variant="outline" onClick={subscribeTotalpassWebhook} disabled={tpSubscribing}>
                            {tpSubscribing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Registrar webhook check-in
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
        </AdminLayout>
    );
}
