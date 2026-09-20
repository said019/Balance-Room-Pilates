import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import { PublishedHours, civilTimeLabel } from '../../src/components/schedule/PublishedHours';
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
const get = api.get as jest.Mock;
function renderHours() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return { ...render(<QueryClientProvider client={cache}><PublishedHours /></QueryClientProvider>), cache };
}
afterEach(() => { cleanup(); jest.clearAllMocks(); });
it('renders exactly the supplied civil rows, with no fallback weekday or weekend hours', async () => {
  get.mockResolvedValue({ data: { timezone: 'America/Mexico_City', slots: [
    { id:'fixture-a',day_of_week:2,start_time:'10:17' }, { id:'fixture-b',day_of_week:6,start_time:'15:43' },
  ] } });
  const {container}=renderHours();
  await screen.findByText('10:17 AM');
  expect(screen.getByText('3:43 PM')).toBeTruthy();
  expect(screen.queryByText('Lunes')).toBeNull();
  expect(Array.from(container.querySelectorAll('[data-slot-id]')).map(el => [el.getAttribute('data-slot-id'),el.getAttribute('data-day'),el.getAttribute('data-time')])).toEqual([['fixture-a','2','10:17'],['fixture-b','6','15:43']]);
  expect(get).toHaveBeenCalledWith('/schedules/public');
});
it('shows an honest empty state instead of invented hours', async () => {
  get.mockResolvedValue({data:{timezone:'America/Mexico_City',slots:[]}});
  const {container}=renderHours();
  await screen.findByText('Los horarios se publicarán próximamente.');
  expect(container.querySelectorAll('[data-slot-id]').length).toBe(0);
});
it('shows loading while the database request is pending', () => {
  get.mockImplementation(() => new Promise(() => {}));
  renderHours();
  expect(screen.getByRole('status').textContent).toBe('Consultando horarios…');
});
it('does not replace a failed database read with hardcoded hours', async () => {
  get.mockRejectedValue(new Error('Offline'));
  const {container}=renderHours();
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No pudimos consultar'));
  expect(container.querySelectorAll('[data-slot-id]').length).toBe(0);
});
it.each([['00:00','12:00 AM'],['12:00','12:00 PM'],['23:59','11:59 PM']])('formats civil %s without browser timezone conversion', (value, expected) => {
  expect(civilTimeLabel(value)).toBe(expected);
});

it('updates displayed hours after the database publication changes and the shared query refetches', async () => {
  get.mockResolvedValueOnce({data:{timezone:'America/Mexico_City',slots:[{id:'same-slot',day_of_week:1,start_time:'06:13'}]}})
    .mockResolvedValueOnce({data:{timezone:'America/Mexico_City',slots:[{id:'same-slot',day_of_week:1,start_time:'07:23'}]}});
  const {cache}=renderHours();
  await screen.findByText('6:13 AM');
  await cache.invalidateQueries({queryKey:['schedule-public']});
  await screen.findByText('7:23 AM');
  expect(screen.queryByText('6:13 AM')).toBeNull();
});
