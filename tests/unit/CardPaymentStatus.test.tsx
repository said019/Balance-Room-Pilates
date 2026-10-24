import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CardPaymentStatus } from '@/components/payments/CardPaymentStatus';
import api from '@/lib/api';
jest.mock('@/lib/api', () => ({ __esModule: true, default: { post: jest.fn() } }));
test('recovers provider-confirmed approval and refreshes the order', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: { approved: true } });
  const refresh = jest.fn();
  render(<CardPaymentStatus orderId="order" onRefresh={refresh} />);
  expect(await screen.findByText(/Pago confirmado/)).toBeVisible();
  expect(api.post).toHaveBeenCalledWith('/orders/order/sync-card-payment');
  expect(refresh).toHaveBeenCalledTimes(1);
});
test('explains rejection and allows verification to be retried after an outage', async () => {
  (api.post as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ data: { status: 'pending' } });
  render(<CardPaymentStatus orderId="order" providerStatus="rejected" onRefresh={() => {}} />);
  expect(screen.getByText('El pago no fue aprobado')).toBeVisible();
  expect(await screen.findByText(/Tu orden sigue guardada/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Verificar mi pago' }));
  await waitFor(() => expect(screen.getByText(/Consultamos tu pago/)).toBeVisible());
});
test('manual review explicitly prevents another payment attempt', async () => {
  (api.post as jest.Mock).mockResolvedValue({ data: { status: 'manual_review' } });
  render(<CardPaymentStatus orderId="order" onRefresh={() => {}} />);
  expect(await screen.findByText(/No vuelvas a pagar/)).toBeVisible();
});
