import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import type { Membership } from '@/types/auth';
import { Loader2, Search } from 'lucide-react';

export default function MembershipsExpiring() {
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const { data, isLoading } = useQuery<Membership[]>({
    queryKey: ['memberships', 'expiring'],
    queryFn: async () => {
      const { data } = await api.get('/memberships?status=active');
      return data;
    },
  });

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const limit = addDays(now, 7);
    return (data || []).filter((membership) => {
      if (!membership.end_date) return false;
      const endDate = parseISO(membership.end_date);
      return isAfter(endDate, now) && isBefore(endDate, limit);
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return expiringSoon;
    const term = search.toLowerCase();
    return expiringSoon.filter((membership) =>
      membership.user_name?.toLowerCase().includes(term) ||
      membership.user_email?.toLowerCase().includes(term) ||
      membership.plan_name?.toLowerCase().includes(term)
    );
  }, [expiringSoon, search]);

  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Membresías por vencer</h1>
            <p className="text-muted-foreground">Membresías que vencen en los próximos 7 días.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Buscar membresías por vencer"
                placeholder="Buscar miembro"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table className="admin-record-table" role="table">
              <TableHeader role="rowgroup">
                <TableRow role="row">
                  <TableHead role="columnheader">Cliente</TableHead>
                  <TableHead role="columnheader">Plan</TableHead>
                  <TableHead role="columnheader">Vence</TableHead>
                  <TableHead role="columnheader">Estado</TableHead>
                  <TableHead role="columnheader" className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody role="rowgroup">
                {isLoading ? (
                  <TableRow role="row">
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow role="row">
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay membresías por vencer.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((membership) => (
                    <TableRow role="row" key={membership.id}>
                      <TableCell role="cell" data-label="Miembro" data-primary>
                          <div className="admin-record-value">
                            <div className="font-medium">{membership.user_name}</div>
                            <div className="text-xs text-muted-foreground">{membership.user_email}</div>
                          </div>
                      </TableCell>
                      <TableCell role="cell" data-label="Plan">
                          <div className="admin-record-value">
                              {membership.plan_name}
                          </div>
                      </TableCell>
                      <TableCell className="text-sm" role="cell" data-label="Vence">
                          <div className="admin-record-value">
                            {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : '—'}
                          </div>
                      </TableCell>
                      <TableCell role="cell" data-label="Estado">
                          <div className="admin-record-value">
                            <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                              Por vencer
                            </Badge>
                          </div>
                      </TableCell>
                      <TableCell className="text-right" role="cell" data-label="Acciones" data-actions>
                          <div className="admin-record-value">
                            <Button variant="outline" size="sm" asChild disabled={!membership.user_email}>
                              <a href={membership.user_email ? `mailto:${encodeURIComponent(membership.user_email)}?subject=${encodeURIComponent('Tu paquete en 2707 Altitud')}` : undefined}>Abrir correo</a>
                            </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
