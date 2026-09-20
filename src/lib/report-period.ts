/** Inclusive calendar-day range in the studio timezone, independent of viewer timezone. */
export function reportPeriod(period: string, now = new Date()) {
  const endDate = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Mexico_City', year:'numeric', month:'2-digit', day:'2-digit'}).format(now);
  const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
  const start = new Date(endDate+'T12:00:00Z');
  start.setUTCDate(start.getUTCDate() - days + 1);
  return {startDate:start.toISOString().slice(0,10), endDate};
}
