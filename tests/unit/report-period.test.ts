import {reportPeriod} from '../../src/lib/report-period';

describe('Reportes por fecha civil del studio', () => {
  it.each([
    ['7days', '2026-09-20T04:00:00Z', '2026-09-13', '2026-09-19'],
    ['30days', '2026-03-01T05:59:00Z', '2026-01-30', '2026-02-28'],
    ['7days', '2024-03-01T07:00:00Z', '2024-02-24', '2024-03-01'],
    ['90days', '2026-01-01T12:00:00Z', '2025-10-04', '2026-01-01'],
  ])('%s respeta medianoche México y días inclusivos (%s)', (period, instant, startDate, endDate) => {
    expect(reportPeriod(period, new Date(instant))).toEqual({startDate, endDate});
  });
});
