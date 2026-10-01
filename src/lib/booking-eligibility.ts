import type { Class } from '@/types/class';

export type EligibilityMembership = {
  status: string;
  classes_remaining: number | null;
  start_date: string | null;
  end_date: string | null;
  bound_facility_id?: string | null;
};

const civilDate = (value: string) => value.slice(0, 10);

/**
 * Same rule as `eligibleMemberships` in the backend (booking-integrity.ts), used only
 * to explain the block before confirming; the server still decides every booking.
 * `class.date` is already the studio's civil date (America/Mexico_City).
 */
export function membershipCoversClass(memberships: EligibilityMembership[], c: Pick<Class, 'date' | 'facility_id' | 'is_free'>): boolean {
  if (c.is_free) return true;
  const day = civilDate(c.date);
  return memberships.some((m) => m.status === 'active' &&
    (m.classes_remaining == null || m.classes_remaining >= 1) &&
    (!m.start_date || civilDate(m.start_date) <= day) &&
    (!m.end_date || civilDate(m.end_date) >= day) &&
    (!m.bound_facility_id || m.bound_facility_id === c.facility_id));
}
