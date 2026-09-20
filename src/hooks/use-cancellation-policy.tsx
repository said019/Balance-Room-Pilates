import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCancellationPolicy(enabled = true) {
    const query = useQuery({
        queryKey: ['public-cancellation-policy'],
        queryFn: async () => {
            const { data } = await api.get<{ cancellation_hours: number; version: number }>('/operational-settings/public');
            if (!Number.isInteger(data.cancellation_hours) || data.cancellation_hours < 0 || data.cancellation_hours > 168) throw new Error('El plazo recibido no es válido.');
            return data;
        },
        enabled,
        staleTime: 0,
        retry: false,
    });
    return { ...query, hours: query.isError ? null : query.data?.cancellation_hours ?? null };
}

export function CancellationTerms() {
    const policy = useCancellationPolicy();
    if (policy.isError) return <span>No pudimos consultar el plazo vigente. <button type="button" className="underline" onClick={() => void policy.refetch()}>Volver a consultar el plazo</button></span>;
    if (policy.hours === null) return <span role="status">Consultando el plazo de cancelación…</span>;
    return <span>Puedes cancelar o reagendar con un mínimo de {policy.hours} horas de anticipación.</span>;
}
