import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import Checkout from '@/pages/client/Checkout';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() }, getErrorMessage: (e: any) => e.message }));
jest.mock('@/components/layout/AuthGuard', () => ({ AuthGuard: ({ children }: any) => children }));
jest.mock('@/components/layout/ClientLayout', () => ({ ClientLayout: ({ children }: any) => children }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/hooks/use-cancellation-policy', () => ({ CancellationTerms: () => <span>Plazo de 12 horas.</span> }));

const plan = { id: 'plan-fixture', name: 'BASE', price: 649, duration_days: 30, class_limit: 4, is_active: true };
type Methods = { bank_transfer: boolean; cash: boolean; card: boolean };
function serve(methods: Methods | (() => Promise<Methods>)) {
  (api.get as jest.Mock).mockImplementation(async (path: string) => {
    if (path === '/plans') return { data: [plan] };
    if (path === '/settings/payment-methods') return { data: typeof methods === 'function' ? await methods() : methods };
    if (path === '/purchase-consent/public') return { data: { version: 1, title: 'Declaración vigente', body: 'Declaro.' } };
    return { data: null };
  });
}
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter><Checkout /></MemoryRouter></QueryClientProvider>);
}
const requested = (path: string) => (api.get as jest.Mock).mock.calls.some(([p]) => p === path);
afterEach(() => { cleanup(); jest.clearAllMocks(); });

it('without bank details it does not offer transfer and continues with the studio payment', async () => {
  serve({ bank_transfer: false, cash: true, card: false });
  mount();
  await userEvent.click(await screen.findByRole('button', { name: /BASE/ }));
  expect(await screen.findByLabelText(/Pago en el studio/)).toBeChecked();
  expect(screen.queryByLabelText(/Transferencia bancaria/)).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('Pago en el studio', { selector: 'strong' })).toBeVisible();
  expect(screen.queryByText(/Datos de transferencia/)).toBeNull();
  expect(requested('/settings/bank-info')).toBe(false);
});

it('picking a plan before the methods load still lands on an available method', async () => {
  let release!: (m: Methods) => void;
  serve(() => new Promise<Methods>(resolve => { release = resolve; }));
  mount();
  await userEvent.click(await screen.findByRole('button', { name: /BASE/ }));
  release({ bank_transfer: false, cash: true, card: false });
  expect(await screen.findByLabelText(/Pago en el studio/)).toBeChecked();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('Pago en el studio', { selector: 'strong' })).toBeVisible();
  expect(screen.queryByText(/Datos de transferencia/)).toBeNull();
  expect(requested('/settings/bank-info')).toBe(false);
});

it('with no payment method at all it explains how to pay and cannot continue', async () => {
  serve({ bank_transfer: false, cash: false, card: false });
  mount();
  await userEvent.click(await screen.findByRole('button', { name: /BASE/ }));
  expect(await screen.findByText(/Consulta las formas de pago disponibles con el studio/)).toBeVisible();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  await waitFor(() => expect(requested('/settings/bank-info')).toBe(false));
});
