import { Link } from 'react-router-dom';
import { FOUNDING_50, formatMxn } from '@/lib/studio';

export function FoundingBenefits() {
  return (
    <section id="founding-benefits" aria-labelledby="founding-benefits-title" className="my-8 overflow-hidden rounded-2xl border border-altitud-sand bg-white/40">
      <header className="space-y-3 bg-altitud-olive px-6 py-7 text-altitud-cream sm:px-8">
        <p className="text-xs uppercase tracking-[0.18em]">Promoción de lanzamiento · primeros 50 miembros</p>
        <h2 id="founding-benefits-title" className="text-3xl">FOUNDING 50</h2>
        <p className="text-2xl">{formatMxn(FOUNDING_50.price)} <span className="text-base">MXN / mes</span></p>
        <p>Precio congelado durante 6 meses desde la activación. Precio regular: {formatMxn(FOUNDING_50.regularPrice)} MXN.</p>
      </header>
      <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-2">
        <div><h3 className="mb-4 text-xl">Beneficios de la membresía</h3>
          <ul className="space-y-4">{FOUNDING_50.benefits.map((benefit) => <li key={benefit} className="border-b border-altitud-sand/50 pb-4 text-sm leading-relaxed">{benefit}</li>)}</ul>
        </div>
        <div><h3 className="mb-4 text-xl">Requisitos para conservar el beneficio</h3>
          <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">{FOUNDING_50.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
          <Link className="member-text-link mt-5 inline-block" to="/cancellation-policy">Consultar políticas de cancelación →</Link>
        </div>
      </div>
      <p className="border-t border-altitud-sand/50 px-6 py-4 text-sm text-muted-foreground sm:px-8">Estos beneficios corresponden a una membresía FOUNDING 50 activa. Consulta arriba el estado y la vigencia de tu plan.</p>
    </section>
  );
}
