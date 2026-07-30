import { Badge } from '@/components/ui/badge';

export function WellhubBadge() {
    return (
        <Badge
            aria-label="Reserva de Wellhub"
            className="shrink-0 border-[#CF3153] bg-[#F2496B] text-[#2A0810] shadow-sm hover:bg-[#F2496B]"
            variant="outline"
        >
            Wellhub
        </Badge>
    );
}
