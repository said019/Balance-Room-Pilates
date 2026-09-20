import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import CancellationPolicy from '@/pages/CancellationPolicy';
import { isLateCancellation } from '@/components/member/useMemberData';
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() }, getStoredToken: () => null }));
jest.mock('@/components/altitud/SiteShell', () => ({ SiteHeader: () => null, SiteFooter: () => null }));
const mount = () => render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><CancellationPolicy /></QueryClientProvider></MemoryRouter>);
afterEach(cleanup);
it('renders the current six-hour database rule instead of the original four-hour copy', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: { cancellation_hours: 6, version: 7 } });
    mount();
    expect(await screen.findByText(/mínimo de 6 horas/)).toBeVisible();
    expect(screen.queryByText(/4 horas/)).toBeNull();
});
it('does not claim the original rule when the current public policy cannot be loaded', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Offline'));
    mount();
    expect(await screen.findByText(/No pudimos consultar el plazo vigente/)).toBeVisible();
    expect(screen.queryByText(/4 horas/)).toBeNull();
});
it('uses the supplied current policy for the cancellation boundary and preserves an unknown state', () => {
    const booking = { date: '2030-01-01', start_time: '12:00' } as any;
    const now = new Date('2030-01-01T07:00:00-06:00').getTime();
    expect(isLateCancellation(booking, now, 6)).toBe(true);
    expect(isLateCancellation(booking, now, 4)).toBe(false);
    expect(isLateCancellation(booking, now, null)).toBeNull();
});
