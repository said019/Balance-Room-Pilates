import React from 'react';
import { render, screen, cleanup, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import { fetchMyMembership } from '@/lib/memberships';
import MemberApp from '@/pages/client/MemberApp';
import { membershipCoversClass } from '@/lib/booking-eligibility';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() }, getErrorMessage: (e: any) => e?.response?.data?.error || e.message }));
jest.mock('@/lib/memberships', () => ({ fetchMyMembership: jest.fn() }));
jest.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: { id: 'client', role: 'client', display_name: 'QA' } }) }));
jest.mock('@/components/layout/AuthGuard', () => ({ AuthGuard: ({ children }: any) => children }));
jest.mock('@/components/layout/ClientLayout', () => ({ ClientLayout: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/hooks/use-cancellation-policy', () => ({
  useCancellationPolicy: () => ({ hours: 12, isFetching: false, isError: false, refetch: jest.fn() }),
  CancellationTerms: () => <span>Plazo de 12 horas.</span>,
}));

const DAY = '2030-01-10';
const base = { status: 'active', classes_remaining: 3, start_date: '2029-12-01', end_date: '2030-01-10', bound_facility_id: null };
const cls = { id: 'class-open', date: DAY, start_time: '18:00:00', end_time: '19:00:00', max_capacity: 12, current_bookings: 3, class_type_name: 'TRAIN', status: 'scheduled', facility_id: 'studio-a' } as any;
const full = { ...cls, id: 'class-full', start_time: '19:00:00', end_time: '20:00:00', max_capacity: 1, current_bookings: 1 };

describe('membershipCoversClass mirrors the server rule', () => {
  it.each([
    ['last civil day of validity', base, true],
    ['expired the day before the class', { ...base, end_date: '2030-01-09' }, false],
    ['not started yet', { ...base, start_date: '2030-01-11' }, false],
    ['no credits left', { ...base, classes_remaining: 0 }, false],
    ['unlimited package', { ...base, classes_remaining: null }, true],
    ['pending payment', { ...base, status: 'pending_payment' }, false],
    ['displayed as expired', { ...base, status: 'expired' }, false],
    ['bound to another studio', { ...base, bound_facility_id: 'studio-b' }, false],
    ['bound to the class studio', { ...base, bound_facility_id: 'studio-a' }, true],
    ['ISO timestamps from the API', { ...base, end_date: '2030-01-10T00:00:00.000Z' }, true],
  ])('%s', (_, membership, expected) => {
    expect(membershipCoversClass([membership as any], cls)).toBe(expected);
  });
  it('accepts when any package covers the date and free classes need none', () => {
    expect(membershipCoversClass([{ ...base, end_date: '2030-01-01' }, base] as any, cls)).toBe(true);
    expect(membershipCoversClass([], { ...cls, is_free: true })).toBe(true);
  });
});

let memberships: any[];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/app/book']}><MemberApp /></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2030-01-10T09:00:00'), doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'nextTick', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  memberships = [{ id: 'm1', ...base, end_date: '2030-01-05', plan_name: 'BASE' }];
  (fetchMyMembership as jest.Mock).mockImplementation(async () => ({ ...memberships[0], status: 'expired' }));
  (api.get as jest.Mock).mockImplementation(async (path: string) => ({ data: path === '/memberships/my' ? memberships : path === '/bookings/my-bookings' ? [] : path.startsWith('/classes') ? [cls, full] : null }));
});
afterEach(() => { cleanup(); jest.useRealTimers(); jest.clearAllMocks(); });

const session = async (id: string) => within(await waitFor(() => {
  const element = document.querySelector(`[data-class-id="${id}"]`);
  if (!element) throw new Error(`sin sesión ${id}`);
  return element as HTMLElement;
}));

it('disables booking and waitlist when no package covers the class date, with a visible reason and a link', async () => {
  mount();
  const open = await session('class-open');
  const waitlist = await session('class-full');
  expect(open.getByRole('button', { name: /Sin paquete vigente/ })).toBeDisabled();
  expect(waitlist.getByRole('button', { name: /Sin paquete vigente/ })).toBeDisabled();
  expect(screen.getByText(/Ningún paquete tuyo cubre este día/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Mi membresía' })).toHaveAttribute('href', '/app/profile/membership');
  expect(api.post).not.toHaveBeenCalled();
});

it('keeps booking available when a package covers the class date', async () => {
  memberships = [{ id: 'm1', ...base, plan_name: 'BASE' }];
  mount();
  const open = await session('class-open');
  await waitFor(() => expect(open.getByRole('button', { name: /Reservar/ })).toBeEnabled());
  expect((await session('class-full')).getByRole('button', { name: /Entrar a lista de espera/ })).toBeEnabled();
  expect(screen.queryByText(/Ningún paquete tuyo cubre este día/)).toBeNull();
});

it('does not invite a pointless retry after the server rejects the booking', async () => {
  memberships = [{ id: 'm1', ...base, plan_name: 'BASE' }];
  (api.post as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 409, data: { code: 'MEMBERSHIP_REQUIRED', error: 'Se requiere un paquete activo con créditos y vigencia para la fecha de la clase.' } }, message: 'Request failed' });
  const user = userEvent.setup({ advanceTimers: () => undefined });
  mount();
  const open = await session('class-open');
  await waitFor(() => expect(open.getByRole('button', { name: /Reservar/ })).toBeEnabled());
  await user.click(open.getByRole('button', { name: /Reservar/ }));
  await user.click(await screen.findByRole('button', { name: /Confirmar reserva/ }));
  expect(await screen.findByText('Se requiere un paquete activo con créditos y vigencia para la fecha de la clase.')).toBeVisible();
  expect(screen.getByRole('button', { name: /Confirmar reserva/ })).toBeDisabled();
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'Mi membresía' })).toHaveAttribute('href', '/app/profile/membership');
});
