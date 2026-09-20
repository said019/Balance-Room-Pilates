import {SeriesTemplateEditor} from './SeriesChangePanel';
import { civilTimeLabel, type PublishedSlot } from '@/components/schedule/PublishedHours';
import { PublishedScheduleEditor } from './PublishedScheduleEditor';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import type { Schedule, ClassType, Instructor } from '@/types/class';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Users, X, AlertTriangle } from '@/components/brand/icons';

const scheduleSchema = z.object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    classTypeId: z.string().uuid('Selecciona un tipo de clase'),
    instructorId: z.string().uuid('Selecciona un instructor'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM (24h)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:MM (24h)'),
    maxCapacity: z.coerce.number().int().positive(),
    isActive: z.boolean().default(true),
    facilityId: z.string().uuid().optional(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

const DAYS_OF_WEEK = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

interface Facility {
    id: string;
    name: string;
}

export default function WeeklySchedule() {
    const [seriesEdit,setSeriesEdit]=useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [facilityFilter, setFacilityFilter] = useState('all');
    const [visibleDay, setVisibleDay] = useState(new Date().getDay());
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const baseSlots = useQuery<PublishedSlot[]>({queryKey: ['schedule-slots-admin'], queryFn: async () => (await api.get('/schedules/slots')).data});

    // Fetch Schedules
    const { data: schedules, isLoading } = useQuery<Schedule[]>({
        queryKey: ['schedules'],
        queryFn: async () => {
            const { data } = await api.get('/schedules?all=true');
            return data;
        },
    });

    // Fetch Class Types
    const { data: classTypes } = useQuery<ClassType[]>({
        queryKey: ['class-types'],
        queryFn: async () => {
            const { data } = await api.get('/class-types');
            return data;
        },
    });

    // Fetch Facilities
    const { data: facilities } = useQuery<Facility[]>({
        queryKey: ['facilities'],
        queryFn: async () => {
            const { data } = await api.get('/facilities');
            return data;
        },
    });

    // Fetch Instructors
    const { data: instructors } = useQuery<Instructor[]>({
        queryKey: ['instructors'],
        queryFn: async () => {
            const { data } = await api.get('/instructors');
            return data;
        },
    });

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ScheduleForm>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            maxCapacity: 12,
            isActive: true
        }
    });


    const createMutation = useMutation({
        mutationFn: async (data: ScheduleForm) => {
            return await api.post('/schedules', { ...data, isRecurring: true, facility_id: data.facilityId || undefined });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast({ title: 'Horario creado', description: 'La clase ha sido añadida a la plantilla semanal.' });
            setIsDialogOpen(false);
            reset();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/schedules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast({ title: 'Horario eliminado', description: 'Se ha eliminado de la plantilla.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const onSubmit = (data: ScheduleForm) => {
        createMutation.mutate(data);
    };

    const handleAddClass = (day: number) => {
        setSelectedDay(day);
        setValue('dayOfWeek', day);
        setValue('startTime', '');
        setIsDialogOpen(true);
    };

    // Group schedules by day (with optional facility filter)
    const schedulesByDay = Array.from({ length: 7 }, (_, i) => {
        return (schedules?.filter(s => s.day_of_week === i) || [])
            .filter(s => facilityFilter === 'all' || s.facility_name === facilityFilter);
    });

    return (
        <AuthGuard requiredRoles={['admin', 'instructor']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Horarios del studio</h1>
                            <p className="text-muted-foreground">Organiza la semana base de tu studio.</p>
                        </div>
                        {/* <Button variant="outline">
                 Generar ClasesPróximas
            </Button> */}
                    </div>

                    <PublishedScheduleEditor />
                    <h2 className="text-xl font-heading">Asignaciones semanales</h2>
                    <p className="text-sm text-muted-foreground">Asigna clase, coach y duración a un horario base existente. Cambiar el horario base actualiza estas plantillas; las sesiones ya programadas conservan su fecha y hora.</p>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { id: 'all', label: 'Todas' },
                            { id: 'Híbrido', label: 'Híbrido' },
                            { id: 'Funcional', label: 'Funcional' },

                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setFacilityFilter(f.id)}
                                aria-pressed={facilityFilter === f.id}
                                className={`min-h-11 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
                                    facilityFilter === f.id
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 rounded-2xl border border-altitud-sand/60 bg-altitud-cream p-1 lg:hidden" role="group" aria-label="Día de la plantilla">
                        {DAYS_OF_WEEK.map((day, index) => (
                            <button key={day} type="button" aria-label={day} aria-pressed={visibleDay === index} onClick={() => setVisibleDay(index)}
                                className={`min-h-14 min-w-0 rounded-xl py-2 text-xs font-semibold ${visibleDay === index ? 'bg-altitud-olive text-altitud-cream' : 'text-altitud-dark/65'}`}>
                                <span className="block">{day.slice(0, 3)}</span>
                                <span className="mt-1 block tabular-nums">{schedulesByDay[index].length}</span>
                            </button>
                        ))}
                    </div>
                    {isLoading && <div className="flex min-h-40 items-center justify-center" role="status" aria-label="Cargando horarios"><Loader2 className="h-6 w-6 animate-spin text-altitud-olive" /></div>}
                    {!isLoading && schedulesByDay && (
                        <div className="max-w-full overflow-x-auto pb-2">
                        <div className="grid min-w-0 gap-4 lg:min-w-[1260px] lg:grid-cols-7">
                            {DAYS_OF_WEEK.map((dayName, index) => (
                                <div key={index} className={`${visibleDay === index ? 'flex' : 'hidden'} min-w-0 flex-col gap-3 lg:flex`}>
                                    <div className="flex items-center justify-between rounded-xl border border-altitud-sand/60 bg-altitud-cream px-3 py-3 font-heading text-lg lg:justify-center lg:text-sm">
                                        {dayName}
                                    </div>
                                    <div className="space-y-3 flex-1 rounded-2xl border border-altitud-sand/60 p-3 bg-altitud-cream/40">
                                        {schedulesByDay[index].map((s) => (
                                            <div
                                                key={s.id}
                                                className="relative group rounded-xl border bg-card p-3 text-sm"
                                                style={{ borderLeftColor: s.class_type_color || '#ccc', borderLeftWidth: '4px' }}
                                            >
                                                <div className="flex items-center justify-between gap-1 font-semibold">
                                                    <span>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar este horario?')) deleteMutation.mutate(s.id);
                                                        }}
                                                        aria-label={`Eliminar horario de ${s.class_type_name} a las ${s.start_time?.slice(0,5)}`}
                                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="font-medium truncate" title={s.class_type_name}>{s.class_type_name}</div>
                                                <div className="text-xs text-muted-foreground truncate">{s.instructor_name}</div>
                                                <Button variant="ghost" className="min-h-11 mt-2" onClick={()=>setSeriesEdit(s)}>Editar serie</Button>
                                                {(s as any).next_change_at&&<p className="text-xs">Cambio programado desde {(s as any).next_change_at}</p>}
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <Users className="h-3 w-3" /> {s.max_capacity}
                                                </div>
                                            </div>
                                        ))}
                                        {schedulesByDay[index].length === 0 && <p className="px-2 py-5 text-center text-sm text-muted-foreground">Aún no hay horarios para este día.</p>}
                                        <Button
                                            variant="ghost"
                                            className="min-h-11 w-full rounded-xl border border-dashed text-sm hover:bg-primary/5 hover:text-primary"
                                            onClick={() => handleAddClass(index)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Agregar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}

                    <div className="bg-warning/10 p-4 rounded-md border border-warning/30 text-sm text-warning-foreground flex gap-2 items-start max-w-2xl">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <strong>Revisa el impacto.</strong> Edita una serie para actualizar sus clases futuras sin reservas. Las excepciones, clases pasadas y clases con historial se conservan.
                        </div>
                    </div>

                    <Dialog open={!!seriesEdit} onOpenChange={open=>{if(!open)setSeriesEdit(null);}}><DialogContent><DialogHeader><DialogTitle>Editar serie futura</DialogTitle><DialogDescription>Revisa las clases aplicables y las que conservan su horario antes de guardar.</DialogDescription></DialogHeader>{seriesEdit&&<SeriesTemplateEditor key={seriesEdit.id} schedule={seriesEdit} onApplied={()=>{queryClient.invalidateQueries({queryKey:['schedules']});setSeriesEdit(null);}}/>}</DialogContent></Dialog>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Agregar Horario - {selectedDay !== null && DAYS_OF_WEEK[selectedDay]}</DialogTitle>
                                <DialogDescription>Define una clase recurrente para este día.</DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <input type="hidden" {...register('dayOfWeek')} />

                                <div className="space-y-2">
                                    <Label>Sala <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                                    <Select onValueChange={(val) => setValue('facilityId', val === 'none' ? undefined : val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sin sala asignada" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin sala asignada</SelectItem>
                                            {facilities?.map(f => (
                                                <SelectItem key={f.id} value={f.id}>
                                                    {f.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Clase</Label>
                                    <Select onValueChange={(val) => setValue('classTypeId', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar tipo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classTypes?.map(ct => (
                                                <SelectItem key={ct.id} value={ct.id}>
                                                    {ct.name} ({ct.duration_minutes} min)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.classTypeId && <p className="text-xs text-destructive">{errors.classTypeId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Instructor</Label>
                                    <Select onValueChange={(val) => setValue('instructorId', val)}>
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
                                    {errors.instructorId && <p className="text-xs text-destructive">{errors.instructorId.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Inicio</Label>
                                        <select aria-label="Inicio" className="h-11 w-full rounded-md border bg-background px-3" value={watch('startTime') || ''} onChange={event => setValue('startTime', event.target.value)}>
                                            <option value="">Selecciona un horario base</option>
                                            {baseSlots.data?.filter(slot => slot.day_of_week === watch('dayOfWeek')).map(slot => <option key={slot.id} value={slot.start_time}>{civilTimeLabel(slot.start_time)}</option>)}
                                        </select>
                                        {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fin</Label>
                                        <TimePicker
                                            value={watch('endTime')}
                                            onChange={(val) => setValue('endTime', val)}
                                            placeholder="Hora fin"
                                            minuteStep={5}
                                        />
                                        {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Capacidad</Label>
                                    <Input type="number" {...register('maxCapacity')} />
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Horario
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
