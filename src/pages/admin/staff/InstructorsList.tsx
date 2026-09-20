import { PrivateMediaImage } from '@/components/PrivateMediaImage';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api, { getErrorMessage } from '@/lib/api';
import type { Instructor } from '@/types/class';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Avatar not used - using custom img for better quality display
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2, User, Camera, Upload, Mail } from '@/components/brand/icons';
import type { User as AuthUser } from '@/types/auth'; // Import User type

// Schema for form — userId is optional (not needed when creating from email)
const instructorSchema = z.object({
    userId: z.string().optional(),
    displayName: z.string().min(2, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    bio: z.string().optional(),
    phone: z.string().optional(),
    priorities: z.string().optional(), // We'll handle splitting by newline
    isActive: z.boolean().default(true),
    visiblePublic: z.boolean().default(true),
});

type InstructorForm = z.infer<typeof instructorSchema>;

export default function InstructorsList() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showCredentials, setShowCredentials] = useState<{coachNumber?: string; email?: string} | null>(null);
    const [linkedUser, setLinkedUser] = useState<AuthUser | null>(null); // user found by email search
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form setup
    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<InstructorForm>({
        resolver: zodResolver(instructorSchema),
        defaultValues: {
            isActive: true,
            visiblePublic: true,
            email: '',
        },
    });

    // Watch email to auto-search for existing users
    const watchedEmail = watch('email');

    // Fetch Instructors
    const { data: instructors, isLoading } = useQuery<Instructor[]>({
        queryKey: ['instructors'],
        queryFn: async () => {
            const { data } = await api.get('/instructors?all=true');
            return data;
        },
    });

    // Auto-search for existing user when email changes (only when creating)
    const { data: foundUsers } = useQuery<AuthUser[]>({
        queryKey: ['users-search-email', watchedEmail],
        queryFn: async () => {
            if (!watchedEmail || watchedEmail.length < 3) return [];
            const { data } = await api.get(`/users?search=${watchedEmail}&limit=3`);
            return data.users || [];
        },
        enabled: isDialogOpen && !editingInstructor && !!watchedEmail && watchedEmail.length >= 3,
    });

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/instructors', data);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            setShowCredentials({email:watchedEmail,coachNumber:response.data.coach_number});
            toast({ title: 'Instructor creado', description: 'El instructor ha sido registrado.' });
            setIsDialogOpen(false);
            setLinkedUser(null);
            reset();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return await api.put(`/instructors/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            toast({ title: 'Instructor actualizado', description: 'Los datos han sido actualizados.' });
            setIsDialogOpen(false);
            setEditingInstructor(null);
            reset();
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/instructors/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            toast({ title: 'Instructor desactivado', description: 'El instructor ha sido desactivado.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    const onSubmit = (data: InstructorForm) => {
        // Process priorities/specialties
        const specialtiesArray = data.priorities
            ? data.priorities.split('\n').map(s => s.trim()).filter(s => s !== '')
            : [];

        const payload: any = {
            displayName: data.displayName,
            email: data.email,
            bio: data.bio,
            phone: data.phone,
            priorities: specialtiesArray,
            isActive: data.isActive,
            visiblePublic: data.visiblePublic,
        };

        // If we have a linked user, send userId
        if (linkedUser) {
            payload.userId = linkedUser.id;
        } else if (data.userId) {
            payload.userId = data.userId;
        }

        if (photoPreview) {
            payload.photoUrl = photoPreview;
        }

        if (editingInstructor) {
            updateMutation.mutate({ id: editingInstructor.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (instructor: Instructor) => {
        setEditingInstructor(instructor);
        setPhotoPreview(null); // Reset photo preview
        setValue('userId', instructor.user_id);
        setValue('displayName', instructor.display_name);
        setValue('email', instructor.email || '');
        setValue('bio', instructor.bio || '');
        setValue('phone', instructor.instructor_phone || instructor.user_phone || '');
        setValue('priorities', instructor.specialties?.join('\n') || '');
        setValue('isActive', instructor.is_active);
        setValue('visiblePublic', instructor.visible_public ?? true);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingInstructor(null);
        setPhotoPreview(null);
        setLinkedUser(null);
        reset();
        setIsDialogOpen(true);
    };

    const handleLinkUser = (user: AuthUser) => {
        setLinkedUser(user);
        setValue('userId', user.id);
        setValue('displayName', user.display_name);
        setValue('email', user.email || '');
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Process and optimize image
    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const MAX_WIDTH = 700;
                    const MAX_HEIGHT = 875;
                    const QUALITY = 0.85;

                    let { width, height } = img;

                    // Calculate new dimensions maintaining aspect ratio
                    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    // Create canvas for image processing
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('No se pudo procesar la imagen'));
                        return;
                    }

                    // Enable high quality rendering
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to optimized base64
                    const optimizedBase64 = canvas.toDataURL('image/jpeg', QUALITY);
                    resolve(optimizedBase64);
                };
                img.onerror = () => reject(new Error('Error al cargar imagen'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    };

    // Handle file selection for photo
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Error', description: 'Solo se permiten imagenes' });
            return;
        }

        // Validate file size (max 10MB before processing)
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Error', description: 'La imagen no debe superar 10MB' });
            return;
        }

        try {
            // Process and optimize the image
            const optimizedImage = await processImage(file);
            setPhotoPreview(optimizedImage);
            toast({ title: 'Imagen procesada', description: 'La imagen se optimizo correctamente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la imagen' });
        }
    };

    // Upload photo mutation
    const uploadPhotoMutation = useMutation({
        mutationFn: async ({ id, photoData }: { id: string; photoData: string }) => {
            // Convert base64 data-URI to Blob and send as multipart/form-data
            const fetchRes = await fetch(photoData);
            const blob = await fetchRes.blob();
            const formData = new FormData();
            formData.append('photo', blob, 'photo.jpg');
            return await api.post(`/instructors/${id}/photo`, formData);
        },
        onSuccess: (response, variables) => {
            // Invalidate to refetch the list
            queryClient.invalidateQueries({ queryKey: ['instructors'] });

            // **FIX DEL BUG**: Actualizar el instructor en edición con la nueva foto
            if (editingInstructor) {
                setEditingInstructor({
                    ...editingInstructor,
                    photo_url: response.data.photo_url
                });
            }

            toast({ title: 'Foto actualizada', description: 'La foto del instructor ha sido actualizada.' });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Generate coach access mutation
    const generateAccessMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.post(`/instructors/${id}/generate-access`);
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['instructors'] });
            setShowCredentials({
                coachNumber: response.data.coachNumber,
                email: response.data.email,
            });
            toast({
                title: 'Invitación en cola',
                description: 'La persona recibirá un enlace para elegir su contraseña.',
            });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Reset coach password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.post(`/instructors/${id}/reset-password`);
        },
        onSuccess: (response) => {
            setShowCredentials({
                coachNumber: response.data.coachNumber,
                email: response.data.email,
            });
            toast({
                title: 'Invitación en cola',
                description: 'La contraseña actual se conserva hasta completar el enlace.',
            });
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    // Send credentials by email mutation
    const sendCredentialsMutation = useMutation({
        mutationFn: async ({ id, email }: { id: string; email: string }) => {
            return await api.post(`/instructors/${id}/send-credentials`, { email });
        },
        onSuccess: (response) => {
            setShowCredentials({email:response.data.email,coachNumber:response.data.coachNumber});
            toast({title:'Invitación en cola',description:'El estado pendiente confirma el registro de la solicitud, no su entrega.'});
        },
        onError: (error) => {
            toast({ variant: 'destructive', title: 'Error', description: getErrorMessage(error) });
        },
    });

    return (
        <AuthGuard requiredRoles={['admin','super_admin']}>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-heading font-bold">Instructores</h1>
                            <p className="text-muted-foreground">Gestión del staff y perfiles.</p>
                        </div>
                        <Button className="w-full sm:w-auto sm:shrink-0" onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Instructor
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-card">
                        <Table className="admin-record-table" role="table">
                            <TableHeader role="rowgroup">
                                <TableRow role="row">
                                    <TableHead role="columnheader">Instructor</TableHead>
                                    <TableHead role="columnheader">Contacto</TableHead>
                                    <TableHead role="columnheader">Especialidades</TableHead>
                                    <TableHead role="columnheader">Portal Coach</TableHead>
                                    <TableHead role="columnheader">Estado</TableHead>
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
                                ) : instructors?.length === 0 ? (
                                    <TableRow role="row">
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No hay instructores registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    instructors?.map((instructor) => (
                                        <TableRow role="row" key={instructor.id}>
                                            <TableCell role="cell" data-label="Instructor" data-primary>
                                                <div className="admin-record-value">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                                            {instructor.photo_url ? (
                                                                <PrivateMediaImage
                                                                    src={instructor.photo_url}
                                                                    alt={instructor.display_name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                                                    <User className="h-8 w-8 text-muted-foreground/40" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-base">{instructor.display_name}</div>
                                                            {instructor.bio && (
                                                                <div className="mt-1 max-w-prose text-sm text-muted-foreground">
                                                                    {instructor.bio}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Contacto">
                                                <div className="admin-record-value">
                                                    <div className="flex flex-col text-sm">
                                                        <span>{instructor.email}</span>
                                                        <span className="text-muted-foreground">
                                                            {instructor.instructor_phone || instructor.user_phone}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Especialidades">
                                                <div className="admin-record-value">
                                                    <div className="flex flex-wrap gap-1">
                                                        {instructor.specialties?.slice(0, 2).map((s, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                                        ))}
                                                        {(instructor.specialties?.length || 0) > 2 && (
                                                            <Badge variant="outline" className="text-xs">+{instructor.specialties!.length - 2}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Portal coach">
                                                <div className="admin-record-value">
                                                    <div className="flex flex-col gap-1">
                                                        {instructor.coach_number ? (
                                                            <>
                                                                <div className="flex items-center gap-1">
                                                                    <Badge variant="default" className="text-xs">
                                                                        {instructor.coach_number}
                                                                    </Badge>
                                                                </div>
                                                                {instructor.temp_password && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        Cambio de contraseña pendiente
                                                                    </Badge>
                                                                )}
                                                                {instructor.last_login && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Último acceso: {new Date(instructor.last_login).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">Sin acceso</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell role="cell" data-label="Estado">
                                                <div className="admin-record-value">
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant={instructor.is_active ? 'default' : 'secondary'}>
                                                            {instructor.is_active ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                        {instructor.visible_public && instructor.is_active && (
                                                            <Badge variant="outline" className="text-xs">Visible público</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right" role="cell" data-label="Acciones" data-actions>
                                                <div className="admin-record-value">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-11 w-11 p-0">
                                                                <span className="sr-only">Acciones de {instructor.display_name}</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEdit(instructor)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Editar Perfil
                                                            </DropdownMenuItem>
                                                            {!instructor.coach_number ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        if (confirm('¿Generar acceso al portal de coach?')) {
                                                                            generateAccessMutation.mutate(instructor.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <User className="mr-2 h-4 w-4" /> Generar Acceso Coach
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            const email = instructor.email || prompt('Ingresa el email del instructor:');
                                                                            if (email) {
                                                                                sendCredentialsMutation.mutate({ id: instructor.id, email });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Mail className="mr-2 h-4 w-4" /> Enviar invitación por email
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            if (confirm('¿Enviar un enlace para que el coach elija su contraseña?')) {
                                                                                resetPasswordMutation.mutate(instructor.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <User className="mr-2 h-4 w-4" /> Resetear Contraseña
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    if (confirm('¿Desactivar instructor?')) deleteMutation.mutate(instructor.id);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Desactivar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setPhotoPreview(null);
                    }}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingInstructor ? 'Editar Instructor' : 'Nuevo Instructor'}</DialogTitle>
                                <DialogDescription>
                                    {editingInstructor ? 'Actualiza la información del perfil.' : 'Escribe el email del coach. Si ya tiene cuenta se vincula, si no, se crea automáticamente.'}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Email field — primary input for creating */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email del Coach</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        readOnly={!!editingInstructor}
                                        placeholder="coach@ejemplo.com"
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}

                                    {/* Show search results when creating */}
                                    {!editingInstructor && !linkedUser && foundUsers && foundUsers.length > 0 && watchedEmail && watchedEmail.length >= 3 && (
                                        <div className="border rounded-md max-h-32 overflow-y-auto bg-popover">
                                            {foundUsers.map(u => (
                                                <div
                                                    key={u.id}
                                                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center text-sm"
                                                    onClick={() => handleLinkUser(u)}
                                                >
                                                    <span className="font-medium">{u.display_name}</span>
                                                    <span className="text-muted-foreground text-xs">{u.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Status indicator */}
                                    {!editingInstructor && linkedUser && (
                                        <div className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                                            <div className="text-sm text-green-700 flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5" />
                                                Usuario encontrado: <strong>{linkedUser.display_name}</strong>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-green-700 hover:text-green-900"
                                                onClick={() => { setLinkedUser(null); setValue('userId', ''); }}
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    )}
                                    {!editingInstructor && !linkedUser && watchedEmail && watchedEmail.includes('@') && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            Se creará una cuenta nueva con este email
                                        </p>
                                    )}
                                </div>

                                {/* Photo Upload Section - Only for editing */}
                                {editingInstructor && (
                                    <div className="space-y-3">
                                        <Label>Foto pública del coach</Label>
                                        <p className="text-xs text-muted-foreground">Al guardarla autorizas su publicación en la página del studio. Es independiente de la foto privada de su cuenta.</p>
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            {/* Photo Preview - Larger aspect ratio matching instructor cards */}
                                            <div
                                                className="relative group cursor-pointer flex-shrink-0"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <div className="relative w-32 h-40 rounded-md overflow-hidden bg-muted">
                                                    {(photoPreview || editingInstructor.photo_url) ? (
                                                        <PrivateMediaImage
                                                            src={photoPreview || editingInstructor.photo_url || undefined}
                                                            alt={editingInstructor.display_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                                            <User className="h-12 w-12 text-muted-foreground/40" />
                                                        </div>
                                                    )}
                                                    {/* Hover overlay */}
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Camera className="h-8 w-8 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-3 pt-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Seleccionar Foto
                                                </Button>
                                                {photoPreview && (
                                                    <p className="text-xs text-green-600 font-medium">
                                                        ✓ Foto lista — se guardará al hacer clic en Guardar
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG. Max 10MB. Se optimiza automáticamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Nombre Público</Label>
                                    <Input id="displayName" {...register('displayName')} placeholder="Nombre visible en calendario" />
                                    {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Biografía Corta</Label>
                                    <Textarea id="bio" {...register('bio')} placeholder="Experiencia, enfoque, etc." rows={3} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Teléfono (Opcional)</Label>
                                    <Input id="phone" {...register('phone')} placeholder="+52 123 456 7890" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priorities">Especialidades (una por línea)</Label>
                                    <Textarea
                                        id="priorities"
                                        {...register('priorities')}
                                        placeholder="Híbrido&#10;Funcional"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                                    <Label htmlFor="isActive">Estado Activo</Label>
                                    <Switch
                                        id="isActive"
                                        checked={watch('isActive')}
                                        onCheckedChange={(checked) => setValue('isActive', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                                    <div className="flex flex-col gap-1">
                                        <Label htmlFor="visiblePublic">Visible en Sitio Público</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Mostrar en la sección de instructores del website
                                        </span>
                                    </div>
                                    <Switch
                                        id="visiblePublic"
                                        checked={watch('visiblePublic')}
                                        onCheckedChange={(checked) => setValue('visiblePublic', checked)}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingInstructor ? 'Guardar Cambios' : 'Registrar Instructor'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Credentials Display Dialog */}
                    <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Invitación de acceso</DialogTitle>
                                <DialogDescription>
                                    La invitación está en cola. El coach elegirá su contraseña mediante un enlace de acceso seguro.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Email / Usuario</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={showCredentials?.email || ''}
                                            readOnly
                                            className="font-mono"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(showCredentials?.email || '');
                                                toast({ title: 'Copiado', description: 'Email copiado' });
                                            }}
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground">Esta solicitud no cambia la contraseña actual. La entrega depende del servicio de correo configurado.</p>
                            </div>

                            <DialogFooter>
                                <Button onClick={() => setShowCredentials(null)}>
                                    Cerrar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
