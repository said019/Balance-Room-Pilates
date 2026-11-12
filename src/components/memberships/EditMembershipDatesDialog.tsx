import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from '@/components/brand/icons';

export interface EditableMembershipDates {
    id: string;
    start_date?: string | null;
    end_date?: string | null;
    user_name?: string | null;
    plan_name?: string | null;
}

/** DB DATE values arrive as "YYYY-MM-DD" or ISO strings; keep only the civil date. */
function toYmd(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
}

interface Props {
    membership: EditableMembershipDates | null;
    onOpenChange: (open: boolean) => void;
}

export function EditMembershipDatesDialog({ membership, onOpenChange }: Props) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (membership) {
            setStartDate(toYmd(membership.start_date) ?? '');
            setEndDate(toYmd(membership.end_date) ?? '');
            setReason('');
        }
    }, [membership]);

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch(`/memberships/${membership!.id}/dates`, {
                start_date: startDate,
                end_date: endDate,
                expected_start_date: toYmd(membership!.start_date),
                expected_end_date: toYmd(membership!.end_date),
                reason: reason.trim(),
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memberships'] });
            queryClient.invalidateQueries({ queryKey: ['client'] });
            toast({ title: 'Vigencia actualizada', description: 'Las fechas de la membresía se guardaron.' });
            onOpenChange(false);
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'No se pudo editar la vigencia', description: getErrorMessage(error) });
        },
    });

    const rangeInvalid = Boolean(startDate && endDate && endDate < startDate);
    const unchanged = membership
        && startDate === (toYmd(membership.start_date) ?? '')
        && endDate === (toYmd(membership.end_date) ?? '');
    const canSave = Boolean(startDate && endDate && reason.trim() && !rangeInvalid && !unchanged && !mutation.isPending);

    return (
        <Dialog
            open={Boolean(membership)}
            onOpenChange={(next) => { if (!next && !mutation.isPending) onOpenChange(false); }}
        >
            <DialogContent className="max-h-[85dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar vigencia</DialogTitle>
                    <DialogDescription>
                        {[membership?.user_name, membership?.plan_name].filter(Boolean).join(' · ') || 'Ajusta las fechas de la membresía.'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-4 py-2"
                    onSubmit={(e) => { e.preventDefault(); if (canSave) mutation.mutate(); }}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="membership-start-date">Fecha de inicio</Label>
                            <Input
                                id="membership-start-date"
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="membership-end-date">Fecha final</Label>
                            <Input
                                id="membership-end-date"
                                type="date"
                                required
                                min={startDate || undefined}
                                value={endDate}
                                aria-invalid={rangeInvalid}
                                aria-describedby={rangeInvalid ? 'membership-dates-error' : undefined}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    {rangeInvalid && (
                        <p id="membership-dates-error" className="text-sm text-destructive">
                            La fecha final debe ser igual o posterior a la de inicio.
                        </p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="membership-dates-reason">Motivo del cambio</Label>
                        <Textarea
                            id="membership-dates-reason"
                            placeholder="Ej. Extensión por incapacidad, cortesía, corrección de captura"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            maxLength={500}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Queda registrado en la bitácora de administración. Si la nueva fecha final ya pasó, la membresía queda vencida; si se extiende, vuelve a estar activa.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                            Volver
                        </Button>
                        <Button type="submit" disabled={!canSave}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar vigencia
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
