import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export type ActivePlan = {
  id: string; name: string; price: number; duration_days: number | null;
  class_limit: number | null; description: string | null; is_active: boolean;
  is_unlimited?: boolean; sort_order?: number;
};
// This ID identifies the studio's Unlimited plan used by the separate Founding flow.
export const OFFICIAL_UNLIMITED_PLAN_ID = '27070000-0000-4000-8000-000000000099';

export async function fetchActivePlans(): Promise<ActivePlan[]> {
  const { data } = await api.get('/plans');
  if (!Array.isArray(data)) throw new Error('No se pudo consultar el catálogo.');
  return data.filter(plan => plan.is_active === true).map(plan => {
    const price = Number(plan.price);
    if (typeof plan.id !== 'string' || typeof plan.name !== 'string' || plan.price == null || !Number.isFinite(price) || price < 0) throw new Error('El catálogo requiere revisión del studio.');
    return { ...plan, price } as ActivePlan;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}
export function useActivePlans() {
  return useQuery({ queryKey: ['plans-active'], queryFn: fetchActivePlans, staleTime: 0, retry: false });
}
export function activePlanDescription(plan: ActivePlan) {
  const classes = plan.is_unlimited || plan.class_limit == null ? 'Clases ilimitadas' : `${plan.class_limit} ${plan.class_limit === 1 ? 'clase' : 'clases'}`;
  return `${classes} · ${plan.duration_days ? `${plan.duration_days} días` : 'Consulta la vigencia'}`;
}
