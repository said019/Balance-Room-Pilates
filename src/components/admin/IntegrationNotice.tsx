import { Link } from 'react-router-dom';
import { ArrowUpRight, Mail, Link2, MessageCircle } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Button } from '@/components/ui/button';

const content = {
  communication: {
    title: 'Comunicación', eyebrow: 'Cerca de tu comunidad', icon: Mail,
    description: 'Las campañas por correo y WhatsApp están pendientes de conexión. Por ahora puedes abrir un correo individual desde las fichas de tus miembros.',
  },
  whatsapp: {
    title: 'WhatsApp', eyebrow: 'Conversaciones que acompañan', icon: MessageCircle,
    description: 'Los avisos automáticos de WhatsApp todavía no están conectados. Las reservas y los pagos se consultan directamente en la app.',
  },
  platforms: {
    title: 'Plataformas', eyebrow: 'Reservas de 2707 Altitud', icon: Link2,
    description: 'El studio trabaja con reservas directas y sus propios paquetes. Los accesos por plataformas externas aparecerán aquí cuando exista un convenio activo.',
  },
} as const;

export function IntegrationNotice({ type }: { type: keyof typeof content }) {
  const { title, eyebrow, description, icon: Icon } = content[type];
  return <AuthGuard requiredRoles={['admin', 'super_admin']}><AdminLayout>
    <section className="mx-auto max-w-3xl space-y-6">
      <div><p className="text-xs uppercase tracking-[0.2em] text-altitud-olive">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{title}</h1></div>
      <div className="rounded-3xl border border-altitud-sand/60 bg-card p-6 sm:p-8">
        <Icon aria-hidden="true" className="mb-5 h-7 w-7 text-altitud-olive" />
        <h2 className="text-xl font-medium">Conexión pendiente</h2>
        <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">{description}</p>
        <Button asChild className="mt-6"><Link to={type === 'platforms' ? '/admin/calendar' : '/admin/clients'}>
          {type === 'platforms' ? 'Ver agenda del studio' : 'Ver comunidad'}<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link></Button>
      </div>
    </section>
  </AdminLayout></AuthGuard>;
}
