import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/lib/api';
import ReportsClasses from '@/pages/admin/reports/ReportsClasses';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('@/components/layout/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
// Inspect the boundary passed to Recharts, whose Pie ignores numeric strings.
jest.mock('recharts', () => {
  const React = require('react');
  const Container = ({ children }: any) => React.createElement('div', null, children);
  const Empty = () => null;
  return {
    BarChart: Container, Bar: Empty, XAxis: Empty, YAxis: Empty, CartesianGrid: Empty,
    Tooltip: Empty, Legend: Empty, ResponsiveContainer: Container, PieChart: Container, Cell: Empty,
    Pie: ({ data }: any) => React.createElement('output', { 'data-testid': 'pie-data' }, JSON.stringify(data)),
  };
});

afterEach(cleanup);

it.each([
  ['PostgreSQL aggregate strings', ['2', '0']],
  ['numeric API aggregates', [2, 0]],
])('passes numeric pie values and preserves type labels for %s', async (_, counts) => {
  (api.get as jest.Mock).mockResolvedValue({ data: {
    byDayOfWeek: [], byTime: [], classesByStudio: [],
    byType: [
      { name: 'TRAIN', color: '#5F632C', total_classes: '2', total_bookings: counts[0] },
      { name: 'Running', color: '#7F6146', total_classes: '1', total_bookings: counts[1] },
    ],
  } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><ReportsClasses /></QueryClientProvider>);
  const values = JSON.parse((await screen.findByTestId('pie-data')).textContent!);
  expect(values.map(({ name, color, total_bookings }: any) => ({ name, color, total_bookings }))).toEqual([
    { name: 'TRAIN', color: '#5F632C', total_bookings: 2 },
    { name: 'Running', color: '#7F6146', total_bookings: 0 },
  ]);
});
