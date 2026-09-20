import { CancellationTerms } from '@/hooks/use-cancellation-policy';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '@/components/altitud/SiteShell';
import { FOUNDING_50, STUDIO, STUDIO_RULES } from '@/lib/studio';

export default function Terms() {
  return <div className="alt-site"><SiteHeader /><main className="alt-legal"><div className="alt-eyebrow">2707 ALTITUD</div><h1>Condiciones del studio</h1>
    <h2>Reservaciones y asistencia</h2><p>Inicia sesión para reservar una clase disponible. Los grupos son de hasta {STUDIO.capacity} personas. <CancellationTerms /> Las cancelaciones tardías y las inasistencias cuentan como una clase utilizada y no se recuperan.</p>
    <h2>Paquetes y pagos</h2><p>Los paquetes de 4, 8 y 12 clases y Unlimited tienen vigencia de 30 días. Las clases no utilizadas durante la vigencia no son acumulables ni transferibles, salvo excepción autorizada por Altitud. Consulta directamente la vigencia de la clase prueba, clase suelta y paquete de primera vez antes de adquirirlos.</p><p>Cuando pagues por transferencia bancaria, comparte tu comprobante. El studio validará el pago para activar tu paquete o membresía. También puedes pagar directamente en el studio.</p>
    <h2>Convivencia y entrenamiento</h2><ul>{STUDIO_RULES.map(rule => <li key={rule}>{rule}</li>)}</ul>
    <h2>Founding 50</h2><p>Promoción de lanzamiento: Unlimited a $1,299 MXN al mes durante 6 meses desde la activación, frente a $1,599 MXN del precio regular.</p><ul>{FOUNDING_50.requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul><p><Link to="/pricing#founding-50">Consulta los beneficios de Founding 50</Link> y confirma disponibilidad con el studio antes de realizar el pago.</p>
    <h2>Contacto</h2><p>{STUDIO.address}<br /><a href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp: {STUDIO.phone}</a></p>
    <Link to="/" className="alt-text-link">← Volver al studio</Link>
  </main><SiteFooter /></div>;
}
