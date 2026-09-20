import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Plan } from '@/types/auth';
import { formatMxn } from '@/lib/studio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ReviewItem = { plan_id: string; status: 'pending'; reason: string; plan: Plan | null };
export function CatalogPlanReview({ onEdit }: { onEdit: (plan: Plan) => void }) {
  const query = useQuery<{ items: ReviewItem[] }>({ queryKey: ['catalog-plan-review'], queryFn: async () => {
    const { data } = await api.get('/plans/catalog-review');
    if (!Array.isArray(data?.items)) throw new Error('No se pudo consultar la revisión.');
    return data;
  }, retry: false });
  if (query.isPending) return <p role="status" className="text-sm text-muted-foreground">Consultando planes por revisar…</p>;
  if (query.isError) return <div role="alert" className="space-y-3 rounded-xl border p-5"><p>No pudimos consultar los planes por revisar.</p><Button variant="outline" onClick={() => void query.refetch()}>Volver a consultar</Button></div>;
  if (!query.data.items.length) return null;
  return <section className="space-y-4 rounded-xl border border-altitud-sand bg-altitud-sand/10 p-5" aria-labelledby="catalog-review-title">
    <div className="max-w-3xl space-y-2"><h2 id="catalog-review-title" className="font-heading text-xl">Planes por revisar</h2><p className="text-sm text-muted-foreground">El origen de estos planes no está confirmado. Revisa el nombre, precio y vigencia antes de decidir si corresponden a Altitud. Se conserva su estado actual; esta lista no los borra ni activa.</p><p className="text-sm text-muted-foreground">Si un plan no corresponde al studio, puedes desactivarlo desde sus acciones. La revisión pendiente se conserva para seguimiento.</p></div>
    <ul className="divide-y divide-altitud-sand/60">{query.data.items.map(item => <li key={item.plan_id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2"><h3 className="break-words font-semibold">{item.plan?.name || 'Plan no disponible'}</h3>{item.plan && <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm"><span>{formatMxn(Number(item.plan.price))}</span><span>{item.plan.duration_days} días</span><span>{item.plan.class_limit == null ? 'Clases ilimitadas' : `${item.plan.class_limit} clases`}</span></p>}<div className="flex flex-wrap gap-2"><Badge variant="outline">Origen por confirmar</Badge>{item.plan && <Badge variant="secondary">{item.plan.is_active ? 'Activo' : 'Inactivo'}</Badge>}</div></div>
      {item.plan && <Button variant="outline" className="shrink-0" aria-label={`Revisar ${item.plan.name}`} onClick={() => onEdit(item.plan!)}>Revisar plan</Button>}
    </li>)}</ul>
  </section>;
}
