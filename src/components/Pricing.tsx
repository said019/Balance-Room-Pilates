import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Plan } from "@/types/auth";

const GROUPS: {
  key: NonNullable<Plan["package_type"]>;
  title: string;
  note: string;
}[] = [
  {
    key: "individual",
    title: "Individual",
    note: "Válido en un solo estudio (Wunda, Barre o Hot Room).",
  },
  {
    key: "mixto",
    title: "Mixto",
    note: "Válido en cualquiera de los 3 estudios.",
  },
  {
    key: "sample",
    title: "Clase Muestra",
    note: "Para probar una disciplina antes de comprar un paquete.",
  },
];

const policies = [
  "Créditos válidos según la vigencia de cada paquete.",
  "Cancelación permitida hasta 5 horas antes.",
  "Si no asistes o cancelas tarde, se descuenta el crédito.",
  "No hay reagendas automáticas.",
];

const Pricing = () => {
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["plans-active"],
    queryFn: async () => (await api.get("/plans")).data,
  });

  const grouped = GROUPS.map((group) => ({
    ...group,
    plans: plans
      .filter((p) => p.package_type === group.key)
      .sort((a, b) => Number(a.price) - Number(b.price)),
  })).filter((g) => g.plans.length > 0);

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

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-[1.75rem] bg-black/[0.035] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            {grouped.map((group) => (
              <div key={group.key}>
                <div className="mb-6">
                  <h3 className="font-heading text-3xl font-semibold text-foreground">
                    {group.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {group.note}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {group.plans.map((plan) => {
                    const price = Number(plan.price);
                    const classes = plan.class_limit ?? plan.classes_included ?? 1;
                    const pricePerClass = classes > 0 ? Math.round(price / classes) : price;

                    return (
                      <article
                        key={plan.id}
                        className="relative rounded-[1.75rem] p-1.5 transition-all duration-700 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 bg-black/[0.035]"
                      >
                        <div className="h-full rounded-[1.35rem] p-6 ring-1 ring-black/5 bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                          <div className="mb-7">
                            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                              {classes} clase{classes > 1 ? "s" : ""} ·{" "}
                              {plan.duration_days} días
                            </span>
                            <h3 className="font-heading text-2xl font-semibold mt-2 text-foreground">
                              {plan.name}
                            </h3>
                          </div>

                          <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                              <span className="font-heading text-5xl font-bold tabular-nums text-foreground">
                                ${price.toLocaleString("es-MX")}
                              </span>
                              <span className="font-body text-xs text-muted-foreground">
                                MXN
                              </span>
                            </div>
                            <span className="font-body text-sm font-medium text-balance-olive">
                              ${pricePerClass.toLocaleString("es-MX")} por clase
                            </span>
                          </div>

                          <p className="font-body text-sm leading-relaxed min-h-[70px] text-muted-foreground">
                            {plan.description || group.note}
                          </p>

                          <Button
                            variant="outline"
                            className="group mt-8 w-full rounded-full"
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
              </div>
            ))}
          </div>
        )}

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

        </div>
      </div>
    </section>
  );
};

export default Pricing;
