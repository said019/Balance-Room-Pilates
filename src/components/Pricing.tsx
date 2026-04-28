import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Clase suelta",
    classes: 1,
    price: 200,
    note: "Para probar una disciplina o complementar tu semana.",
  },
  {
    name: "Paquete 4 clases",
    classes: 4,
    price: 750,
    note: "Una práctica semanal para sostener el hábito.",
  },
  {
    name: "Paquete 8 clases",
    classes: 8,
    price: 1450,
    note: "Dos clases por semana con mejor costo por sesión.",
    popular: true,
  },
  {
    name: "Paquete 12 clases",
    classes: 12,
    price: 2100,
    note: "Para entrenar con constancia y variedad.",
  },
  {
    name: "Paquete 24 clases",
    classes: 24,
    price: 2900,
    note: "El paquete más completo para venir casi diario.",
  },
];

const policies = [
  "Créditos válidos durante 1 mes.",
  "Cancelación permitida hasta 5 horas antes.",
  "Si no asistes o cancelas tarde, se descuenta el crédito.",
  "No hay reagendas automáticas.",
];

const Pricing = () => {
  return (
    <section id="precios" className="py-24 lg:py-32 bg-muted/35">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end mb-14">
          <div>
            <span className="text-sm font-body text-balance-olive tracking-widest uppercase mb-4 block">
              paquetes
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-5 text-balance">
              Compra clases, no membresías forzadas.
            </h2>
          </div>
          <p className="font-body text-lg text-muted-foreground max-w-2xl lg:ml-auto">
            Balance Room trabaja con clase suelta y paquetes de créditos. Puedes
            pagar en físico o en línea cuando el studio lo habilite; por ahora el
            flujo deja la compra lista para confirmación.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => {
            const pricePerClass = Math.round(plan.price / plan.classes);

            return (
              <article
                key={plan.name}
                className={`relative rounded-[1.75rem] p-1.5 transition-all duration-700 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                  plan.popular
                    ? "bg-balance-olive text-white shadow-[0_24px_60px_rgba(81,86,70,0.24)]"
                    : "bg-black/[0.035]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-5 rounded-full bg-[#F3E8D1] px-4 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-balance-dark">
                    recomendado
                  </div>
                )}

                <div className={`h-full rounded-[1.35rem] p-6 ring-1 ring-black/5 ${
                  plan.popular ? "bg-[#747865] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]" : "bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                }`}>
                  <div className="mb-7">
                    <span className={`font-body text-[11px] uppercase tracking-[0.2em] ${
                      plan.popular ? "text-white/60" : "text-muted-foreground"
                    }`}>
                      {plan.classes} clase{plan.classes > 1 ? "s" : ""}
                    </span>
                    <h3 className={`font-heading text-2xl font-semibold mt-2 ${
                      plan.popular ? "text-white" : "text-foreground"
                    }`}>
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`font-heading text-5xl font-bold tabular-nums ${
                        plan.popular ? "text-white" : "text-foreground"
                      }`}>
                        ${plan.price.toLocaleString("es-MX")}
                      </span>
                      <span className={`font-body text-xs ${
                        plan.popular ? "text-white/55" : "text-muted-foreground"
                      }`}>
                        MXN
                      </span>
                    </div>
                    <span className={`font-body text-sm font-medium ${
                      plan.popular ? "text-white/70" : "text-balance-olive"
                    }`}>
                      ${pricePerClass.toLocaleString("es-MX")} por clase
                    </span>
                  </div>

                  <p className={`font-body text-sm leading-relaxed min-h-[70px] ${
                    plan.popular ? "text-white/75" : "text-muted-foreground"
                  }`}>
                    {plan.note}
                  </p>

                  <Button
                    variant={plan.popular ? "secondary" : "outline"}
                    className={`group mt-8 w-full rounded-full ${
                      plan.popular ? "bg-white text-balance-olive hover:bg-white/90" : ""
                    }`}
                    asChild
                  >
                    <Link to="/login">
                      Comprar
                      <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 transition-transform duration-500 group-hover:translate-x-1">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.75rem] bg-card p-7 ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-balance-olive" />
              <h3 className="font-heading text-2xl font-semibold">Políticas simples</h3>
            </div>
            <ul className="space-y-3">
              {policies.map((policy) => (
                <li key={policy} className="flex gap-3 font-body text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-balance-olive" />
                  {policy}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.75rem] bg-[#322A1E] p-7 text-white ring-1 ring-black/5">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-[#D8CAB0]" />
              <h3 className="font-heading text-2xl font-semibold">Pagos</h3>
            </div>
            <p className="font-body text-sm leading-relaxed text-white/70">
              Se aceptan pagos en el studio y pagos en línea cuando la cuenta
              bancaria/tarjeta dirigida esté lista. El sistema mantiene el flujo
              de compra preparado para confirmar órdenes sin exigir inscripción
              anual ni costo extra de registro.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
