import { Badge } from '@/components/ui/badge';

export function TotalPassBadge() {
  return (
    <Badge
      aria-label="Reserva de TotalPass"
      className="shrink-0 border-sky-400 bg-sky-100 text-sky-900 shadow-sm hover:bg-sky-100"
      variant="outline"
    >
      TotalPass
    </Badge>
  );
}
