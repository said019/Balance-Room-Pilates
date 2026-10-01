import React, { Suspense } from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { AppRoutes } from '@/App';
import Reports from '@/pages/admin/Reports';
import AdminDashboard from '@/pages/admin/Dashboard';

let state: any;
jest.mock('@/stores/authStore', () => {
  const useAuthStore: any = (selector?: (s: any) => unknown) => (selector ? selector(state) : state);
  useAuthStore.getState = () => state;
  useAuthStore.setState = (next: any) => { state = { ...state, ...next }; };
  return { useAuthStore };
});
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  const method = () => jest.fn(async () => ({ data: null }));
  return { ...actual, __esModule: true, default: { get: method(), post: method(), put: method(), patch: method(), delete: method() } };
});
jest.mock('@/components/layout/AdminLayout', () => ({ AdminLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/pages/admin/bookings/BookingsList', () => ({ __esModule: true, default: () => <h1>Llegadas de hoy</h1> }));

const reception = { id: 'reception', role: 'reception', display_name: 'Recepción' };
const ADMIN_ONLY = ['/admin/dashboard', '/admin/marketing', '/admin/discount-codes', '/admin/calendar', '/admin/totalpass/checkins',
  '/admin/classes/schedules', '/admin/classes/types', '/admin/classes/prices', '/admin/classes/generate', '/admin/members', '/admin/members/new',
  '/admin/members/a0000000-0000-4000-8000-000000000005/assign-membership', '/admin/members/a0000000-0000-4000-8000-000000000005/physical-sale',
  '/admin/members/a0000000-0000-4000-8000-000000000005', '/admin/memberships/pending', '/admin/memberships/active', '/admin/memberships/expiring',
  '/admin/memberships/all', '/admin/memberships/paquetes', '/admin/instructors', '/admin/payments', '/admin/reports', '/admin/settings/general',
  '/admin/settings/studio', '/admin/settings/operations', '/admin/settings/cancellations', '/admin/settings/notifications',
  '/admin/settings/whatsapp', '/admin/settings/platforms', '/admin/facilities', '/admin/clients', '/admin/clients/a0000000-0000-4000-8000-000000000005',
  '/admin/plans'];

beforeEach(() => { state = { user: reception, token: 't', isAuthenticated: true, isLoading: false, authCheckError: null, checkAuth: jest.fn(async () => undefined), logout: jest.fn() }; });
afterEach(() => { cleanup(); jest.clearAllMocks(); (api.get as jest.Mock).mockImplementation(async () => ({ data: null })); });

function mountPage(page: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/admin/x']}><Routes>
    <Route path="/admin/x" element={page} /><Route path="/admin/bookings" element={<h1>Llegadas de hoy</h1>} />
  </Routes></MemoryRouter></QueryClientProvider>);
}

it.each([['Reports', <Reports />], ['Dashboard', <AdminDashboard />]])('%s does not query admin data for reception before redirecting', async (_, page) => {
  mountPage(page);
  await screen.findByText('Llegadas de hoy');
  expect(api.get).not.toHaveBeenCalled();
});

function Where() { return <output data-testid="where">{useLocation().pathname}</output>; }
function mountRoute(route: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[route]}><Where />
    <Suspense fallback={null}><AppRoutes /></Suspense></MemoryRouter></QueryClientProvider>);
}

it.each(ADMIN_ONLY)('reception opening %s is redirected before any admin request', async (route) => {
  mountRoute(route);
  await screen.findByText('Llegadas de hoy', undefined, { timeout: 4000 });
  expect(screen.getByTestId('where')).toHaveTextContent('/admin/bookings');
  expect(api.get).not.toHaveBeenCalled();
});

it.each(['/admin/bookings', '/admin/bookings/waitlist', '/admin/founding50'])('reception keeps access to %s', async (route) => {
  (api.get as jest.Mock).mockImplementation(async () => ({ data: { members: [], acquired: 0, capacity: 50 } }));
  mountRoute(route);
  await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(route));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByTestId('where')).toHaveTextContent(route);
});

it('still renders admin reports for the owner account', async () => {
  state = { ...state, user: { id: 'owner', role: 'super_admin', display_name: 'Owner' } };
  (api.get as jest.Mock).mockImplementation(async (url: string) => ({ data: url === '/reports/transactions' ? { transactions: [], total: 0, count: 0 } : [] }));
  mountRoute('/admin/reports');
  expect(await screen.findByRole('heading', { name: 'Reportes' }, { timeout: 4000 })).toBeVisible();
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/reports/overview', expect.anything()));
});
