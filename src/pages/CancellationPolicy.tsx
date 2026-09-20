import { CancellationTerms } from '@/hooks/use-cancellation-policy';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '@/components/altitud/SiteShell';
import { STUDIO } from '@/lib/studio';

export default function CancellationPolicy() {
  return <div className="alt-site"><SiteHeader /><main className="alt-legal"><div className="alt-eyebrow">2707 ALTITUD</div><h1>Política de cancelación</h1>
    <h2>Plazo para cancelar o reagendar</h2><p><CancellationTerms /> Gestiona tu reserva desde la app.</p>
    <h2>Cancelación tardía o inasistencia</h2><p>Si cancelas fuera de ese plazo o no te presentas, la clase se considera utilizada y no podrá recuperarse.</p>
    <h2>Vigencia de tu paquete</h2><p>Los paquetes de 4, 8 y 12 clases y la membresía Unlimited tienen vigencia de 30 días. Las clases no utilizadas dentro de su vigencia no son acumulables ni transferibles, salvo una excepción autorizada por Altitud.</p>
    <p>Si necesitas ayuda con tu reserva, <a href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">contacta al studio por WhatsApp</a>.</p>
    <Link to="/reservar" className="alt-text-link">Ir a mi agenda →</Link>
  </main><SiteFooter /></div>;
}
