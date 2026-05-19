import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Plan } from "@/types/auth";
import {
  getClassesLabel,
  getPackagePresentation,
  getPackageType,
  packageOrder,
  packagePresentations,
} from "@/lib/planPresentation";

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

  const activePlans = plans.filter((plan) => plan.is_active !== false);
  const grouped = packageOrder
    .map((type) => ({
      ...packagePresentations[type],
      plans: activePlans
        .filter((plan) => getPackageType(plan) === type)
        .sort((a, b) => Number(a.price) - Number(b.price)),
    }))
    .filter((group) => group.plans.length > 0);

  return (
    <section id="precios" className="relative overflow-hidden bg-[#ECE6DA] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(51,42,34,.42)_1px,transparent_1px),linear-gradient(90deg,rgba(51,42,34,.42)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute right-[-12rem] top-20 h-96 w-96 rounded-full bg-[#B88968]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-[-10rem] h-96 w-96 rounded-full bg-[#7E8579]/18 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <span className="mb-4 block font-body text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7E8579]">
              paquetes claros
            </span>
            <h2 className="max-w-3xl font-heading text-4xl font-light leading-[0.96] tracking-[-0.04em] text-[#332A22] md:text-5xl lg:text-6xl">
              Elige por intención, no por adivinar nombres.
            </h2>
          </div>
          <div className="max-w-2xl lg:ml-auto">
            <p className="font-body text-base leading-relaxed text-[#625A50] md:text-lg">
              Muestra es para probar, Individual es para concentrarte en una sala, Mixto es para moverte entre todo Balance Room.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {packageOrder.map((type) => {
                const item = packagePresentations[type];
                return (
                  <div key={type} className={`rounded-[1.1rem] px-4 py-3 ring-1 ${item.badge}`}>
                    <span className="flex items-center gap-2 font-body text-[10px] font-semibold uppercase tracking-[0.18em]">
                      <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                      {item.shortTitle}
                    </span>
                    <p className="mt-1 font-body text-xs normal-case tracking-normal opacity-80">
                      {item.rule}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-80 rounded-[2rem] bg-[#F8F4EC]/70 ring-1 ring-[#332A22]/8">
                <div className="h-full animate-pulse rounded-[2rem] bg-gradient-to-br from-transparent via-[#332A22]/5 to-transparent" />
              </div>
            ))}
          </div>
        ) : grouped.length > 0 ? (
          <div className="space-y-12">
            {grouped.map((group, groupIndex) => (
              <section
                key={group.type}
                className={`grid gap-5 rounded-[2.4rem] p-4 ring-1 shadow-[0_30px_90px_-70px_rgba(51,42,34,.72)] md:p-5 lg:grid-cols-[0.72fr_1.28fr] ${group.panel}`}
              >
                <div className="flex min-h-[18rem] flex-col justify-between rounded-[1.9rem] bg-[#332A22]/[0.045] p-6 md:p-7">
                  <div>
                    <span className={`mb-5 inline-flex rounded-full px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.2em] ${group.chip}`}>
                      {group.eyebrow}
                    </span>
                    <h3 className="font-heading text-3xl font-semibold leading-tight tracking-[-0.035em] md:text-4xl">
                      {group.title}
                    </h3>
                    <p className={`mt-4 font-body text-sm leading-relaxed ${group.text}`}>
                      {group.detail}
                    </p>
                  </div>
                  <div className="mt-7 rounded-[1.25rem] bg-[#FBF8F2]/50 p-4 ring-1 ring-[#332A22]/8">
                    <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
                      diferencia clave
                    </p>
                    <p className="mt-2 font-body text-sm font-medium leading-snug">
                      {group.bestFor}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.plans.map((plan, index) => {
                    const presentation = getPackagePresentation(plan);
                    const price = Number(plan.price);
                    const classes = plan.class_limit ?? plan.classes_included ?? 1;
                    const pricePerClass = classes > 0 ? Math.round(price / classes) : price;

                    return (
                      <article
                        key={plan.id}
                        className={`group relative flex min-h-[23rem] flex-col overflow-hidden rounded-[1.8rem] p-5 ring-1 transition duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${presentation.card}`}
                        style={{ animationDelay: `${groupIndex * 80 + index * 55}ms` }}
                      >
                        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-current/25 to-transparent" />
                        <div className="mb-6 flex items-start justify-between gap-4">
                          <span className={`inline-flex rounded-full px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.18em] ${presentation.badge}`}>
                            {presentation.accentLabel}
                          </span>
                          <span className="font-body text-[11px] font-medium text-current/55">
                            {plan.duration_days} días
                          </span>
                        </div>

                        <div className="min-h-[8.5rem]">
                          <h4 className="font-heading text-2xl font-semibold leading-tight tracking-[-0.03em]">
                            {plan.name}
                          </h4>
                          <p className={`mt-3 font-body text-sm leading-relaxed ${presentation.text}`}>
                            {plan.description || presentation.promise}
                          </p>
                        </div>

                        <div className="mt-5 rounded-[1.35rem] bg-[#332A22]/[0.045] p-4 ring-1 ring-[#332A22]/[0.06]">
                          <div className="flex items-baseline gap-1">
                            <span className="font-heading text-4xl font-semibold tabular-nums tracking-[-0.05em]">
                              ${price.toLocaleString("es-MX")}
                            </span>
                            <span className="font-body text-[11px] font-medium opacity-60">MXN</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#FBF8F2]/65 px-3 py-1 font-body text-xs font-semibold ring-1 ring-[#332A22]/8">
                              {getClassesLabel(classes)}
                            </span>
                            <span className="rounded-full bg-[#FBF8F2]/65 px-3 py-1 font-body text-xs font-semibold ring-1 ring-[#332A22]/8">
                              ${pricePerClass.toLocaleString("es-MX")} por clase
                            </span>
                          </div>
                        </div>

                        <Button className={`mt-auto w-full rounded-full ${presentation.cta}`} asChild>
                          <Link to={`/login?returnUrl=${encodeURIComponent(`/app/checkout?plan=${plan.id}`)}`}>
                            Comprar {presentation.shortTitle.toLowerCase()}
                            <span className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF8F2]/15 transition-transform duration-300 group-hover:translate-x-1">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </Link>
                        </Button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-[#FBF8F2]/70 p-8 text-center ring-1 ring-[#332A22]/8">
            <p className="font-body text-sm text-[#625A50]">No hay paquetes activos por ahora.</p>
          </div>
        )}

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="rounded-[1.75rem] bg-[#FBF8F2]/72 p-7 ring-1 ring-[#332A22]/8">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#7E8579]" />
              <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-[#332A22]">
                Políticas simples
              </h3>
            </div>
            <ul className="space-y-3">
              {policies.map((policy) => (
                <li key={policy} className="flex gap-3 font-body text-sm text-[#625A50]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7E8579]" />
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
