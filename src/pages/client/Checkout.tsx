import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api, { getErrorMessage } from '@/lib/api';
import { STUDIO, STUDIO_PLANS, FOUNDING_50, formatMxn } from '@/lib/studio';
import type { OrderPaymentMethod, CreateOrderRequest, Order, BankInfo } from '@/types/order';
import { CreditCard, Building2, Banknote, ChevronRight, ArrowRight, CheckCircle2, ArrowLeft, Copy, Check } from '@/components/brand/icons';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  class_limit: number | null;
  description: string | null;
  is_active: boolean;
  is_unlimited: boolean;
  sort_order?: number;
}
type PaymentAvailability = { bank_transfer: boolean; cash: boolean; card: boolean };
const methodOptions = [
  { value: 'bank_transfer', label: 'Transferencia bancaria', icon: Building2, description: 'Sube tu comprobante. El studio valida el pago y activa tu plan.' },
  { value: 'cash', label: 'Pago en el studio', icon: Banknote, description: 'Genera tu orden y presenta su número al pagar en recepción.' },
  { value: 'card', label: 'Tarjeta de crédito o débito', icon: CreditCard, description: 'Completa tu pago en la página segura del proveedor.' },
] as const;
const planSummary = (plan: Plan) => `${plan.is_unlimited || plan.class_limit == null ? 'Clases ilimitadas' : `${plan.class_limit} clases`} · ${plan.duration_days} días`;

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(searchParams.get('plan'));
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<OrderPaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [step, setStep] = useState<'plan' | 'payment' | 'confirm'>('plan');

  const plansQuery = useQuery<Plan[]>({
    queryKey: ['plans-active'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data.filter((plan: Plan) => plan.is_active)
        .sort((a: Plan, b: Plan) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  });
  const methodsQuery = useQuery<PaymentAvailability>({
    queryKey: ['payment-methods'],
    queryFn: async () => (await api.get('/settings/payment-methods')).data,
  });
  const bankQuery = useQuery<BankInfo>({
    queryKey: ['bank-info'],
    queryFn: async () => (await api.get('/settings/bank-info')).data,
    enabled: selectedPaymentMethod === 'bank_transfer' && methodsQuery.data?.bank_transfer === true,
  });
  const selectedPlan = plansQuery.data?.find((plan) => plan.id === selectedPlanId);
  const methods = methodOptions.filter((method) => methodsQuery.data?.[method.value]);
  const methodAvailable = methods.some((method) => method.value === selectedPaymentMethod);
  const bankInfo = bankQuery.data;
  const bankReady = Boolean(bankInfo?.bank_name && bankInfo?.account_holder && bankInfo?.clabe);

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderRequest) => (await api.post('/orders', data)).data as Order,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (selectedPaymentMethod === 'card' && order.mp_checkout_url) {
        window.location.href = order.mp_checkout_url;
        return;
      }
      toast({ title: 'Orden creada', description: 'Completa el pago para que el studio pueda activar tu plan.' });
      navigate(`/app/orders/${order.id}`);
    },
    onError: (error) => toast({ title: 'No pudimos crear tu orden', description: getErrorMessage(error), variant: 'destructive' }),
  });
  const selectPlan = (id: string) => {
    setSelectedPlanId(id);
    if (!methodAvailable && methods.length) setSelectedPaymentMethod(methods[0].value);
    setStep('payment');
  };
  const copy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Selecciona el dato y cópialo manualmente.' });
    }
  };
  const confirm = () => {
    if (!selectedPlan || !methodAvailable || (selectedPaymentMethod === 'bank_transfer' && !bankReady)) return;
    createOrder.mutate({ plan_id: selectedPlan.id, payment_method: selectedPaymentMethod, notes: notes.trim() || undefined });
  };

  return (
    <AuthGuard requiredRoles={['client']}>
      <ClientLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full" aria-label="Volver" onClick={() => {
              if (step === 'confirm') setStep('payment');
              else if (step === 'payment') setStep('plan');
              else navigate('/app');
            }}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-3xl text-altitud-dark">{step === 'plan' ? 'Elige tu ritmo.' : step === 'payment' ? 'Tu forma de pago.' : 'Revisa tu orden.'}</h1>
              <p className="mt-2 text-muted-foreground">{step === 'plan' ? 'Paquetes y membresías para seguir avanzando en Altitud.' : step === 'payment' ? 'Tu plan se activa después de validar el pago.' : 'Confirma el paquete y completa tu pago en el siguiente paso.'}</p>
            </div>
          </div>
          <nav aria-label="Pasos de compra" className="flex flex-wrap items-center gap-2 text-sm">
            {(['plan', 'payment', 'confirm'] as const).map((value, index) => (
              <span key={value} className="inline-flex items-center gap-2">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Badge variant={step === value ? 'default' : 'outline'} className={step === value ? 'rounded-full bg-altitud-olive text-altitud-cream' : 'rounded-full'} aria-current={step === value ? 'step' : undefined}>{index + 1}. {['Plan', 'Pago', 'Confirmar'][index]}</Badge>
              </span>
            ))}
          </nav>

          {step === 'plan' && <>
            <section aria-label="Paquetes disponibles">
              {plansQuery.isLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : plansQuery.isError ? (
                <div className="space-y-3 py-8" role="alert"><p>No pudimos cargar los paquetes disponibles.</p><Button variant="outline" onClick={() => void plansQuery.refetch()}>Volver a intentar</Button></div>
              ) : plansQuery.data?.length ? (
                <div className="divide-y divide-altitud-sand/60 border-y border-altitud-sand/60">
                  {plansQuery.data.map((plan) => <button key={plan.id} type="button" className="flex w-full flex-wrap items-center justify-between gap-4 px-3 py-6 text-left transition-colors hover:bg-altitud-sand/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-altitud-olive" onClick={() => selectPlan(plan.id)}>
                    <div><h2 className="text-2xl">{plan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{planSummary(plan)}</p>{plan.description && <p className="mt-2 max-w-lg text-sm text-muted-foreground">{plan.description}</p>}</div>
                    <span className="flex items-center gap-6"><strong className="whitespace-nowrap text-2xl font-normal text-altitud-olive">{formatMxn(Number(plan.price))}<small className="ml-1 text-xs">MXN</small></strong><ArrowRight className="h-5 w-5" aria-hidden="true" /></span>
                  </button>)}
                </div>
              ) : <p className="py-8">Los paquetes se habilitarán aquí cuando estén disponibles. <a href={STUDIO.whatsappHref} target="_blank" rel="noreferrer" className="underline">Consulta con el studio</a>.</p>}
              <p className="mt-4 text-sm text-muted-foreground">Los paquetes de 4, 8 y 12 clases y Unlimited tienen vigencia de 30 días. Las clases no utilizadas no son acumulables ni transferibles, salvo excepción autorizada por Altitud.</p>
            </section>
            <section className="space-y-4 py-3" aria-labelledby="first-session-heading">
              <h2 id="first-session-heading" className="text-2xl">Conoce el studio.</h2>
              <dl className="divide-y divide-altitud-sand/50">
                {STUDIO_PLANS.filter((plan) => plan.validityDays == null).map((plan) => <div key={plan.id} className="flex items-center justify-between gap-4 py-3"><dt>{plan.name}</dt><dd className="shrink-0">{formatMxn(plan.price)} MXN</dd></div>)}
              </dl>
              <p className="text-sm text-muted-foreground">Para clase prueba, clase suelta y primera vez de 5 clases, confirma la vigencia y la compra con el studio.</p>
              <Button variant="outline" asChild><a href={STUDIO.whatsappHref} target="_blank" rel="noreferrer">Consultar por WhatsApp <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            </section>
            <section className="space-y-4 rounded-2xl bg-altitud-sand/25 p-6" aria-labelledby="founding-heading">
              <p className="text-xs uppercase tracking-widest">PROMOCIÓN DE LANZAMIENTO</p>
              <h2 id="founding-heading" className="text-3xl">Founding 50</h2>
              <p className="text-xl">Unlimited · {formatMxn(FOUNDING_50.price)} MXN al mes</p>
              <p className="max-w-2xl text-sm">Precio congelado durante 6 meses desde la activación. Exclusivo para las primeras 50 personas que realicen su primer pago y mantengan la membresía activa con pagos consecutivos.</p>
              <details className="text-sm"><summary className="cursor-pointer py-2 font-semibold">Ver beneficios y requisitos</summary><h3 className="mt-4 font-semibold">Beneficios</h3><ul className="mt-2 list-disc space-y-2 pl-5">{FOUNDING_50.benefits.map((item) => <li key={item}>{item}</li>)}</ul><h3 className="mt-5 font-semibold">Requisitos</h3><ul className="mt-2 list-disc space-y-2 pl-5">{FOUNDING_50.requirements.map((item) => <li key={item}>{item}</li>)}</ul></details>
              <Button asChild className="rounded-full bg-altitud-olive text-altitud-cream hover:bg-altitud-olive/90"><a href={FOUNDING_50.whatsappHref} target="_blank" rel="noreferrer">Consultar disponibilidad <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <p className="text-xs text-muted-foreground">El studio confirma la disponibilidad y el proceso para asegurar tu lugar.</p>
            </section>
          </>}

          {step !== 'plan' && selectedPlan && <>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-altitud-sand/20 p-5"><div><h2 className="text-xl">{selectedPlan.name}</h2><p className="mt-1 text-sm text-muted-foreground">{planSummary(selectedPlan)}</p></div><strong className="text-2xl font-normal">{formatMxn(Number(selectedPlan.price))} MXN</strong></div>
            {step === 'payment' && <Card className="rounded-2xl border-altitud-sand/60">
              <CardHeader><CardTitle className="text-xl">Selecciona cómo pagar</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {methodsQuery.isLoading ? <Skeleton className="h-36 w-full" /> : methodsQuery.isError ? <div role="alert" className="space-y-3"><p>No pudimos consultar las formas de pago.</p><Button variant="outline" onClick={() => void methodsQuery.refetch()}>Volver a intentar</Button></div> : methods.length ? (
                  <RadioGroup value={selectedPaymentMethod} onValueChange={(value) => setSelectedPaymentMethod(value as OrderPaymentMethod)} className="space-y-3">
                    {methods.map((method) => <Label key={method.value} htmlFor={method.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selectedPaymentMethod === method.value ? 'border-altitud-olive bg-altitud-olive/5' : 'border-altitud-sand/60'}`}><RadioGroupItem value={method.value} id={method.value} className="mt-1" /><span><span className="flex items-center gap-2 font-semibold"><method.icon className="h-5 w-5 text-altitud-olive" />{method.label}</span><span className="mt-2 block text-sm font-normal leading-relaxed text-muted-foreground">{method.description}</span></span></Label>)}
                  </RadioGroup>
                ) : <p>Consulta las formas de pago disponibles con el studio por <a className="underline" href={STUDIO.whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>.</p>}
                {methodsQuery.data && !methodsQuery.data.card && <p className="text-sm text-muted-foreground">El pago con tarjeta en línea estará disponible próximamente.</p>}
              </CardContent>
              <CardFooter><Button className="w-full rounded-full bg-altitud-olive text-altitud-cream hover:bg-altitud-olive/90" disabled={!methodAvailable} onClick={() => setStep('confirm')}>Continuar <ChevronRight className="ml-2 h-4 w-4" /></Button></CardFooter>
            </Card>}
            {step === 'confirm' && <Card className="rounded-2xl border-altitud-sand/60">
              <CardHeader><CardTitle className="text-xl">Antes de confirmar</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>Método de pago</span><strong>{methodOptions.find((method) => method.value === selectedPaymentMethod)?.label}</strong></div>
                <Separator />
                <p className="text-sm leading-relaxed">Cancela o reagenda con al menos 4 horas de anticipación. Las cancelaciones tardías y las inasistencias cuentan como clase utilizada y no se recuperan.</p>
                <div className="space-y-2"><Label htmlFor="notes">Comentario para el studio (opcional)</Label><Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="¿Algo que debamos saber sobre tu compra?" rows={2} maxLength={500} /></div>
                {selectedPaymentMethod === 'bank_transfer' && <section className="space-y-3 rounded-xl bg-altitud-sand/20 p-4"><h3 className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Datos de transferencia</h3>
                  {bankQuery.isLoading ? <Skeleton className="h-36 w-full" /> : bankReady && bankInfo ? <>
                    <dl className="divide-y divide-altitud-sand/60">{([
                      ['Banco', bankInfo.bank_name], ['Titular', bankInfo.account_holder], ['Número de cuenta', bankInfo.account_number], ['CLABE', bankInfo.clabe],
                    ] as const).filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex items-center justify-between gap-2 py-3"><div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-all text-sm font-medium">{value}</dd></div><Button variant="ghost" size="icon" aria-label={`Copiar ${label}`} className="shrink-0" onClick={() => void copy(value, label)}>{copiedField === label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button></div>)}</dl>
                    <p className="text-sm">Confirma la orden, realiza la transferencia y sube tu comprobante. Tu plan se activará cuando el studio valide el pago.</p>
                  </> : <div role="alert" className="space-y-2"><p className="text-sm">No pudimos cargar los datos bancarios. Reintenta antes de transferir.</p><Button variant="outline" onClick={() => void bankQuery.refetch()}>Cargar datos bancarios</Button></div>}
                </section>}
                {selectedPaymentMethod === 'cash' && <p className="rounded-xl bg-altitud-sand/20 p-4 text-sm">Tu orden queda pendiente hasta que pagues en el studio y el staff valide el pago. Presenta tu número de orden en recepción.</p>}
                <div className="flex items-center justify-between gap-4 border-t border-altitud-sand/60 pt-4"><span>Total</span><strong className="text-2xl font-normal text-altitud-olive">{formatMxn(Number(selectedPlan.price))} MXN</strong></div>
              </CardContent>
              <CardFooter className="flex-col gap-3"><Button className="w-full rounded-full bg-altitud-olive text-altitud-cream hover:bg-altitud-olive/90" onClick={confirm} disabled={createOrder.isPending || !methodAvailable || (selectedPaymentMethod === 'bank_transfer' && !bankReady)}>{createOrder.isPending ? 'Creando orden…' : <><CheckCircle2 className="mr-2 h-4 w-4" />Confirmar orden</>}</Button><p className="text-center text-xs text-muted-foreground">Al confirmar, aceptas las <Link to="/terms" className="underline">políticas y condiciones de Altitud</Link>.</p></CardFooter>
            </Card>}
          </>}
        </div>
      </ClientLayout>
    </AuthGuard>
  );
}
