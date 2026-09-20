import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { postFinancialOperation } from '@/lib/financial-intent';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  amount: z.coerce.number().positive('Monto inválido'),
  concept: z.string().min(1, 'Concepto requerido'),
  paymentMethod: z.enum(['cash', 'transfer', 'card', 'online']),
  facilityId: z.string().uuid().optional(),
  incomeDate: z.string().optional(),
  notes: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ManualIncome() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: facilities = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data } = await api.get('/facilities');
      return data;
    },
  });

  const { data: list = [] } = useQuery<any[]>({
    queryKey: ['manual-incomes'],
    queryFn: async () => {
      const { data } = await api.get('/payments/manual-income');
      return data;
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'cash' },
  });

  const mutation = useMutation({
    mutationFn: async (payload: Form) => {
      const { data } = await postFinancialOperation('/payments/manual-income', { ...payload, incomeDate: 'incomeDate' in payload ? payload.incomeDate || undefined : undefined });
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Ingreso registrado' });
      reset({ paymentMethod: 'cash' });
      qc.invalidateQueries({ queryKey: ['manual-incomes'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
    },
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <label htmlFor="manual-amount" className="text-sm font-medium">Monto</label>
          <Input type="number" step="0.01" id="manual-amount" {...register('amount')} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="manual-concept" className="text-sm font-medium">Concepto</label>
          <Input id="manual-concept" {...register('concept')} placeholder="Ej. Venta de producto" />
          {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="manual-paymentMethod" className="text-sm font-medium">Método</label>
          <Select
            defaultValue="cash"
            onValueChange={(v) => setValue('paymentMethod', v as Form['paymentMethod'])}
          >
            <SelectTrigger id="manual-paymentMethod" aria-label="Método de pago">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>

            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="manual-facilityId" className="text-sm font-medium">Estudio (opcional)</label>
          <Select onValueChange={(v) => setValue('facilityId', v)}>
            <SelectTrigger id="manual-facilityId" aria-label="Estudio del ingreso">
              <SelectValue placeholder="General" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="manual-incomeDate" className="text-sm font-medium">Fecha (opcional)</label>
          <Input type="date" id="manual-incomeDate" {...register('incomeDate')} />
        </div>
        <div className="space-y-2">
          <label htmlFor="manual-notes" className="text-sm font-medium">Notas</label>
          <Input id="manual-notes" {...register('notes')} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            Registrar ingreso
          </Button>
        </div>
      </form>

      <div className="rounded-xl border">
        <table className="admin-record-table w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="p-3">Fecha</th>
              <th scope="col" className="p-3">Concepto</th>
              <th scope="col" className="p-3">Estudio</th>
              <th scope="col" className="p-3">Método</th>
              <th scope="col" className="p-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td data-label="Fecha" className="p-3"><span className="admin-record-value">{String(r.income_date).slice(0, 10)}</span></td>
                <td data-label="Concepto" className="p-3"><span className="admin-record-value">{r.concept}</span></td>
                <td data-label="Estudio" className="p-3"><span className="admin-record-value">{r.facility_name || 'General'}</span></td>
                <td data-label="Método" className="p-3"><span className="admin-record-value">{r.payment_method}</span></td>
                <td data-label="Monto" className="p-3 text-right tabular-nums"><span className="admin-record-value">${Number(r.amount).toFixed(2)}</span></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Sin ingresos manuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
