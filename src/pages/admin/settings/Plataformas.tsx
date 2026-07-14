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

const API_BASE_URL = String(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const WELLHUB_RECEIVER_URL = `${API_BASE_URL.replace(/\/api$/, '')}/webhooks/wellhub`;

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

export default function Plataformas() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [wellhub, setWellhub] = useState<PlatformSettingsRow>(EMPTY_WELLHUB);
    const [extraConfigText, setExtraConfigText] = useState('{}');

    const { data, isLoading } = useQuery<PlatformSettingsRow[]>({
        queryKey: ['partner-settings'],
        queryFn: async () => (await api.get('/partners/settings')).data,
    });

    useEffect(() => {
        const row = data?.find((r) => r.channel === 'wellhub');
        if (row) {
            setWellhub({ ...EMPTY_WELLHUB, ...row });
            setExtraConfigText(JSON.stringify(row.extra_config || {}, null, 2));
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            let extraConfig: Record<string, any>;
            try {
                extraConfig = JSON.parse(extraConfigText || '{}');
            } catch {
                throw new Error('El JSON de configuración extra no es válido');
            }
            const response = await api.put('/partners/settings', [{ ...wellhub, extra_config: extraConfig }]);
            return response.data;
        },
        onSuccess: () => {
            toast({ title: 'Guardado', description: 'Configuración de Wellhub actualizada' });
            queryClient.invalidateQueries({ queryKey: ['partner-settings'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.details?.join?.(' · ')
                    || error?.response?.data?.error
                    || error?.message
                    || 'Error guardando configuración',
                variant: 'destructive',
            });
        },
    });

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
                    Credenciales propias de Balance Room. Essenza únicamente reenvía los bytes
                    del webhook; este backend valida la firma con el secreto de Balance Room.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="w-5 h-5" />
                                Wellhub
                            </CardTitle>
                            <CardDescription>
                                Receptor que se configura en el router de Essenza:{' '}
                                <code className="break-all">{WELLHUB_RECEIVER_URL}</code>
                            </CardDescription>
                        </div>
                        <Badge variant={wellhub.is_enabled ? 'default' : 'secondary'} className={wellhub.is_enabled ? 'bg-success' : ''}>
                            {wellhub.is_enabled ? 'Habilitado' : 'Deshabilitado'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                        Antes de agregar Balance Room a <code>WELLHUB_ROUTES</code>, haz un check-in
                        real y confirma en los logs de Essenza que llega el Gym ID de Balance Room.
                        No registres esta URL directamente en Wellhub mientras se use el router.
                    </div>
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
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
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
                        <p className="text-xs text-muted-foreground">
                            Si se deja vacío, la firma NO se verifica (solo el filtro por Gym ID) — no dejar vacío en producción.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>API Base URL (opcional)</Label>
                            <Input
                                value={wellhub.api_base_url || ''}
                                onChange={(e) => setWellhub((w) => ({ ...w, api_base_url: e.target.value }))}
                                placeholder="Default según entorno"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Booking Base URL (opcional)</Label>
                            <Input
                                value={wellhub.booking_base_url || ''}
                                onChange={(e) => setWellhub((w) => ({ ...w, booking_base_url: e.target.value }))}
                                placeholder="Default según entorno"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Access Base URL (opcional)</Label>
                            <Input
                                value={wellhub.access_base_url || ''}
                                onChange={(e) => setWellhub((w) => ({ ...w, access_base_url: e.target.value }))}
                                placeholder="Default según entorno"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Configuración extra (JSON)</Label>
                        <Textarea
                            value={extraConfigText}
                            onChange={(e) => setExtraConfigText(e.target.value)}
                            rows={4}
                            className="font-mono text-xs"
                            placeholder='{"default_product_id": 123, "events_report_url": "..."}'
                        />
                        <p className="text-xs text-muted-foreground">
                            Campos usados: <code>default_product_id</code> (publicar clases),{' '}
                            <code>events_report_url</code> / <code>daily_report_url</code> (reporte diario).
                        </p>
                    </div>

                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Guardar
                    </Button>
                </CardContent>
            </Card>
        </div>
        </AdminLayout>
    );
}
