import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export function CardPaymentStatus({ orderId, providerStatus, onRefresh, onReview }: { orderId: string; providerStatus?: string | null; onRefresh: () => void; onReview?: () => void }) {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;
  const check = async () => {
    setChecking(true);
    try {
      const { data } = await api.post(`/orders/${orderId}/sync-card-payment`);
      if (data.status === 'manual_review') onReview?.();
      setMessage(data.approved ? 'Pago confirmado. Estamos actualizando tu paquete.' : data.status === 'manual_review' ? 'Tu pago requiere revisión del studio. No vuelvas a pagar; contáctanos con tu número de orden.' : 'Consultamos tu pago. Si ya pagaste y sigue pendiente, espera un momento y vuelve a verificar antes de intentar otro pago.');
      refresh.current();
    } catch {
      setMessage('No pudimos consultar Mercado Pago. Tu orden sigue guardada. Si ya pagaste, no repitas el pago; vuelve a verificar en un momento.');
    } finally { setChecking(false); }
  };
  useEffect(() => { void check(); }, [orderId]);
  const rejected = providerStatus === 'rejected' || providerStatus === 'cancelled';
  return <section className="space-y-3 rounded-xl border border-altitud-sand p-4" aria-label="Estado del pago con tarjeta">
    <h2 className="font-semibold">{rejected ? 'El pago no fue aprobado' : 'Confirmación de Mercado Pago'}</h2>
    {rejected && <p className="text-sm">Puedes volver a intentar desde esta misma orden con otra tarjeta. Tu paquete se activa cuando Mercado Pago confirma el pago.</p>}
    <p role="status" className="text-sm leading-relaxed">{checking ? 'Consultando el estado de tu pago…' : message}</p>
    <Button variant="outline" disabled={checking} onClick={() => void check()}>{checking ? 'Verificando…' : 'Verificar mi pago'}</Button>
  </section>;
}
