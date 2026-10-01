import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import Checkout from '@/pages/client/Checkout';
import StudioSettings from '@/pages/admin/settings/StudioSettings';
import { TotalPassClassControl, WellhubClassControl } from '@/pages/admin/classes/ClassesCalendar';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn() }, getErrorMessage: (e: any) => e.message }));
jest.mock('@/components/layout/AuthGuard', () => ({ AuthGuard: ({ children }: any) => children }));
jest.mock('@/components/layout/ClientLayout', () => ({ ClientLayout: ({ children }: any) => children }));
jest.mock('@/components/layout/AdminLayout', () => ({ AdminLayout: ({ children }: any) => <main>{children}</main> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/hooks/use-cancellation-policy', () => ({ CancellationTerms: () => <span>Plazo de 12 horas.</span> }));

const plan = { id: 'plan-fixture', name: 'BASE', price: 649, duration_days: 30, class_limit: 4, is_active: true };
function mount(node: React.ReactElement) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); jest.clearAllMocks(); });

it('checkout explains that bank details are not configured instead of reporting a failure', async () => {
  (api.get as jest.Mock).mockImplementation(async (path: string) => ({ data: path === '/plans' ? [plan]
    : path === '/settings/payment-methods' ? { cash: true, card: false, bank_transfer: true }
      : path === '/purchase-consent/public' ? { version: 1, title: 'Declaración vigente', body: 'Declaro.' } : null }));
  mount(<Checkout />);
  await userEvent.click(await screen.findByRole('button', { name: /BASE/ }));
  await userEvent.click(await screen.findByLabelText(/Transferencia bancaria/));
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText(/aún no configura los datos bancarios/)).toBeVisible();
  expect(screen.queryByText(/No pudimos cargar los datos bancarios/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Confirmar orden' })).toBeDisabled();
});

it('studio settings shows bank details as not configured', async () => {
  (api.get as jest.Mock).mockImplementation(async () => ({ data: null }));
  mount(<StudioSettings />);
  expect(await screen.findByText(/Datos bancarios no configurados/)).toBeVisible();
});

it.each([['Wellhub', WellhubClassControl], ['TotalPass', TotalPassClassControl]])('%s control shows an unpublished class without offering a publish that does not exist', async (name, Control) => {
  (api.get as jest.Mock).mockResolvedValue({ data: { available: false, published: false, quota: 0, booked: 0, externalClassId: null, externalSlotId: null } });
  mount(<Control classId="class-1" maxCapacity={12} />);
  expect(await screen.findByText('No publicada · sin convenio activo')).toBeVisible();
  expect(screen.getByRole('switch', { name: `Publicar en ${name}` })).toBeDisabled();
  expect(screen.queryByText('Cupo a publicar')).toBeNull();
});
