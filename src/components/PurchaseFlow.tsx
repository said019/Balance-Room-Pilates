import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, CreditCard, Building2, AlertCircle, Star, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import {
  getClassesLabel,
  getPackagePresentation,
  getPackageType,
  packageOrder,
  packagePresentations,
} from '@/lib/planPresentation';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  class_limit: number | null;
  features: string[];
  is_active: boolean;
  sort_order: number;
  category?: string | null;
  package_type?: 'individual' | 'mixto' | 'sample';
  requires_studio_selection?: boolean;
  promo_price?: number | null;
  promo_label?: string | null;
  promo_active_until?: string | null;
}

type PaymentMethod = 'card' | 'transfer';
type Step = 'select-plan' | 'payment-method' | 'processing';

function getPromo(plan: Plan): { active: boolean; effectivePrice: number } {
  const price = Number(plan.price);
  const active =
    plan.promo_price != null &&
    Number(plan.promo_price) < price &&
    (!plan.promo_active_until || new Date(plan.promo_active_until) > new Date());
  return { active, effectivePrice: active ? Number(plan.promo_price) : price };
}

export function PurchaseFlow() {
  const [step, setStep] = useState<Step>('select-plan');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch planes disponibles
  const { data: plans = [], isLoading: loadingPlans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await api.get('/plans');
      return response.data.filter((p: Plan) => p.is_active);
    },
  });

  // Mutation para crear membresía
  const createMembershipMutation = useMutation({
    mutationFn: async ({ planId, paymentMethod }: { planId: string; paymentMethod: PaymentMethod }) => {
      const response = await api.post('/memberships', { planId, paymentMethod });
      return response.data;
    },
    onSuccess: async (data, variables) => {
      if (variables.paymentMethod === 'card') {
        // Simular procesamiento de tarjeta (2 segundos) y auto-activar
        setTimeout(async () => {
          try {
            await api.post(
              `/memberships/complete-payment/${data.membershipId}`,
              { reference: `CARD-${Date.now()}` }
            );

            queryClient.invalidateQueries({ queryKey: ['membership'] });
            setIsProcessing(false);

            toast({
              title: '¡Pago exitoso! ✓',
              description: 'Tus créditos han sido activados. Redirigiendo al calendario...',
            });

            setTimeout(() => {
              navigate('/');
            }, 1500);
          } catch (error) {
            setIsProcessing(false);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Error al activar membresía',
            });
          }
        }, 2000);
      } else {
        // Transferencia - mostrar mensaje de espera
        setIsProcessing(false);
        setStep('processing');
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      const message = error.response?.data?.error || 'Error al procesar compra';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    },
  });

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('payment-method');
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);

    if (paymentMethod === 'card') {
      toast({
        title: 'Procesando pago...',
        description: 'Por favor espera mientras procesamos tu tarjeta.',
      });
    }

    await createMembershipMutation.mutateAsync({
      planId: selectedPlan.id,
      paymentMethod,
    });
  };

  const visiblePlans = [...plans].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const groupedPlans = packageOrder
    .map((type) => ({
      ...packagePresentations[type],
      plans: visiblePlans.filter((plan) => getPackageType(plan) === type),
    }))
    .filter((group) => group.plans.length > 0);

  // Paso 1: Selección de Plan
  if (step === 'select-plan') {
    return (
      <div className="space-y-7 pb-28 lg:pb-4">
        <div className="rounded-[2rem] bg-balance-cream/60 p-5 ring-1 ring-balance-sand/60 sm:p-7">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
            paquetes claros
          </span>
          <h2 className="mt-3 text-3xl font-heading font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
            Elige cómo quieres moverte
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground font-body sm:text-base">
            Individual es para enfocarte en una sala. Mixto es para moverte entre Wunda, Barre y Hot Room con libertad.
          </p>
        </div>

        {loadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {groupedPlans.map((group) => (
              <section key={group.type} className={`overflow-hidden rounded-[2rem] p-3 ring-1 ${group.panel}`}>
                <div className="rounded-[1.55rem] bg-balance-dark/[0.035] p-4 sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${group.chip}`}>
                        {group.eyebrow}
                      </span>
                      <h3 className="mt-3 text-2xl font-heading font-bold tracking-[-0.04em]">
                        {group.title}
                      </h3>
                      <p className={`mt-1 text-sm leading-relaxed ${group.text}`}>
                        {group.detail}
                      </p>
                    </div>
                    <span className={`mt-1 hidden h-3 w-3 shrink-0 rounded-full sm:block ${group.dot}`} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.plans.map((plan) => {
                      const presentation = getPackagePresentation(plan);
                      const { active: promoActive, effectivePrice } = getPromo(plan);
                      const pricePerClass = plan.class_limit ? (effectivePrice / plan.class_limit).toFixed(0) : null;
                      const planPointsMap: Record<number, number> = { 4: 30, 8: 60, 12: 100, 24: 160 };
                      const bonusPoints = plan.class_limit ? planPointsMap[plan.class_limit] ?? null : null;

                      return (
                        <button
                          key={plan.id}
                          type="button"
                          className={`group relative w-full overflow-hidden rounded-[1.55rem] p-5 text-left ring-1 transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-[0.99] ${presentation.card}`}
                          onClick={() => handlePlanSelect(plan)}
                        >
                          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-current/25 to-transparent" />
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${presentation.badge}`}>
                                {presentation.accentLabel}
                              </span>
                              <h4 className="mt-3 text-2xl font-heading font-bold leading-tight tracking-[-0.045em] text-current">
                                {plan.name}
                              </h4>
                              {plan.description && (
                                <p className={`mt-2 text-sm leading-relaxed font-body ${presentation.text}`}>
                                  {plan.description}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              {promoActive && (
                                <p className="text-sm font-heading font-medium tracking-[-0.04em] text-current/55 line-through">
                                  ${plan.price.toLocaleString('es-MX')}
                                </p>
                              )}
                              <p className="text-3xl font-heading font-bold tracking-[-0.06em] text-current">
                                ${effectivePrice.toLocaleString('es-MX')}
                              </p>
                              {promoActive && plan.promo_label && (
                                <span className="mt-1 inline-flex rounded-full bg-balance-olive px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-balance-cream">
                                  {plan.promo_label}
                                </span>
                              )}
                              <p className={`mt-1 text-xs font-semibold ${presentation.text}`}>
                                {plan.duration_days} días
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-balance-cream/70 px-3 py-1.5 text-sm font-semibold ring-1 ring-balance-dark/8">
                              <Star className="h-4 w-4" />
                              {getClassesLabel(plan.class_limit, 0)}
                            </span>
                            {pricePerClass && (
                              <span className="rounded-full bg-balance-cream/70 px-3 py-1.5 text-xs font-semibold ring-1 ring-balance-dark/8">
                                ${pricePerClass} por clase
                              </span>
                            )}
                            {bonusPoints && (
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${presentation.badge}`}>
                                <Star className="h-3.5 w-3.5 fill-current" />
                                +{bonusPoints} pts
                              </span>
                            )}
                          </div>

                          {plan.features?.length > 0 && (
                            <ul className="mt-4 space-y-2">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <span className="font-body">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold ${presentation.cta}`}>
                            Seleccionar {presentation.shortTitle.toLowerCase()}
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Paso 2: Método de Pago
  if (step === 'payment-method') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => setStep('select-plan')}
          className="mb-4"
        >
          ← Volver a planes
        </Button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
            Método de pago
          </h2>
          <p className="text-muted-foreground font-body">
            Selecciona cómo deseas pagar tu membresía
          </p>
        </div>

        {/* Plan seleccionado */}
        {selectedPlan && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground font-body">
                    {selectedPlan.class_limit 
                      ? `${selectedPlan.class_limit} clases`
                      : 'Clases ilimitadas'
                    }
                  </p>
                </div>
                <div className="text-right">
                  {getPromo(selectedPlan).active && (
                    <p className="text-sm font-heading font-medium text-muted-foreground line-through">
                      ${selectedPlan.price.toLocaleString()}
                    </p>
                  )}
                  <p className="text-2xl font-heading font-bold">
                    ${getPromo(selectedPlan).effectivePrice.toLocaleString()}
                  </p>
                  {getPromo(selectedPlan).active && selectedPlan.promo_label && (
                    <span className="mt-1 inline-flex rounded-full bg-balance-olive px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-balance-cream">
                      {selectedPlan.promo_label}
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">MXN</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métodos de pago */}
        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <Card className={`cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <RadioGroupItem value="card" id="card" />
                <div className="flex-1">
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-heading font-semibold">Tarjeta de Crédito/Débito</span>
                  </Label>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Pago instantáneo. Tus créditos se activan inmediatamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-primary' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <RadioGroupItem value="transfer" id="transfer" />
                <div className="flex-1">
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="w-5 h-5" />
                    <span className="font-heading font-semibold">Transferencia Bancaria</span>
                  </Label>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Verificación manual. Créditos activados en 1-2 horas hábiles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </RadioGroup>

        {/* Datos bancarios para transferencia */}
        {paymentMethod === 'transfer' && (
          <Alert className="bg-info/10 border-info/30">
            <Building2 className="h-4 w-4 text-info" />
            <AlertDescription className="text-foreground space-y-2">
              <p className="font-semibold font-heading">Datos bancarios:</p>
              <div className="space-y-1 text-sm font-body">
                <p><strong>Banco:</strong> BBVA</p>
                <p><strong>CLABE:</strong> 012 180 0123 4567 8901</p>
                <p><strong>Titular:</strong> Balance Room Pilates</p>
                <p><strong>Concepto:</strong> Membresía {selectedPlan?.name}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handlePaymentSubmit}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : paymentMethod === 'card' ? (
            'Pagar Ahora'
          ) : (
            'Ya realicé el pago'
          )}
        </Button>
      </div>
    );
  }

  // Paso 3: Procesamiento (solo para transferencia)
  if (step === 'processing' && paymentMethod === 'transfer') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-warning" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold">Pago en revisión</h2>
          <p className="text-muted-foreground font-body">
            Tu pago está en proceso de verificación
          </p>
        </div>

        <Alert className="text-left">
          <AlertDescription className="font-body">
            <p className="font-semibold mb-2">¿Qué sigue?</p>
            <ul className="space-y-1 text-sm">
              <li>• Nuestro equipo verificará tu transferencia</li>
              <li>• Tus créditos se activarán en 1-2 horas hábiles</li>
              <li>• Recibirás una confirmación por email</li>
              <li>• Podrás reservar clases una vez activados los créditos</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Volver al inicio
          </Button>
          <Button
            onClick={() => navigate('/app/my-bookings')}
            className="flex-1"
          >
            Ver mis reservas
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
