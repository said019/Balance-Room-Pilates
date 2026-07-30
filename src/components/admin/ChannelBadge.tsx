import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Origen de una reserva o de un cliente.
 * `direct` = llegó por la plataforma propia (web, app o alta manual en admin).
 */
export type BookingChannel = 'wellhub' | 'totalpass' | 'direct';

const CHANNEL_META: Record<BookingChannel, { label: string; className: string }> = {
    wellhub: {
        label: 'Wellhub',
        className: 'border-orange-300 bg-orange-50 text-orange-700',
    },
    totalpass: {
        label: 'TotalPass',
        className: 'border-indigo-300 bg-indigo-50 text-indigo-700',
    },
    direct: {
        label: 'Directo',
        className: 'border-border bg-muted text-muted-foreground',
    },
};

/** Nombres alternos que pueden llegar del backend para un mismo convenio. */
const CHANNEL_ALIASES: Record<string, BookingChannel> = {
    wellhub: 'wellhub',
    gympass: 'wellhub',
    totalpass: 'totalpass',
    total_pass: 'totalpass',
    'total-pass': 'totalpass',
};

/** Entidad (reserva, asistente o cliente) que puede traer el origen en distintos campos. */
export interface ChannelSource {
    channel?: string | null;
    source?: string | null;
    origin?: string | null;
}

/** Normaliza el valor crudo del backend a un canal conocido. */
export function resolveChannel(value?: string | null): BookingChannel {
    if (!value) return 'direct';
    return CHANNEL_ALIASES[value.trim().toLowerCase()] || 'direct';
}

/**
 * Toma el origen de la entidad sin importar si el backend lo manda como
 * `channel`, `source` u `origin`.
 */
export function getChannel(entity?: ChannelSource | null): BookingChannel {
    if (!entity) return 'direct';
    return resolveChannel(entity.channel ?? entity.source ?? entity.origin);
}

/** True si la reserva/cliente llegó por un convenio externo (Wellhub, TotalPass). */
export function isPartnerChannel(channel: BookingChannel): boolean {
    return channel !== 'direct';
}

interface ChannelBadgeProps {
    /** Valor crudo del backend (`wellhub`, `gympass`, `totalpass`, ...) o la entidad completa. */
    channel?: string | null;
    /** Muestra también la etiqueta "Directo". Por defecto solo se etiquetan los convenios. */
    showDirect?: boolean;
    className?: string;
}

/**
 * Etiqueta el origen de una reserva o cliente para distinguir de un vistazo
 * las que entran por convenios (Wellhub / TotalPass) de las propias.
 */
export function ChannelBadge({ channel, showDirect = false, className }: ChannelBadgeProps) {
    const resolved = resolveChannel(channel);
    if (resolved === 'direct' && !showDirect) return null;

    const meta = CHANNEL_META[resolved];
    return (
        <Badge variant="outline" className={cn('text-xs font-medium', meta.className, className)}>
            {meta.label}
        </Badge>
    );
}
