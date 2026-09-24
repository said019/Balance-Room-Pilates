import { PublishedHours } from '@/components/schedule/PublishedHours';
import { Link } from 'react-router-dom';
import { useActivePlans, activePlanDescription, OFFICIAL_UNLIMITED_PLAN_ID } from '@/hooks/use-active-plans';
import { Arrow } from './SiteShell';
import { FOUNDING_50, STUDIO, formatMxn } from '@/lib/studio';

export function StudioHours() {
  return <section className="alt-section alt-studio-hours" id="horarios">
    <div><div className="alt-eyebrow">TU ENTRENAMIENTO, EN TU DÍA</div><h2>Hazle espacio<br /><span>a tu progreso.</span></h2><p>Sesiones de hasta {STUDIO.capacity} personas para cuidar tu técnica y acompañar tu proceso.</p><Link to="/reservar" className="alt-text-link">Consultar disponibilidad <Arrow /></Link></div>
    <div className="alt-hours-list">
      <PublishedHours />
      <div><h3>Atención en el studio</h3><p>La atención está ligada al horario de clases publicado.</p></div>
    </div>
  </section>;
}

function CatalogUnavailable({ failed, retry }: { failed: boolean; retry: () => void }) {
  return <div className="alt-price-note" role={failed ? 'alert' : 'status'}><p>{failed ? 'No pudimos cargar los paquetes disponibles.' : 'Los paquetes se publicarán aquí cuando el studio los habilite.'}</p>{failed ? <button className="alt-text-link" onClick={retry}>Volver a intentar</button> : <a className="alt-text-link" href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">Consultar con el studio <Arrow diagonal /></a>}</div>;
}

export function PriceTable() {
  const plans = useActivePlans();
  if (plans.isPending) return <p className="alt-price-note" role="status">Consultando paquetes…</p>;
  if (plans.isError || !plans.data?.length) return <CatalogUnavailable failed={plans.isError} retry={() => void plans.refetch()} />;
  return <div className="alt-price-table-wrap">
    <table className="alt-price-table"><caption>Clases y membresías de 2707 Altitud. Todos los precios están en pesos mexicanos.</caption>
      <thead><tr><th scope="col">Tu entrenamiento</th><th scope="col">Precio MXN</th><th scope="col">Vigencia</th></tr></thead>
      <tbody>{plans.data.map(plan => <tr key={plan.id} className={plan.is_unlimited || plan.class_limit == null ? 'alt-plan-unlimited' : undefined}>
        <th scope="row">{plan.name}<small>{plan.description || activePlanDescription(plan)}</small></th>
        <td>{formatMxn(plan.price)}</td>
        <td>{plan.duration_days ? `${plan.duration_days} días` : <span>Consulta en<br />el studio</span>}</td>
      </tr>)}</tbody>
    </table>
    <p className="alt-price-note">Consulta la vigencia de cada paquete. Las clases no utilizadas no son acumulables ni transferibles, salvo excepción autorizada por Altitud.</p>
  </div>;
}

export function PlanHighlights() {
  const plans = useActivePlans();
  if (plans.isPending) return <p role="status">Consultando paquetes…</p>;
  if (plans.isError || !plans.data?.length) return <CatalogUnavailable failed={plans.isError} retry={() => void plans.refetch()} />;
  return <>{plans.data.slice(0, 3).map(plan => <article key={plan.id}><div><span className="alt-eyebrow">TU SIGUIENTE PASO</span><h3>{plan.name}</h3><p>{plan.description || activePlanDescription(plan)}</p><span className="alt-home-plan-price">{formatMxn(plan.price)} <small>MXN</small></span></div><Link to="/pricing" aria-label={`Ver condiciones de ${plan.name}`}><Arrow /></Link></article>)}<Link className="alt-text-link alt-pricing-link" to="/pricing">Comparar todas las opciones <Arrow /></Link></>;
}

export function FoundingOffer() {
  const plans = useActivePlans();
  const unlimited = plans.data?.find(plan => plan.id === OFFICIAL_UNLIMITED_PLAN_ID);
  if (!unlimited) return null;
  return <section className="alt-founding" id="founding-50" aria-labelledby="founding-title">
    <div className="alt-founding-intro"><div className="alt-eyebrow">PROMOCIÓN DE LANZAMIENTO</div><h2 id="founding-title">FOUNDING 50.</h2><p>Forma parte del inicio de Altitud.</p><p className="alt-founding-price">{formatMxn(FOUNDING_50.price)}<span>MXN / mes</span></p><p>Unlimited con precio congelado por {FOUNDING_50.months} meses desde tu activación.<br />Precio regular: {formatMxn(unlimited.price)} MXN.</p><a href={FOUNDING_50.whatsappHref} target="_blank" rel="noopener noreferrer" className="alt-button alt-button-cream">Consultar mi lugar <Arrow diagonal /></a><small>El studio confirma la disponibilidad. Tu lugar se asegura con el primer pago.</small></div>
    <div className="alt-founding-details"><div><h3>Lo que incluye</h3><ul>{FOUNDING_50.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul></div><details><summary>Requisitos y condiciones <span aria-hidden="true">+</span></summary><ul>{FOUNDING_50.requirements.map(requirement => <li key={requirement}>{requirement}</li>)}</ul><Link className="alt-text-link" to="/cancellation-policy">Política de cancelación <Arrow /></Link></details></div>
  </section>;
}

export function StudioContact() {
  return <section className="alt-section alt-studio-contact" id="contacto">
    <div><div className="alt-eyebrow">NOS VEMOS EN ZINACANTEPEC</div><h2>Tu próximo<br /><span>punto de encuentro.</span></h2></div>
    <div><h3>Plaza Bosques</h3><p>Locales 4 y 5<br />Zinacantepec, Estado de México</p><a href={STUDIO.mapHref} target="_blank" rel="noopener noreferrer" className="alt-text-link">Cómo llegar <Arrow diagonal /></a><div className="alt-contact-actions"><a className="alt-button alt-button-olive" href={STUDIO.whatsappHref} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp <Arrow diagonal /></a><a href={STUDIO.phoneHref} className="alt-text-link">{STUDIO.phone}</a></div><div className="alt-contact-socials"><span>{STUDIO.socialHandle}</span><a href={STUDIO.instagramHref} target="_blank" rel="noopener noreferrer">Instagram <Arrow diagonal /></a><a href={STUDIO.facebookHref} target="_blank" rel="noopener noreferrer">Facebook <Arrow diagonal /></a></div></div>
  </section>;
}
