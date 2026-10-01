const formatMxn = (price: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2 }).format(price);
type PricePlan = { price: number | string; effective_price?: number; promo_active?: boolean; promo_label?: string | null };
export const effectivePlanPrice = (plan: PricePlan) => plan.promo_active && Number.isFinite(Number(plan.effective_price)) ? Number(plan.effective_price) : Number(plan.price);
export function PlanPrice({ plan }: { plan: PricePlan }) {
  return <span>{plan.promo_active && <><del className="mr-2 text-sm text-muted-foreground">{formatMxn(Number(plan.price))}</del><span className="sr-only">Precio promocional </span></>}{formatMxn(effectivePlanPrice(plan))}{plan.promo_active && plan.promo_label && <small className="block text-xs text-altitud-olive">{plan.promo_label}</small>}</span>;
}
