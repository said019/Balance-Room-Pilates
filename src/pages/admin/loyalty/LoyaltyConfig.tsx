import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Gift, Star } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import api from '@/lib/api';

interface LoyaltyConfig {
    points_per_class: number;
    points_per_peso: number;
    points_per_peso_cash: number;
    enabled: boolean;
    welcome_bonus: number;
    birthday_bonus: number;
    anniversary_bonus: number;
    referral_bonus: number;
    streak_bonus: number;
}

export default function LoyaltyConfig() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<LoyaltyConfig>({
        points_per_class: 2,
        points_per_peso: 1,
        points_per_peso_cash: 2,
        enabled: true,
        welcome_bonus: 10,
        birthday_bonus: 100,
        anniversary_bonus: 40,
        referral_bonus: 40,
        streak_bonus: 10,
    });
    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const response = await api.get('/loyalty/config');
            if (response.data) {
                setConfig(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/loyalty/config', config);
            toast({
                title: 'Configuración guardada',
                description: 'La configuración de lealtad se ha guardado correctamente.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la configuración.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Configuración de Lealtad</h1>
                    <p className="text-muted-foreground">
                        Configura cómo los clientes ganan puntos.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Estado del Programa
                        </CardTitle>
                        <CardDescription>
                            Activa o desactiva el programa de lealtad
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Programa de Lealtad Activo</Label>
                                <p className="text-sm text-muted-foreground">
                                    Los clientes pueden ganar y canjear puntos
                                </p>
                            </div>
                            <Switch
                                checked={config.enabled}
                                onCheckedChange={(checked) => setConfig({
                                    ...config,
                                    enabled: checked
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Puntos por Actividad</CardTitle>
                        <CardDescription>
                            Define cuántos puntos ganan los clientes por sus acciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="points_per_class">Puntos por asistir a clase</Label>
                                <Input
                                    id="points_per_class"
                                    type="number"
                                    min={0}
                                    value={config.points_per_class}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        points_per_class: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Por cada check-in confirmado
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points_per_peso">Puntos por $1 con tarjeta</Label>
                                <Input
                                    id="points_per_peso"
                                    type="number"
                                    min={0}
                                    value={config.points_per_peso}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        points_per_peso: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tarjeta o transferencia
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points_per_peso_cash">Puntos por $1 en efectivo</Label>
                                <Input
                                    id="points_per_peso_cash"
                                    type="number"
                                    min={0}
                                    value={config.points_per_peso_cash}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        points_per_peso_cash: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Bonus 2× por pago en efectivo
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-balance-olive/20 bg-balance-olive/5 p-4 text-sm">
                            <p className="font-semibold text-balance-olive mb-1">Puntos fijos por paquete</p>
                            <p className="text-muted-foreground">
                                Drop-in: <span className="font-mono font-medium">0 pts</span> ·
                                4 clases: <span className="font-mono font-medium">30 pts</span> ·
                                8 clases: <span className="font-mono font-medium">60 pts</span> ·
                                12 clases: <span className="font-mono font-medium">100 pts</span> ·
                                24 clases: <span className="font-mono font-medium">160 pts</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Bonos Especiales
                        </CardTitle>
                        <CardDescription>
                            Puntos adicionales por eventos especiales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="welcome_bonus">Bono de Bienvenida</Label>
                                <Input
                                    id="welcome_bonus"
                                    type="number"
                                    min={0}
                                    value={config.welcome_bonus}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        welcome_bonus: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Al registrarse como cliente
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birthday_bonus">Bono de Cumpleaños</Label>
                                <Input
                                    id="birthday_bonus"
                                    type="number"
                                    min={0}
                                    value={config.birthday_bonus}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        birthday_bonus: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Cron diario · requiere membresía activa
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="anniversary_bonus">Bono de Aniversario</Label>
                                <Input
                                    id="anniversary_bonus"
                                    type="number"
                                    min={0}
                                    value={config.anniversary_bonus}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        anniversary_bonus: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    1 año desde el registro
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="referral_bonus">Bono por Referido</Label>
                                <Input
                                    id="referral_bonus"
                                    type="number"
                                    min={0}
                                    value={config.referral_bonus}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        referral_bonus: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Cuando su referido completa una compra
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="streak_bonus">Bono por Racha</Label>
                                <Input
                                    id="streak_bonus"
                                    type="number"
                                    min={0}
                                    value={config.streak_bonus}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        streak_bonus: parseInt(e.target.value) || 0
                                    })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Cada 2 semanas consecutivas asistiendo
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
