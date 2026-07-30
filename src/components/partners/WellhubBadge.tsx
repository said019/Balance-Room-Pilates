import { Badge } from '@/components/ui/badge';

export function WellhubBadge() {
    return (
        <Badge
            aria-label="Reserva de Wellhub"
            className="shrink-0 border-[#A8C900] bg-[#D7FE51] text-[#243000] shadow-sm hover:bg-[#D7FE51]"
            variant="outline"
        >
            Wellhub
        </Badge>
    );
}
