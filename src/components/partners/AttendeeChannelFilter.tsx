import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AttendeeChannelFilterValue = 'all' | 'wellhub' | 'balance';

interface AttendeeChannelFilterProps {
    value: AttendeeChannelFilterValue;
    onValueChange: (value: AttendeeChannelFilterValue) => void;
    totalCount: number;
    wellhubCount: number;
    balanceCount: number;
}

export function AttendeeChannelFilter({
    value,
    onValueChange,
    totalCount,
    wellhubCount,
    balanceCount,
}: AttendeeChannelFilterProps) {
    const options: Array<{
        value: AttendeeChannelFilterValue;
        label: string;
        count: number;
    }> = [
        { value: 'all', label: 'Todas', count: totalCount },
        { value: 'wellhub', label: 'Wellhub', count: wellhubCount },
        { value: 'balance', label: 'Balance', count: balanceCount },
    ];

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtrar por origen
            </p>
            <div
                aria-label="Filtrar reservas por origen"
                className="flex flex-wrap gap-2"
                role="group"
            >
                {options.map((option) => {
                    const isActive = value === option.value;
                    const isWellhub = option.value === 'wellhub';

                    return (
                        <Button
                            key={option.value}
                            aria-pressed={isActive}
                            className={cn(
                                'h-8 rounded-full px-3 text-xs',
                                isActive && !isWellhub && 'bg-balance-dark text-white hover:bg-balance-dark/90',
                                isActive && isWellhub && 'border-[#CF3153] bg-[#F2496B] text-[#2A0810] hover:bg-[#F2496B]',
                            )}
                            onClick={() => onValueChange(option.value)}
                            size="sm"
                            style={isActive && isWellhub ? {
                                backgroundColor: '#F2496B',
                                borderColor: '#CF3153',
                                color: '#2A0810',
                            } : undefined}
                            type="button"
                            variant="outline"
                        >
                            {option.label}
                            <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.5 tabular-nums">
                                {option.count}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
