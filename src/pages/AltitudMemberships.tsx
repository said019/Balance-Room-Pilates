import { CancellationTerms } from '@/hooks/use-cancellation-policy';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter, Arrow } from '@/components/altitud/SiteShell';
import { FoundingOffer, PriceTable } from '@/components/altitud/StudioDetails';
import { STUDIO } from '@/lib/studio';

export default function AltitudMemberships() {
  return <div className="alt-site"><SiteHeader /><main className="alt-membership-page alt-pricing-page">
    <header className="alt-pricing-heading"><div><div className="alt-eyebrow">CONSTANCIA QUE SE CONVIERTE EN PROGRESO</div><h1>Encuentra<br /><span>tu ritmo.</span></h1></div><div><p>Tu primera clase, una rutina constante o acceso Unlimited. Elige cómo quieres entrenar.</p><Link className="alt-button alt-button-olive" to="/app/checkout">Elegir mi paquete <Arrow /></Link></div></header>
    <PriceTable />
    <div className="alt-payment-note"><div><h2>Tu siguiente paso</h2><p>Inicia sesión para consultar las opciones de compra disponibles. Para clase prueba, clase suelta o el paquete de primera vez, escríbenos y te ayudamos a comenzar.</p></div><a className="alt-text-link" href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">Hablar con el studio <Arrow diagonal /></a></div>
    <FoundingOffer />
    <section className="alt-pricing-conditions"><h2>Entrena con claridad.</h2><div><h3>Transferencia y pago en el studio</h3><p>La transferencia requiere un comprobante. Tu paquete o membresía se activa una vez que el studio valida el pago. También puedes pagar directamente en el studio; consulta las opciones disponibles al comprar.</p><h3>Cuida tu lugar</h3><p><CancellationTerms /> Si cancelas tarde o no asistes, la clase se considera utilizada y no podrá recuperarse.</p><Link className="alt-text-link" to="/cancellation-policy">Ver política de cancelación <Arrow /></Link></div></section>
    <Link to="/" className="alt-text-link">← Volver al studio</Link>
  </main><SiteFooter /></div>;
}
