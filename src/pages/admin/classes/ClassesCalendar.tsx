import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api, { getErrorMessage } from '@/lib/api';
import type { Class, ClassType, Instructor } from '@/types/class';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Type for Facility
interface Facility {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    is_active: boolean;
}
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import {
    Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, Repeat, Users, Trash2, Check, Edit, Phone, Clock, MapPin, Sparkles, Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { WellhubBadge } from '@/components/partners/WellhubBadge';
import {
    AttendeeChannelFilter,
    type AttendeeChannelFilterValue,
} from '@/components/partners/AttendeeChannelFilter';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const generateSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
});

const classSchema = z.object({
    date: z.date(),
    classTypeId: z.string().uuid(),
    instructorId: z.string().uuid(),
    facilityId: z.string().uuid().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    maxCapacity: z.coerce.number().int().positive(),
    theme: z.string().optional(),
});

const editClassSchema = z.object({
    classTypeId: z.string().uuid(),
    instructorId: z.string().uuid(),
    facilityId: z.string().uuid().optional(),
    date: z.date(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    maxCapacity: z.coerce.number().int().positive(),
    theme: z.string().optional(),
});

type GenerateForm = z.infer<typeof generateSchema>;
type ClassForm = z.infer<typeof classSchema>;
type EditClassForm = z.infer<typeof editClassSchema>;

interface Attendee {
    booking_id: string;
    status: string;
    checked_in_at: string | null;
    channel?: string;
    user_id: string;
    display_name: string;
    email: string;
    photo_url: string | null;
    phone: string;
    plan_name: string | null;
}

interface WellhubClassStatus {
    published: boolean;
    quota: number;
    booked: number;
    externalClassId: string | null;
    externalSlotId: string | null;
}

function WellhubClassControl({ classId }: { classId: string }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [quota, setQuota] = useState(2);

    const { data: status, isLoading } = useQuery<WellhubClassStatus>({
        queryKey: ['wellhub-class-status', classId],
        queryFn: async () => (await api.get(`/partners/wellhub/class-status/${classId}`)).data,
    });

    useEffect(() => {
        if (status && !status.published) setQuota(status.quota || 2);
    }, [status]);

    const publishMutation = useMutation({
        mutationFn: async () => (await api.post(`/partners/wellhub/publish/${classId}`, { quota })).data,
        onSuccess: () => {
            toast({ title: 'Publicado en Wellhub', description: `Cupo: ${quota}` });
            queryClient.invalidateQueries({ queryKey: ['wellhub-class-status', classId] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error al publicar',
                description: error?.response?.data?.error || 'No se pudo publicar la clase en Wellhub',
                variant: 'destructive',
            });
        },
    });

    const unpublishMutation = useMutation({
        mutationFn: async () => (await api.post(`/partners/wellhub/unpublish/${classId}`)).data,
        onSuccess: () => {
            toast({ title: 'Despublicado de Wellhub' });
            queryClient.invalidateQueries({ queryKey: ['wellhub-class-status', classId] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error al despublicar',
                description: error?.response?.data?.error || 'No se pudo despublicar la clase',
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    }

    return (
        <div className="rounded-xl border border-balance-sand/55 bg-balance-cream/45 p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wellhub</span>
                <Switch
                    checked={!!status?.published}
                    disabled={publishMutation.isPending || unpublishMutation.isPending}
                    onCheckedChange={(checked) => {
                        if (checked) publishMutation.mutate();
                        else unpublishMutation.mutate();
                    }}
                />
            </div>
            {status?.published ? (
                <Badge variant="secondary">En Wellhub · cupo {status.booked}/{status.quota}</Badge>
            ) : (
                <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Cupo a publicar</Label>
                    <Input
                        type="number"
                        min={1}
                        value={quota}
                        onChange={(e) => setQuota(Math.max(1, Number(e.target.value) || 1))}
                        className="h-8 w-20"
                    />
                </div>
            )}
        </div>
    );
}

interface ClassesCalendarProps {
    initialGenerateOpen?: boolean;
}

export default function ClassesCalendar({ initialGenerateOpen = false }: ClassesCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [isGenerateOpen, setIsGenerateOpen] = useState(initialGenerateOpen);
    const [isBulkFreeOpen, setIsBulkFreeOpen] = useState(false);
    const [bulkFreeForm, setBulkFreeForm] = useState({
        from_date: '', to_date: '', from_time: '00:00', to_time: '23:59',
        free_label: 'Opening Day - Gratis',
        preview: null as null | number,
    });
    const [isClassOpen, setIsClassOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [attendeeChannelFilter, setAttendeeChannelFilter] = useState<AttendeeChannelFilterValue>('all');
    const [classTypeFilter, setClassTypeFilter] = useState<string>('all');
    const [wellhubClassFilter, setWellhubClassFilter] = useState<'all' | 'published' | 'not_published'>('all');
    const [studioFilter, setStudioFilter] = useState<string>('all');
    const [showCancelled, setShowCancelled] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const [isCopyOpen, setIsCopyOpen] = useState(false);
    const [copyScope, setCopyScope] = useState<string>('all');
    const latestCopyScope = useRef<string | null>('all');
    const [copyPreview, setCopyPreview] = useState<null | {
        wouldCopy: number;
        skippedExisting: number;
        skippedClosedDays: number;
        source: { start: string; end: string };
        target: { start: string; end: string };
    }>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        setWeekStart(startOfWeek(currentDate, { weekStartsOn: 0 }));
    }, [currentDate]);

    const { data: classTypes } = useQuery<ClassType[]>({
        queryKey: ['class-types'],
        queryFn: async () => (await api.get('/class-types')).data,
    });

    const { data: instructors } = useQuery<Instructor[]>({
        queryKey: ['instructors'],
        queryFn: async () => (await api.get('/instructors')).data,
    });

    const { data: facilities } = useQuery<Facility[]>({
        queryKey: ['facilities'],
        queryFn: async () => (await api.get('/facilities')).data,
    });

    const { data: attendees, isLoading: attendeesLoading, refetch: refetchAttendees } = useQuery<Attendee[]>({
        queryKey: ['attendees', selectedClass?.id],
        queryFn: async () => (await api.get(`/bookings/class/${selectedClass?.id}`)).data,
        enabled: !!selectedClass?.id && isAttendeesOpen,
    });

    const { data: userSearchResults, isFetching: userSearchLoading } = useQuery<{ users: { id: string; display_name: string; email: string; photo_url: string | null }[] }>({
        queryKey: ['user-search', userSearch],
        queryFn: async () => (await api.get(`/users?search=${encodeURIComponent(userSearch)}&limit=8`)).data,
        enabled: searchActive && userSearch.trim().length >= 2,
    });

    const adminBookMutation = useMutation({
        mutationFn: async ({ classId, userId }: { classId: string; userId: string }) =>
            api.post('/bookings/admin-book', { classId, userId }),
        onSuccess: () => {
            refetchAttendees();
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Usuario agregado a la clase' });
            setUserSearch('');
            setSearchActive(false);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const { data: classes } = useQuery<Class[]>({
        queryKey: ['classes', startStr, endStr],
        queryFn: async () => {
            const { data } = await api.get(`/classes?start=${startStr}&end=${endStr}`);
            return data;
        },
    });

    // Events overlaid on the calendar/agenda (published events).
    const { data: calendarEvents = [] } = useQuery<Array<{ id: string; title: string; date: string; startTime: string; endTime: string; location: string }>>({
        queryKey: ['calendar-events'],
        queryFn: async () => (await api.get('/events')).data,
    });

    // Closed days for visual indicator
    const { data: closedDays = [] } = useQuery<{ id: string; date: string; reason: string }[]>({
        queryKey: ['closed-days-range', startStr, endStr],
        queryFn: async () => (await api.get(`/closed-days/range?start=${startStr}&end=${endStr}`)).data,
    });
    const closedDaySet = new Set(closedDays.map(d => d.date));
    const getClosedReason = (day: Date) => closedDays.find(d => d.date === format(day, 'yyyy-MM-dd'))?.reason;

    // Mutations
    const generateMutation = useMutation({
        mutationFn: async (data: GenerateForm) => {
            return await api.post('/classes/generate', {
                startDate: format(data.startDate, 'yyyy-MM-dd'),
                endDate: format(data.endDate, 'yyyy-MM-dd'),
            });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Generacion completada', description: `${data.data.count} clases creadas.` });
            setIsGenerateOpen(false);
            setCurrentDate(variables.startDate);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    // `scope` is now a facility ID (or the 'all'/'__none__' sentinels), so we never
    // silently widen to "all rooms" because a name didn't match — that was the bug
    // where copying "Hot Room" pulled every room's classes.
    const scopeToFacility = (scope: string): { facilityId?: string | null } => {
        if (scope === 'all') return {};
        if (scope === '__none__') return { facilityId: null };
        return { facilityId: scope };
    };

    const previewCopyMutation = useMutation({
        mutationFn: async (scope: string) => {
            const res = await api.post('/classes/copy-week', {
                targetWeekStart: format(weekStart, 'yyyy-MM-dd'),
                dryRun: true,
                ...scopeToFacility(scope),
            });
            return res.data;
        },
        onSuccess: (data, scope) => {
            // Ignore a slower response for a previously selected room.
            if (latestCopyScope.current === scope) setCopyPreview(data);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const copyWeekMutation = useMutation({
        mutationFn: async (scope: string) => {
            const res = await api.post('/classes/copy-week', {
                targetWeekStart: format(weekStart, 'yyyy-MM-dd'),
                dryRun: false,
                ...scopeToFacility(scope),
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            const extra = data.skippedExisting > 0 ? ` (${data.skippedExisting} ya existían)` : '';
            toast({ title: 'Semana copiada', description: `${data.copied} clases copiadas${extra}.` });
            setIsCopyOpen(false);
            setCopyPreview(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const previewCopyScope = (scope: string) => {
        latestCopyScope.current = scope;
        setCopyScope(scope);
        setCopyPreview(null);
        previewCopyMutation.mutate(scope);
    };

    const initialCopyScope = (): string => {
        if (studioFilter === 'all') return 'all';
        if (studioFilter === 'Studio') return '__none__';

        // Calendar filters are labels, while the API deliberately accepts UUIDs.
        return facilities?.find((facility) => facility.name.trim() === studioFilter)?.id ?? 'all';
    };

    const createMutation = useMutation({
        mutationFn: async (data: ClassForm) => {
            return await api.post('/classes', {
                ...data,
                date: format(data.date, 'yyyy-MM-dd'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Clase creada', description: 'La clase se agrego al calendario.' });
            setIsClassOpen(false);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const editMutation = useMutation({
        mutationFn: async (data: EditClassForm & { id: string }) => {
            const { id, ...rest } = data;
            return await api.put(`/classes/${id}`, {
                classTypeId: rest.classTypeId,
                instructorId: rest.instructorId,
                facilityId: rest.facilityId || null,
                date: format(rest.date, 'yyyy-MM-dd'),
                startTime: rest.startTime,
                endTime: rest.endTime,
                maxCapacity: rest.maxCapacity,
                theme: rest.theme || 'none',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Clase actualizada', description: 'Los cambios se guardaron correctamente.' });
            setIsAttendeesOpen(false);
            setIsEditOpen(false);
            setSelectedClass(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const cancelMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/classes/${id}`),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            const data = response.data;
            toast({
                title: 'Clase cancelada',
                description: `${data.cancelledBookings || 0} reservas canceladas, ${data.refundedCredits || 0} creditos reembolsados.`
            });
            setIsAttendeesOpen(false);
            setSelectedClass(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const hardDeleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/classes/${id}/hard-delete`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Clase eliminada', description: 'La clase se eliminó permanentemente.' });
            setIsAttendeesOpen(false);
            setSelectedClass(null);
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const bulkDeleteCancelledMutation = useMutation({
        mutationFn: async () => api.post('/classes/delete-cancelled', { startDate: startStr, endDate: endStr }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Canceladas eliminadas', description: `${res.data.deleted} clase(s) eliminada(s) de la semana.` });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const toggleFreeMutation = useMutation({
        mutationFn: async ({ id, is_free, free_label, force }: { id: string; is_free: boolean; free_label?: string; force?: boolean }) =>
            api.patch(`/classes/${id}/free`, { is_free, free_label, force }),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            queryClient.invalidateQueries({ queryKey: ['attendees', selectedClass?.id] });
            setSelectedClass((prev) => prev ? { ...prev, is_free: vars.is_free, free_label: vars.free_label || null } : prev);
            toast({ title: vars.is_free ? 'Clase marcada como gratis' : 'Clase ya no es gratis' });
        },
        onError: (err: any) => {
            const code = err?.response?.data?.code;
            if (code === 'HAS_FREE_BOOKINGS') {
                if (confirm('Esta clase ya tiene reservas como gratis. ¿Forzar el cambio? Las reservas se mantienen pero la clase deja de aceptar nuevas como gratis.')) {
                    toggleFreeMutation.mutate({ id: selectedClass!.id, is_free: false, force: true });
                }
                return;
            }
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) });
        },
    });

    const bulkMarkFreeMutation = useMutation({
        mutationFn: async (payload: any) => api.post('/classes/bulk-mark-free', payload),
        onSuccess: (response, variables: any) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            const affected = response.data.affected ?? 0;
            if (variables.dry_run) {
                toast({ title: `${response.data.would_affect} clases serán marcadas` });
            } else {
                toast({ title: `${affected} clases marcadas como gratis` });
            }
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const checkInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return await api.post(`/bookings/${bookingId}/check-in`);
        },
        onSuccess: () => {
            refetchAttendees();
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Check-in realizado', description: 'Asistencia registrada.' });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const uncheckInMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return await api.post(`/bookings/${bookingId}/uncheck-in`);
        },
        onSuccess: () => {
            refetchAttendees();
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Check-in deshecho', description: 'La reserva volvió a estado confirmado.' });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const cancelBookingMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return await api.post(`/bookings/${bookingId}/cancel`);
        },
        onSuccess: () => {
            refetchAttendees();
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({ title: 'Reserva cancelada', description: 'Crédito devuelto si aplicaba.' });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    // Forms
    // Calculate next full week (Sunday to Saturday)
    const nextSunday = startOfWeek(addDays(new Date(), 7), { weekStartsOn: 0 });
    const nextSaturday = addDays(nextSunday, 6);

    const generateForm = useForm<GenerateForm>({
        resolver: zodResolver(generateSchema),
        defaultValues: {
            startDate: nextSunday,
            endDate: nextSaturday
        }
    });

    const classForm = useForm<ClassForm>({
        resolver: zodResolver(classSchema),
        defaultValues: { maxCapacity: 6 }
    });

    const editForm = useForm<EditClassForm>({
        resolver: zodResolver(editClassSchema),
    });

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = (day: Date) => {
        classForm.reset({ date: day, maxCapacity: 6, startTime: '09:00', endTime: '10:00', theme: 'none' });
        setIsClassOpen(true);
    };

    const handleClassClick = (c: Class) => {
        setAttendeeChannelFilter('all');
        setSelectedClass(c);
        setIsAttendeesOpen(true);
    };

    const handleEditClass = () => {
        if (!selectedClass) return;
        editForm.reset({
            classTypeId: selectedClass.class_type_id || '',
            instructorId: selectedClass.instructor_id || '',
            facilityId: selectedClass.facility_id || undefined,
            date: parseISO((selectedClass.date || '').split('T')[0] + 'T00:00:00'),
            startTime: selectedClass.start_time,
            endTime: selectedClass.end_time,
            maxCapacity: selectedClass.max_capacity,
            theme: selectedClass.theme || 'none',
        });
        setIsEditOpen(true);
    };

    const getClassesForDay = (day: Date) => {
        return classes?.filter(c => {
            const dateStr = (c.date || '').split('T')[0];
            const dateMatch = isSameDay(parseISO(dateStr + 'T00:00:00'), day);
            const typeMatch = classTypeFilter === 'all' || c.class_type_id === classTypeFilter;
            const studioMatch = studioFilter === 'all' || (c.facility_name?.trim() || 'Studio') === studioFilter;
            const cancelledMatch = showCancelled || c.status !== 'cancelled';
            const wellhubMatch =
                wellhubClassFilter === 'all' ||
                (wellhubClassFilter === 'published' && c.wellhub_published) ||
                (wellhubClassFilter === 'not_published' && !c.wellhub_published);
            return dateMatch && typeMatch && studioMatch && cancelledMatch && wellhubMatch;
        }) || [];
    };

    const getEventsForDay = (day: Date) => {
        return (calendarEvents || []).filter((e) => {
            const dateStr = (e.date || '').split('T')[0];
            if (!dateStr) return false;
            return isSameDay(parseISO(dateStr + 'T00:00:00'), day);
        });
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    };

    const confirmedCount = attendees?.filter(a => a.status === 'confirmed' || a.status === 'checked_in').length || 0;
    const checkedInCount = attendees?.filter(a => a.status === 'checked_in').length || 0;
    const wellhubAttendeeCount = attendees?.filter((attendee) => attendee.channel === 'wellhub').length || 0;
    const balanceAttendeeCount = (attendees?.length || 0) - wellhubAttendeeCount;
    const filteredAttendees = attendees?.filter((attendee) => {
        if (attendeeChannelFilter === 'wellhub') return attendee.channel === 'wellhub';
        if (attendeeChannelFilter === 'balance') return attendee.channel !== 'wellhub';
        return true;
    }) || [];

    const bulkDeleteMutation = useMutation({
        mutationFn: async () => {
            return await api.post('/classes/bulk-delete', {
                startDate: startStr,
                endDate: endStr
            });
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast({
                title: 'Calendario limpiado',
                description: res.data.message
            });
        },
        onError: (err) => toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(err) }),
    });

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const activeClasses = classes?.filter((c) => c.status !== 'cancelled') || [];
    const wellhubPublishedClassCount = activeClasses.filter((c) => c.wellhub_published).length;
    const notPublishedClassCount = activeClasses.length - wellhubPublishedClassCount;

    const studioBreakdown = useMemo(() => {
        const PREFERRED = ['Wunda', 'Barre', 'Hot Room'];
        const counts = new Map<string, number>();
        // Seed preferred studios so the 3 always render (even with 0).
        for (const name of PREFERRED) counts.set(name, 0);
        for (const c of activeClasses) {
            const name = c.facility_name?.trim() || 'Studio';
            counts.set(name, (counts.get(name) || 0) + 1);
        }
        const others = [...counts.keys()]
            .filter((n) => !PREFERRED.includes(n))
            .sort((a, b) => a.localeCompare(b));
        return [...PREFERRED, ...others].map((name) => ({ name, count: counts.get(name) || 0 }));
    }, [activeClasses]);

    const totalBookings = activeClasses.reduce((sum, c) => sum + Number(c.current_bookings || 0), 0);
    const totalCapacity = activeClasses.reduce((sum, c) => sum + Number(c.max_capacity || 0), 0);
    const openSpots = Math.max(totalCapacity - totalBookings, 0);
    const weekRange = `${format(weekStart, 'd MMM', { locale: es })} al ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: es })}`;
    const occupancy = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <div className="space-y-5">
                    <section className="overflow-hidden rounded-[2rem] border border-balance-olive/25 bg-balance-olive/10 shadow-[0_22px_72px_-58px_rgba(51,42,34,0.75)]">
                        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-end lg:justify-between">
                            <div className="min-w-0">
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-balance-olive/25 bg-balance-cream/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Semana activa
                                </div>
                                <h1 className="text-3xl font-semibold capitalize tracking-[-0.04em] text-balance-dark">
                                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                                </h1>
                                <p className="mt-1 text-sm text-balance-dark/62">{weekRange}</p>
                            </div>

                            <div className="space-y-3 lg:min-w-[29rem]">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <CalendarStat label="Clases" value={activeClasses.length} />
                                    <CalendarStat label="Reservas" value={totalBookings} />
                                    <CalendarStat label="Cupos libres" value={openSpots} />
                                </div>
                                <div className="rounded-[1.15rem] border border-balance-olive/16 bg-balance-cream/45 px-4 py-3">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-balance-dark/48">
                                            Clases por estudio
                                        </p>
                                        {studioFilter !== 'all' && (
                                            <button
                                                type="button"
                                                onClick={() => setStudioFilter('all')}
                                                className="text-[11px] font-semibold text-balance-olive underline-offset-2 hover:underline"
                                            >
                                                Ver todos
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-3">
                                        {studioBreakdown.map((s) => {
                                            const isActive = studioFilter === s.name;
                                            return (
                                                <button
                                                    type="button"
                                                    key={s.name}
                                                    onClick={() => setStudioFilter(isActive ? 'all' : s.name)}
                                                    aria-pressed={isActive}
                                                    className={`flex items-center justify-between gap-2 rounded-[0.9rem] border px-3 py-2 text-left transition-colors ${
                                                        isActive
                                                            ? 'border-balance-olive/60 bg-balance-olive/15'
                                                            : 'border-balance-olive/14 bg-balance-cream/60 hover:border-balance-olive/30 hover:bg-balance-cream/80'
                                                    }`}
                                                >
                                                    <span className="truncate text-xs font-semibold text-balance-dark/65">{s.name}</span>
                                                    <span className="text-base font-semibold tabular-nums tracking-[-0.03em] text-balance-dark">{s.count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-balance-olive/18 bg-balance-cream/36 p-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center overflow-hidden rounded-full border border-balance-sand/65 bg-balance-cream/75">
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handlePrevWeek}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" className="rounded-full px-4 font-semibold" onClick={handleToday}>
                                        Hoy
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleNextWeek}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Badge variant="outline" className="rounded-full border-balance-olive/30 bg-balance-olive/10 px-3 py-1 text-balance-olive">
                                    {occupancy}% ocupación
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => {
                                        if (confirm('¿Borrar todas las clases vacías de esta semana visible?')) {
                                            bulkDeleteMutation.mutate();
                                        }
                                    }}
                                    disabled={bulkDeleteMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {bulkDeleteMutation.isPending ? 'Borrando...' : 'Limpiar semana'}
                                </Button>

                                <Button variant="outline" className="border-balance-sand/70 bg-balance-cream/70" onClick={() => setIsGenerateOpen(true)}>
                                    <Repeat className="mr-2 h-4 w-4" /> Generar semana
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-balance-sand/70 bg-balance-cream/70"
                                    onClick={() => {
                                        const initial = initialCopyScope();
                                        setIsCopyOpen(true);
                                        previewCopyScope(initial);
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" /> Copiar semana anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    className={cn('border-balance-sand/70 bg-balance-cream/70', showCancelled && 'border-destructive/40 bg-destructive/10 text-destructive')}
                                    onClick={() => setShowCancelled(v => !v)}
                                >
                                    {showCancelled ? 'Ocultar canceladas' : 'Ver canceladas'}
                                </Button>
                                {showCancelled && (
                                    <Button
                                        variant="outline"
                                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => { if (confirm('¿Eliminar todas las clases canceladas (sin reservas) de esta semana?')) bulkDeleteCancelledMutation.mutate(); }}
                                        disabled={bulkDeleteCancelledMutation.isPending}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {bulkDeleteCancelledMutation.isPending ? 'Eliminando...' : 'Eliminar canceladas'}
                                    </Button>
                                )}
                                <Button variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => setIsBulkFreeOpen(true)}>
                                    <Sparkles className="mr-2 h-4 w-4" /> Marcar como gratis
                                </Button>
                                <Button className="bg-balance-olive text-balance-cream hover:bg-balance-olive/90" onClick={() => handleDayClick(new Date())}>
                                    <Plus className="mr-2 h-4 w-4" /> Nueva clase
                                </Button>
                            </div>
                        </div>
                    </section>

                    {classTypes && classTypes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 px-1">
                            <button
                                type="button"
                                onClick={() => setClassTypeFilter('all')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    classTypeFilter === 'all'
                                        ? 'border-balance-olive bg-balance-olive text-balance-cream'
                                        : 'border-balance-sand/65 bg-balance-cream/75 text-balance-dark/65 hover:border-balance-olive/40 hover:text-balance-olive'
                                )}
                            >
                                Todas
                            </button>
                            {classTypes.map(ct => (
                                <button
                                    key={ct.id}
                                    type="button"
                                    onClick={() => setClassTypeFilter(classTypeFilter === ct.id ? 'all' : ct.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                        classTypeFilter === ct.id
                                            ? 'text-white'
                                            : 'border-balance-sand/65 bg-balance-cream/75 text-balance-dark/65 hover:border-balance-olive/40 hover:text-balance-olive'
                                    )}
                                    style={classTypeFilter === ct.id ? {
                                        backgroundColor: ct.color || '#7E8579',
                                        borderColor: ct.color || '#7E8579',
                                    } : {}}
                                >
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: ct.color || '#7E8579' }}
                                    />
                                    {ct.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2 px-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-balance-dark/48">
                            Publicación en Wellhub
                        </p>
                        <div
                            aria-label="Filtrar clases por publicación en Wellhub"
                            className="flex flex-wrap items-center gap-2"
                            role="group"
                        >
                            <button
                                type="button"
                                aria-pressed={wellhubClassFilter === 'all'}
                                onClick={() => setWellhubClassFilter('all')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    wellhubClassFilter === 'all'
                                        ? 'border-balance-olive bg-balance-olive text-balance-cream'
                                        : 'border-balance-sand/65 bg-balance-cream/75 text-balance-dark/65 hover:border-balance-olive/40'
                                )}
                            >
                                Todas <span className="ml-1 tabular-nums">{activeClasses.length}</span>
                            </button>
                            <button
                                type="button"
                                aria-pressed={wellhubClassFilter === 'published'}
                                onClick={() => setWellhubClassFilter('published')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    wellhubClassFilter === 'published'
                                        ? 'border-[#A8C900] bg-[#D7FE51] text-[#243000]'
                                        : 'border-[#A8C900]/60 bg-[#D7FE51]/25 text-[#526300] hover:bg-[#D7FE51]/45'
                                )}
                            >
                                En Wellhub <span className="ml-1 tabular-nums">{wellhubPublishedClassCount}</span>
                            </button>
                            <button
                                type="button"
                                aria-pressed={wellhubClassFilter === 'not_published'}
                                onClick={() => setWellhubClassFilter('not_published')}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    wellhubClassFilter === 'not_published'
                                        ? 'border-balance-dark bg-balance-dark text-white'
                                        : 'border-balance-sand/65 bg-balance-cream/75 text-balance-dark/65 hover:border-balance-dark/35'
                                )}
                            >
                                Fuera de Wellhub <span className="ml-1 tabular-nums">{notPublishedClassCount}</span>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.75rem] border border-balance-sand/65 bg-[hsl(var(--admin-panel))] shadow-[0_22px_72px_-58px_rgba(51,42,34,0.75)]">
                        <div className="overflow-x-auto">
                            <div className="min-w-[980px]">
                                <div className="grid grid-cols-7 border-b border-balance-sand/60 bg-balance-cream/55">
                                    {weekDays.map((day, i) => {
                                        const isToday = isSameDay(day, new Date());
                                        const isClosed = closedDaySet.has(format(day, 'yyyy-MM-dd'));
                                        const dayClasses = getClassesForDay(day);
                                        return (
                                            <button
                                                key={format(day, 'yyyy-MM-dd')}
                                                type="button"
                                                onClick={() => handleDayClick(day)}
                                                className={cn(
                                                    'min-h-[6.75rem] border-r border-balance-sand/55 p-4 text-left transition-colors last:border-r-0 hover:bg-balance-olive/8',
                                                    isToday && 'bg-balance-olive/12',
                                                    isClosed && 'bg-destructive/5'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-balance-dark/50">{DAYS[i]}</p>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className={cn(
                                                                'flex h-10 w-10 items-center justify-center rounded-full text-xl font-semibold tabular-nums text-balance-dark',
                                                                isToday && 'bg-balance-olive text-balance-cream'
                                                            )}>
                                                                {format(day, 'd')}
                                                            </span>
                                                            {isClosed && (
                                                                <Badge variant="destructive" className="rounded-full text-[10px]">Cerrado</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="rounded-full bg-balance-cream px-2.5 py-1 text-[11px] font-semibold text-balance-dark/58">
                                                        {dayClasses.length} clase{dayClasses.length === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-7">
                                    {weekDays.map((day) => {
                                        const dayClasses = getClassesForDay(day);
                                        const dayEvents = getEventsForDay(day);
                                        const isClosed = closedDaySet.has(format(day, 'yyyy-MM-dd'));
                                        const closedReason = getClosedReason(day);
                                        return (
                                            <div
                                                key={format(day, 'yyyy-MM-dd')}
                                                className={cn(
                                                    'min-h-[34rem] border-r border-balance-sand/55 bg-balance-cream/18 p-3 last:border-r-0',
                                                    isClosed && 'bg-destructive/5'
                                                )}
                                            >
                                                {isClosed && (
                                                    <div className="mb-3 rounded-[1rem] border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                                                        {closedReason || 'Studio cerrado'}
                                                    </div>
                                                )}

                                                <div className="space-y-2.5">
                                                    {dayEvents.map(ev => (
                                                        <Link
                                                            key={ev.id}
                                                            to="/admin/events"
                                                            className="block rounded-[1.1rem] border border-balance-gold/45 bg-balance-gold/12 p-2.5 text-left transition-colors hover:bg-balance-gold/20"
                                                        >
                                                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-balance-gold">
                                                                <Sparkles className="h-3 w-3" /> Evento
                                                            </div>
                                                            <div className="mt-0.5 truncate text-sm font-semibold text-balance-dark">{ev.title}</div>
                                                            <div className="text-xs text-balance-dark/60">
                                                                {(ev.startTime || '').slice(0, 5)}{ev.endTime ? `–${ev.endTime.slice(0, 5)}` : ''}
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    {dayClasses.map(c => (
                                                        <ClassEventCard key={c.id} item={c} onClick={() => handleClassClick(c)} />
                                                    ))}
                                                </div>

                                                {dayClasses.length === 0 && dayEvents.length === 0 && !isClosed && (
                                                    <button
                                                        type="button"
                                                        className="mt-2 flex min-h-[10rem] w-full flex-col items-center justify-center rounded-[1.1rem] border border-dashed border-balance-sand/70 bg-balance-cream/35 text-center text-balance-dark/48 transition-colors hover:border-balance-olive/40 hover:bg-balance-olive/8 hover:text-balance-olive"
                                                        onClick={() => handleDayClick(day)}
                                                    >
                                                        <Plus className="mb-2 h-4 w-4" />
                                                        <span className="text-xs font-semibold">Agregar clase</span>
                                                    </button>
                                                )}

                                                {(dayClasses.length > 0 || dayEvents.length > 0) && (
                                                    <Button
                                                        variant="ghost"
                                                        className="mt-3 h-9 w-full rounded-full border border-dashed border-balance-sand/65 text-xs text-balance-dark/55 hover:border-balance-olive/40 hover:bg-balance-olive/8 hover:text-balance-olive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDayClick(day);
                                                        }}
                                                    >
                                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                                        Agregar
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendees Sheet */}
                    <Sheet open={isAttendeesOpen && !!selectedClass} onOpenChange={(open) => { setIsAttendeesOpen(open); if (!open) setSelectedClass(null); }}>
                        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    {selectedClass?.class_type_name}
                                    {selectedClass?.status === 'cancelled' && (
                                        <Badge variant="destructive">Cancelada</Badge>
                                    )}
                                </SheetTitle>
                                <SheetDescription>
                                    {selectedClass && format(parseISO((selectedClass.date || '').split('T')[0] + 'T00:00:00'), 'EEEE d MMMM', { locale: es })} - {selectedClass?.start_time?.slice(0,5)} a {selectedClass?.end_time?.slice(0,5)}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="mt-6 space-y-6">
                                {/* Class Info */}
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Instructor</p>
                                        <p className="font-medium">{selectedClass?.instructor_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Capacidad</p>
                                        <p className="font-medium">{selectedClass?.current_bookings}/{selectedClass?.max_capacity}</p>
                                    </div>
                                </div>

                                {selectedClass?.status !== 'cancelled' && selectedClass?.id && (
                                    <WellhubClassControl classId={selectedClass.id} />
                                )}

                                {/* Actions */}
                                {selectedClass?.status !== 'cancelled' && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={handleEditClass}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() => {
                                                if (confirm('¿Cancelar esta clase? Se cancelaran todas las reservas y se reembolsaran los creditos.')) {
                                                    cancelMutation.mutate(selectedClass.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Cancelar Clase
                                        </Button>
                                    </div>
                                )}

                                {/* Hard-delete for already-cancelled classes */}
                                {selectedClass?.status === 'cancelled' && (
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        disabled={hardDeleteMutation.isPending}
                                        onClick={() => {
                                            if (selectedClass && confirm('¿Eliminar esta clase permanentemente? Esta acción no se puede deshacer.')) {
                                                hardDeleteMutation.mutate(selectedClass.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> {hardDeleteMutation.isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
                                    </Button>
                                )}

                                {/* Free class toggle */}
                                {selectedClass?.status !== 'cancelled' && (
                                    <div className={`rounded-xl border p-3 ${selectedClass?.is_free ? 'border-emerald-300 bg-emerald-50' : 'border-balance-sand/55 bg-balance-cream/45'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-semibold">Clase gratis</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Sin cobro, sin descontar crédito. Usuarios sin paquete pueden reservar.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={!!selectedClass?.is_free}
                                                onCheckedChange={(v) => {
                                                    if (!selectedClass) return;
                                                    toggleFreeMutation.mutate({
                                                        id: selectedClass.id,
                                                        is_free: v,
                                                        free_label: v ? (selectedClass.free_label || 'Clase gratis') : undefined,
                                                    });
                                                }}
                                                disabled={toggleFreeMutation.isPending}
                                            />
                                        </div>
                                        {selectedClass?.is_free && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <Input
                                                    placeholder="Etiqueta visible (ej. Opening Day)"
                                                    defaultValue={selectedClass.free_label || ''}
                                                    onBlur={(e) => {
                                                        const v = e.target.value.trim() || 'Clase gratis';
                                                        if (v !== selectedClass.free_label) {
                                                            toggleFreeMutation.mutate({
                                                                id: selectedClass.id,
                                                                is_free: true,
                                                                free_label: v,
                                                            });
                                                        }
                                                    }}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attendees Stats */}
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-info" />
                                        <span>Confirmados: {confirmedCount}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-success" />
                                        <span>Check-in: {checkedInCount}</span>
                                    </div>
                                </div>

                                {/* Add user to class */}
                                {selectedClass?.status !== 'cancelled' && (
                                    <div className="rounded-xl border border-balance-sand/55 bg-balance-cream/45 p-3 space-y-2">
                                        <p className="text-sm font-semibold">Agregar usuario a la clase</p>
                                        <div className="relative">
                                            <Input
                                                placeholder="Buscar por nombre o email..."
                                                value={userSearch}
                                                onChange={(e) => {
                                                    setUserSearch(e.target.value);
                                                    setSearchActive(true);
                                                }}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        {searchActive && userSearch.trim().length >= 2 && (
                                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                                {userSearchLoading && (
                                                    <div className="flex justify-center py-3">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                )}
                                                {!userSearchLoading && userSearchResults?.users?.length === 0 && (
                                                    <p className="py-2 text-center text-xs text-muted-foreground">Sin resultados</p>
                                                )}
                                                {userSearchResults?.users?.map(u => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        disabled={adminBookMutation.isPending}
                                                        onClick={() => {
                                                            if (!selectedClass) return;
                                                            adminBookMutation.mutate({ classId: selectedClass.id, userId: u.id });
                                                        }}
                                                        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs hover:border-balance-olive/30 hover:bg-balance-olive/8 disabled:opacity-50"
                                                    >
                                                        <Avatar className="h-6 w-6 shrink-0">
                                                            <AvatarImage src={u.photo_url || undefined} />
                                                            <AvatarFallback className="text-[9px]">{getInitials(u.display_name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{u.display_name}</p>
                                                            <p className="text-muted-foreground truncate">{u.email}</p>
                                                        </div>
                                                        {adminBookMutation.isPending ? (
                                                            <Loader2 className="ml-auto h-3 w-3 animate-spin shrink-0" />
                                                        ) : (
                                                            <Plus className="ml-auto h-3 w-3 shrink-0 text-balance-olive opacity-0 group-hover:opacity-100" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attendees List */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold">Asistentes</h3>
                                    {!attendeesLoading && !!attendees?.length && (
                                        <AttendeeChannelFilter
                                            value={attendeeChannelFilter}
                                            onValueChange={setAttendeeChannelFilter}
                                            totalCount={attendees.length}
                                            wellhubCount={wellhubAttendeeCount}
                                            balanceCount={balanceAttendeeCount}
                                        />
                                    )}
                                    {attendeesLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : attendees?.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No hay reservas para esta clase.
                                        </div>
                                    ) : filteredAttendees.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            No hay reservas de este origen.
                                        </div>
                                    ) : (
                                        filteredAttendees.map((attendee) => (
                                            <div
                                                key={attendee.booking_id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 border rounded-lg",
                                                    attendee.status === 'checked_in' && "bg-success/10 border-success/30"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Link to={`/admin/members/${attendee.user_id}`}>
                                                        <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-shadow">
                                                            <AvatarImage src={attendee.photo_url || undefined} />
                                                            <AvatarFallback>{getInitials(attendee.display_name)}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                    <div>
                                                        <p className="font-medium">{attendee.display_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {attendee.channel === 'wellhub' ? (
                                                                <WellhubBadge />
                                                            ) : attendee.plan_name && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {attendee.plan_name}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" /> {attendee.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    {attendee.status === 'checked_in' ? (
                                                        <>
                                                            <Badge className="bg-success">
                                                                <Check className="h-3 w-3 mr-1" /> Check-in
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    if (confirm('¿Deshacer el check-in? La reserva volverá a estado confirmado.')) {
                                                                        uncheckInMutation.mutate(attendee.booking_id);
                                                                    }
                                                                }}
                                                                disabled={uncheckInMutation.isPending}
                                                            >
                                                                Deshacer
                                                            </Button>
                                                        </>
                                                    ) : attendee.status === 'confirmed' ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => checkInMutation.mutate(attendee.booking_id)}
                                                                disabled={checkInMutation.isPending}
                                                            >
                                                                {checkInMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Check className="h-4 w-4 mr-1" /> Check-in
                                                                    </>
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    if (confirm('¿Cancelar la reserva del cliente? Se devolverá su crédito si aplica.')) {
                                                                        cancelBookingMutation.mutate(attendee.booking_id);
                                                                    }
                                                                }}
                                                                disabled={cancelBookingMutation.isPending}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Badge variant="secondary">{attendee.status}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Generate Dialog */}
                    <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generar Clases</DialogTitle>
                                <DialogDescription>
                                    Crea clases masivamente usando la Plantilla Semanal.
                                    Las clases existentes no se duplicaran.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={generateForm.handleSubmit(d => generateMutation.mutate(d))} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fecha Inicio</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(generateForm.watch('startDate'), 'P', { locale: es })}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={generateForm.watch('startDate')}
                                                    onSelect={(d) => d && generateForm.setValue('startDate', d)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fecha Fin</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {format(generateForm.watch('endDate'), 'P', { locale: es })}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={generateForm.watch('endDate')}
                                                    onSelect={(d) => d && generateForm.setValue('endDate', d)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsGenerateOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={generateMutation.isPending}>
                                        {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generar
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Copy Previous Week Dialog */}
                    <Dialog open={isCopyOpen} onOpenChange={(open) => {
                        setIsCopyOpen(open);
                        if (!open) {
                            latestCopyScope.current = null;
                            setCopyPreview(null);
                        }
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Copiar semana anterior</DialogTitle>
                                <DialogDescription>
                                    Copia las clases de la semana anterior a la semana visible (mismos días y horas). Elige qué sala copiar.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 py-2">
                                <div className="space-y-1.5">
                                    <Label>Sala</Label>
                                    <Select
                                        value={copyScope}
                                        onValueChange={previewCopyScope}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las salas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las salas</SelectItem>
                                            <SelectItem value="__none__">Studio (sin sala)</SelectItem>
                                            {facilities?.map((f) => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="rounded-lg border border-balance-olive/20 bg-balance-cream/40 px-3 py-2 text-sm text-balance-dark/80">
                                    {previewCopyMutation.isPending ? (
                                        'Calculando…'
                                    ) : copyPreview && copyPreview.wouldCopy > 0 ? (
                                        <>
                                            Se copiarán <strong>{copyPreview.wouldCopy}</strong> clases de la semana del{' '}
                                            {copyPreview.source.start} a la del {copyPreview.target.start}
                                            {copyPreview.skippedExisting > 0 && ` · ${copyPreview.skippedExisting} ya existen (se omiten)`}
                                            {copyPreview.skippedClosedDays > 0 && ` · ${copyPreview.skippedClosedDays} en días cerrados`}.
                                        </>
                                    ) : copyPreview ? (
                                        'No hay clases en la semana anterior para esta sala.'
                                    ) : (
                                        'Selecciona una sala para ver el conteo.'
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCopyOpen(false)}>Cancelar</Button>
                                <Button
                                    className="bg-balance-olive text-balance-cream hover:bg-balance-olive/90"
                                    onClick={() => copyWeekMutation.mutate(copyScope)}
                                    disabled={copyWeekMutation.isPending || previewCopyMutation.isPending || !copyPreview || copyPreview.wouldCopy === 0}
                                >
                                    {copyWeekMutation.isPending ? 'Copiando...' : 'Copiar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Class Dialog */}
                    <Dialog open={isClassOpen} onOpenChange={setIsClassOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nueva Clase</DialogTitle>
                                <DialogDescription>Agrega una clase individual al calendario.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={classForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {classForm.watch('date') ? format(classForm.watch('date'), 'P', { locale: es }) : 'Seleccionar'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={classForm.watch('date')}
                                                onSelect={(d) => d && classForm.setValue('date', d)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Clase</Label>
                                    <Select onValueChange={(val) => classForm.setValue('classTypeId', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classTypes?.map(ct => (
                                                <SelectItem key={ct.id} value={ct.id}>
                                                    {ct.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Instructor</Label>
                                    <Select onValueChange={(val) => classForm.setValue('instructorId', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar instructor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructors?.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.display_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Sala</Label>
                                    <Select onValueChange={(val) => classForm.setValue('facilityId', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar sala (opcional)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {facilities?.map(f => (
                                                <SelectItem key={f.id} value={f.id}>
                                                    {f.name} ({f.capacity} lugares)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Inicio</Label>
                                        <Input type="time" {...classForm.register('startTime')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fin</Label>
                                        <Input type="time" {...classForm.register('endTime')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Capacidad</Label>
                                    <Input type="number" {...classForm.register('maxCapacity')} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tema (opcional)</Label>
                                    <Select value={classForm.watch('theme') || 'none'} onValueChange={(val) => classForm.setValue('theme', val)}>
                                        <SelectTrigger><SelectValue placeholder="Sin tema" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin tema</SelectItem>
                                            <SelectItem value="mexico">🇲🇽 Tricolor (Patrias)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsClassOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Crear Clase
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Class Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Clase</DialogTitle>
                                <DialogDescription>Modifica los detalles de la clase.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={editForm.handleSubmit(d => selectedClass && editMutation.mutate({ ...d, id: selectedClass.id }))} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editForm.watch('date') ? format(editForm.watch('date'), 'P', { locale: es }) : 'Seleccionar'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={editForm.watch('date')}
                                                onSelect={(d) => d && editForm.setValue('date', d)}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Clase</Label>
                                    <Select
                                        value={editForm.watch('classTypeId')}
                                        onValueChange={(val) => editForm.setValue('classTypeId', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classTypes?.map(ct => (
                                                <SelectItem key={ct.id} value={ct.id}>
                                                    {ct.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Instructor</Label>
                                    <Select
                                        value={editForm.watch('instructorId')}
                                        onValueChange={(val) => editForm.setValue('instructorId', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar instructor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructors?.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.display_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Sala</Label>
                                    <Select
                                        value={editForm.watch('facilityId') || ''}
                                        onValueChange={(val) => editForm.setValue('facilityId', val || undefined)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar sala (opcional)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {facilities?.map(f => (
                                                <SelectItem key={f.id} value={f.id}>
                                                    {f.name} ({f.capacity} lugares)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Inicio</Label>
                                        <Input type="time" {...editForm.register('startTime')} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fin</Label>
                                        <Input type="time" {...editForm.register('endTime')} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Capacidad</Label>
                                    <Input type="number" {...editForm.register('maxCapacity')} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tema (opcional)</Label>
                                    <Select value={editForm.watch('theme') || 'none'} onValueChange={(val) => editForm.setValue('theme', val)}>
                                        <SelectTrigger><SelectValue placeholder="Sin tema" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin tema</SelectItem>
                                            <SelectItem value="mexico">🇲🇽 Tricolor (Patrias)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={editMutation.isPending}>
                                        {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Bulk mark free dialog */}
                    <Dialog open={isBulkFreeOpen} onOpenChange={setIsBulkFreeOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-emerald-600" />
                                    Marcar clases como gratis
                                </DialogTitle>
                                <DialogDescription>
                                    Útil para opening day o cortesías. Las clases en el rango quedan sin cobro y permiten reservar sin paquete.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Desde fecha</Label>
                                        <Input
                                            type="date"
                                            value={bulkFreeForm.from_date}
                                            onChange={(e) => setBulkFreeForm(p => ({ ...p, from_date: e.target.value, preview: null }))}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Hasta fecha</Label>
                                        <Input
                                            type="date"
                                            value={bulkFreeForm.to_date}
                                            onChange={(e) => setBulkFreeForm(p => ({ ...p, to_date: e.target.value, preview: null }))}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-balance-sand/55 bg-balance-cream/40 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Filtro de horario de clase</Label>
                                        <button
                                            type="button"
                                            className="text-[11px] font-semibold text-emerald-700 underline underline-offset-2"
                                            onClick={() => setBulkFreeForm(p => ({ ...p, from_time: '00:00', to_time: '23:59', preview: null }))}
                                        >
                                            Todo el día
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-balance-dark/55">Solo las clases cuyo horario de inicio esté dentro de este rango quedarán gratis.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Clase empieza desde</Label>
                                            <Input
                                                type="time"
                                                value={bulkFreeForm.from_time}
                                                onChange={(e) => setBulkFreeForm(p => ({ ...p, from_time: e.target.value, preview: null }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Clase empieza hasta</Label>
                                            <Input
                                                type="time"
                                                value={bulkFreeForm.to_time}
                                                onChange={(e) => setBulkFreeForm(p => ({ ...p, to_time: e.target.value, preview: null }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Etiqueta visible</Label>
                                    <Input
                                        value={bulkFreeForm.free_label}
                                        onChange={(e) => setBulkFreeForm(p => ({ ...p, free_label: e.target.value }))}
                                        placeholder="Ej. Opening Day"
                                    />
                                </div>
                                {bulkFreeForm.preview !== null && (
                                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                                        <strong>{bulkFreeForm.preview}</strong> clase{bulkFreeForm.preview === 1 ? '' : 's'} {bulkFreeForm.preview === 1 ? 'será marcada' : 'serán marcadas'} como gratis.
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBulkFreeOpen(false)}>Cancelar</Button>
                                {bulkFreeForm.preview === null ? (
                                    <Button
                                        onClick={async () => {
                                            if (!bulkFreeForm.from_date || !bulkFreeForm.to_date) {
                                                toast({ variant: 'destructive', title: 'Falta fecha' });
                                                return;
                                            }
                                            const res = await api.post('/classes/bulk-mark-free', {
                                                ...bulkFreeForm, dry_run: true,
                                            });
                                            setBulkFreeForm(p => ({ ...p, preview: res.data.would_affect ?? 0 }));
                                        }}
                                    >
                                        Ver preview
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() => {
                                            bulkMarkFreeMutation.mutate({ ...bulkFreeForm, dry_run: false });
                                            setIsBulkFreeOpen(false);
                                            setBulkFreeForm(p => ({ ...p, preview: null }));
                                        }}
                                        disabled={bulkMarkFreeMutation.isPending}
                                    >
                                        Confirmar y marcar {bulkFreeForm.preview} clase{bulkFreeForm.preview === 1 ? '' : 's'}
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AdminLayout>
        </AuthGuard>
    );
}

function CalendarStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-[1.15rem] border border-balance-olive/16 bg-balance-cream/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-balance-dark/48">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-balance-dark">{value}</p>
        </div>
    );
}

function ClassEventCard({ item, onClick }: { item: Class; onClick: () => void }) {
    const baseColor = item.class_type_color || '#7E8579';
    const isFree = !!item.is_free;
    const isMexico = (item.theme || 'none') === 'mexico';
    const color = isFree ? '#16a34a' : baseColor;
    const bookings = Number(item.current_bookings || 0);
    const capacity = Number(item.max_capacity || 0);
    const ratio = capacity > 0 ? Math.min((bookings / capacity) * 100, 100) : 0;
    const isCancelled = item.status === 'cancelled';

    const borderColor = isMexico ? '#006847' : (isFree ? '#86efac' : `${color}66`);
    const background = isMexico
        ? 'linear-gradient(180deg, rgba(0,104,71,0.18) 0%, rgba(255,255,255,0.92) 50%, rgba(206,17,38,0.18) 100%)'
        : isFree
            ? 'linear-gradient(180deg, #dcfce7 0%, #f0fdf4cc 100%)'
            : `linear-gradient(180deg, ${color}1F 0%, rgba(243,238,226,0.68) 100%)`;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group w-full rounded-[1.1rem] border p-3 text-left shadow-[0_14px_42px_-34px_rgba(51,42,34,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_52px_-36px_rgba(51,42,34,0.82)]',
                isCancelled && 'opacity-55'
            )}
            style={{ borderColor, background }}
        >
            {isMexico && (
                <div
                    className="-mx-3 -mt-3 mb-2 h-2.5 rounded-t-[1.05rem]"
                    style={{ background: 'linear-gradient(90deg, #006847 0 33.3%, #ffffff 33.3% 66.6%, #CE1126 66.6% 100%)' }}
                />
            )}
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-sm font-semibold text-balance-dark">{formatClassTime(item.start_time)}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {item.wellhub_published && (
                        <span
                            className="rounded-full border border-[#A8C900] bg-[#D7FE51] px-2 py-0.5 text-[10px] font-bold text-[#243000] shadow-sm"
                            title={`Publicada en Wellhub · cupo ${Number(item.wellhub_booked || 0)}/${Number(item.wellhub_quota || 0)}`}
                        >
                            Wellhub
                        </span>
                    )}
                    {isMexico && (
                        <span className="rounded-full bg-balance-cream/80 px-2 py-0.5 text-[10px] font-bold tracking-wide" title="Clase temática">
                            🇲🇽
                        </span>
                    )}
                    {isFree && (
                        <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Gratis
                        </span>
                    )}
                    {isCancelled ? (
                        <Badge variant="destructive" className="rounded-full text-[10px]">Cancelada</Badge>
                    ) : (
                        <span className="rounded-full bg-balance-cream/75 px-2 py-0.5 text-[10px] font-semibold text-balance-dark/55">
                            {bookings}/{capacity}
                        </span>
                    )}
                </div>
            </div>

            <p className="mt-2 truncate text-sm font-semibold leading-5 text-balance-dark">{item.class_type_name}</p>
            <div className="mt-2 space-y-1.5 text-[11px] text-balance-dark/56">
                <p className="flex min-w-0 items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.instructor_name || 'Coach por asignar'}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.facility_name || 'Studio'}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatClassTime(item.start_time)} a {formatClassTime(item.end_time)}</span>
                </p>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-balance-dark/10">
                <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${ratio}%`, backgroundColor: color }}
                />
            </div>
        </button>
    );
}

function formatClassTime(value?: string) {
    return value?.slice(0, 5) || '--:--';
}
