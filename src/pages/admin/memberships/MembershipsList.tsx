import { postFinancialOperation } from '@/lib/financial-intent';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import type { Membership, Plan, User } from '@/types/auth'; // Ensure these types exist
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, CheckCircle2, XCircle, Plus } from '@/components/brand/icons';
import { MembershipActivationDialog, ActivationForm } from '@/components/memberships/MembershipActivationDialog';

// Schema for assigning membership
const assignSchema = z.object({
    userId: z.string().uuid('Selecciona un usuario'),
    planId: z.string().uuid('Selecciona un plan'),
    status: z.enum(['active', 'pending_payment', 'pending_activation']),
    paymentMethod: z.string().optional(),
    paymentReference: z.string().max(255).optional(),
});

type AssignForm = z.infer<typeof assignSchema>;

interface MembershipsListProps {
    initialFilter?: 'all' | 'active' | 'pending_payment' | 'pending_activation';
    title?: string;
    description?: string;
    hideTabs?: boolean;
}

export default function MembershipsList({
    initialFilter = 'all',
    title = 'Membresías',
    description = 'Gestión de suscripciones y activaciones.',
    hideTabs = false,
}: MembershipsListProps) {
    const [filter, setFilter] = useState(initialFilter);
    const [search, setSearch] = useState('');
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [activationMembership, setActivationMembership] = useState<Membership | null>(null);
    const [cancellationMembership, setCancellationMembership] = useState<Membership | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRefund, setCancelRefund] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { register, handleSubmit, setValue, watch, reset, formState: { isSubmitting, errors } } = useForm<AssignForm>({
        resolver: zodResolver(assignSchema),
        defaultValues: {
            status: 'active',
        }
    });

    const watchedUserId = watch('userId');
    const watchedPlanId = watch('planId');
    const watchedPaymentMethod = watch('paymentMethod');

    const { data: selectedFounder } = useQuery<{ user: { is_founder: boolean; founder_first_package_used: boolean } }>({
        queryKey: ['founder', watchedUserId],
        queryFn: async () => (await api.get(`/users/${watchedUserId}/founder`)).data,
        enabled: Boolean(watchedUserId) && isAssignDialogOpen,
    });

    // Fetch Memberships
    const { data: memberships, isLoading } = useQuery<Membership[]>({
        queryKey: ['memberships', filter],
        queryFn: async () => {
            // Logic to filter by params if needed, or filter client side.
            // Backend supports filtering by status.
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            const { data } = await api.get(`/memberships?${params.toString()}`);
            return data;
        },
    });

    // Fetch Plans (for assignment)
    const { data: plans } = useQuery<Plan[]>({
        queryKey: ['plans'],
        queryFn: async () => {
            const { data } = await api.get('/plans');
            return data;
        },
        enabled: isAssignDialogOpen,
    });

    // Fetch Users (for assignment) - simple version, fetches all clients (optimize later)
    const { data: users } = useQuery<User[]>({
        queryKey: ['users-list'],
        queryFn: async () => {
            // We can reuse the users endpoint with limit=100 or something
            const { data } = await api.get('/users?role=client&limit=100');
            return data.users;
        },
        enabled: isAssignDialogOpen,
    });


    // Mutations
    const activateMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: ActivationForm }) => {
            return await api.post(`/memberships/${id}/activate`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            toast({ title: 'Membresía activada', description: 'La membresía está ahora activa.' });
            setActivationMembership(null);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async ({ id, reason, refund }: { id: string; reason?: string; refund: boolean }) => {
            const { data } = await api.post(`/memberships/${id}/cancel`, { reason, refund });
            return data as { refund?: { applied: boolean; payments_refunded: string[] } };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            const refundInfo = data?.refund;
            const description = refundInfo?.applied
                ? `Reembolso registrado en ${refundInfo.payments_refunded.length} pago(s).`
                : 'La membresía ha sido cancelada.';
            toast({ title: 'Membresía cancelada', description });
            setCancellationMembership(null);
            setCancelReason('');
            setCancelRefund(false);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const assignMutation = useMutation({
        mutationFn: async (data: AssignForm) => {
            return await postFinancialOperation('/memberships/assign', { ...data, paymentMethod: data.status === 'active' ? data.paymentMethod : undefined });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            toast({ title: 'Membresía asignada', description: 'La membresía se ha creado exitosamente.' });
            setIsAssignDialogOpen(false);
            reset();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const filteredMemberships = memberships?.filter(m =>
        m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.user_email?.toLowerCase().includes(search.toLowerCase())
    );

    const onSubmitAssign = (data: AssignForm) => {
        assignMutation.mutate(data);
    };

    const handleActivate = (membershipId: string, data: ActivationForm) => {
        activateMutation.mutate({ id: membershipId, payload: data });
    };

    return (
        <AuthGuard requiredRoles={['admin']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-heading font-bold">{title}</h1>
                            <p className="text-muted-foreground">{description}</p>
                        </div>
                        <Button className="w-full sm:w-auto sm:shrink-0" onClick={() => setIsAssignDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Asignar Membresía
                        </Button>
                    </div>

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        {!hideTabs && (
                            <div role="group" aria-label="Filtrar membresías por estado" className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:flex sm:w-auto">
                                {([
                                    ['all', 'Todas'],
                                    ['active', 'Activas'],
                                    ['pending_payment', 'Pago pendiente'],
                                    ['pending_activation', 'Por activar'],
                                ] as const).map(([value, label]) => (
                                    <Button
                                        key={value}
                                        variant="ghost"
                                        aria-pressed={filter === value}
                                        className={filter === value ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground'}
                                        onClick={() => setFilter(value)}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="relative w-full xl:w-64 xl:shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                aria-label="Buscar membresías por miembro o correo"
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
                                    <TableHead role="columnheader">Estado</TableHead>
                                    <TableHead role="columnheader">Vigencia</TableHead>
                                    <TableHead role="columnheader">Créditos</TableHead>
                                    <TableHead role="columnheader" className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody role="rowgroup">
                                {isLoading ? (
                                    <TableRow role="row">
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredMemberships?.length === 0 ? (
                                    <TableRow role="row">
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron membresías.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMemberships?.map((m) => (
                                        <TableRow role="row" key={m.id}>
                                            <TableCell role="cell" data-label="Miembro" data-primary>
                                                <div className="admin-record-value">
                                                    <div className="font-medium">{m.user_name}</div>
                                                    <div className="text-xs text-muted-foreground">{m.user_email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Plan">
                                                <div className="admin-record-value">
                                                    {m.plan_name}
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Estado">
                                                <div className="admin-record-value">
                                                    <Badge variant={
                                                        m.status === 'active' ? 'default' :
                                                            m.status.includes('pending') ? 'outline' : 'secondary'
                                                    } className={
                                                        m.status === 'active' ? 'bg-success/10 text-success hover:bg-success/10 border-success/30' :
                                                            m.status === 'pending_payment' ? 'text-warning border-warning/30 bg-warning/10' :
                                                                ''
                                                    }>
                                                        {m.status === 'active' ? 'Activa' :
                                                            m.status === 'pending_payment' ? 'Pendiente Pago' :
                                                                m.status === 'pending_activation' ? 'Por Activar' :
                                                                    m.status === 'cancelled' ? 'Cancelada' :
                                                                        m.status === 'expired' ? 'Vencida' :
                                                                            m.status === 'paused' ? 'Pausada' : m.status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm" role="cell" data-label="Vigencia">
                                                <div className="admin-record-value">
                                                    {m.start_date ? (
                                                        <>
                                                            <div className="text-muted-foreground">Inicio: {new Date(m.start_date).toLocaleDateString()}</div>
                                                            <div>Fin: {new Date(m.end_date!).toLocaleDateString()}</div>
                                                        </>
                                                    ) : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Créditos">
                                                <div className="admin-record-value">
                                                    {m.credits_total ? `${m.credits_remaining} / ${m.credits_total}` : 'Ilimitado'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right" role="cell" data-label="Acciones" data-actions>
                                                <div className="admin-record-value">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {(m.status === 'pending_activation' || m.status === 'pending_payment') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-success hover:text-success hover:bg-success/10"
                                                                onClick={() => setActivationMembership(m)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Activar
                                                            </Button>
                                                        )}
                                                        {m.status === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                aria-label={`Cancelar membresía de ${m.user_name}`}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => {
                                                                    setCancelReason('');
                                                                    setCancelRefund(false);
                                                                    setCancellationMembership(m);
                                                                }}
                                                            >
                                                                <XCircle className="mr-1 h-4 w-4" /> Cancelar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Asignar Membresía Manual</DialogTitle>
                                <DialogDescription>
                                    Asigna un plan a un cliente existente.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmitAssign)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Cliente</Label>
                                    <Select onValueChange={(val) => setValue('userId', val)}>
                                        <SelectTrigger aria-label="Cliente">
                                            <SelectValue placeholder="Seleccionar cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users?.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.display_name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.userId && <p className="text-xs text-destructive">{errors.userId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Plan</Label>
                                    <Select onValueChange={(val) => setValue('planId', val)}>
                                        <SelectTrigger aria-label="Plan">
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans?.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name} - ${p.price}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.planId && <p className="text-xs text-destructive">{errors.planId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Estado Inicial</Label>
                                    <Select onValueChange={(val: any) => setValue('status', val)} defaultValue="active">
                                        <SelectTrigger aria-label="Estado inicial">
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Activa (Inicia hoy)</SelectItem>
                                            <SelectItem value="pending_payment">Pendiente de Pago</SelectItem>
                                            <SelectItem value="pending_activation">Pendiente de Activación</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Método de pago recibido (para activar)</Label>
                                    <Select onValueChange={(val) => setValue('paymentMethod', val)}>
                                        <SelectTrigger aria-label="Método de pago">
                                            <SelectValue placeholder="Seleccionar método" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Efectivo</SelectItem>
                                            <SelectItem value="card">Tarjeta</SelectItem>
                                            <SelectItem value="transfer">Transferencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {watchedPaymentMethod && watchedPaymentMethod !== 'cash' && <div className="space-y-2">
                                    <Label htmlFor="assign-payment-reference">Folio del pago recibido *</Label>
                                    <Input id="assign-payment-reference" {...register('paymentReference')} required />
                                </div>}

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsAssignDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Asignar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <MembershipActivationDialog
                        open={Boolean(activationMembership)}
                        membership={activationMembership}
                        isSubmitting={activateMutation.isPending}
                        onOpenChange={(nextOpen) => {
                            if (!nextOpen) setActivationMembership(null);
                        }}
                        onActivate={handleActivate}
                    />

                    <Dialog
                        open={Boolean(cancellationMembership)}
                        onOpenChange={(nextOpen) => {
                            if (!nextOpen && !cancelMutation.isPending) setCancellationMembership(null);
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cancelar membresía</DialogTitle>
                                <DialogDescription>
                                    {cancellationMembership?.user_name
                                        ? `Cliente: ${cancellationMembership.user_name}.`
                                        : 'Confirma la cancelación.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cancel-reason">Motivo (obligatorio para registrar reembolso)</Label>
                                    <Textarea
                                        id="cancel-reason"
                                        placeholder="Ej. Cliente solicitó cambio de paquete"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>
                                <div className="flex items-start gap-3 rounded-md border p-3">
                                    <Checkbox
                                        id="cancel-refund"
                                        checked={cancelRefund}
                                        onCheckedChange={(v) => setCancelRefund(v === true)}
                                    />
                                    <div className="space-y-1">
                                        <Label htmlFor="cancel-refund" className="cursor-pointer">
                                            Registrar un reembolso ya realizado
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Actualiza el registro de los pagos. La devolución del dinero se realiza por separado; esta acción no envía dinero al cliente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="ghost"
                                    onClick={() => setCancellationMembership(null)}
                                    disabled={cancelMutation.isPending}
                                >
                                    Volver
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (!cancellationMembership) return;
                                        cancelMutation.mutate({
                                            id: cancellationMembership.id,
                                            reason: cancelReason.trim() || undefined,
                                            refund: cancelRefund,
                                        });
                                    }}
                                    disabled={cancelMutation.isPending || (cancelRefund && !cancelReason.trim())}
                                >
                                    {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Cancelar membresía
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
