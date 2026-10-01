import { Link } from 'react-router-dom';

/** The direct cash sale stays closed so a package is never activated without the client's health declaration. */
export function ConsentSaleNotice({ reviewLink = false }: { reviewLink?: boolean }) {
  return (
    <section aria-label="Activación de paquete" className="space-y-3 rounded-xl border border-border p-5">
      <h2 className="font-heading text-2xl">El paquete se pide desde la cuenta</h2>
      <p className="text-sm text-muted-foreground">
        La persona acepta la declaración de salud vigente en su cuenta y elige el paquete. Si el pago fue en efectivo o por transferencia en el studio, la dueña aprueba esa orden en Pagos. Desde aquí no se registra el dinero ni se crea el paquete.
      </p>
      {reviewLink && <Link to="/admin/payments?tab=verification" className="inline-flex min-h-11 items-center underline underline-offset-4">Revisar órdenes por aprobar</Link>}
    </section>
  );
}
