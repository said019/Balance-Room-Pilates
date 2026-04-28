import { Button } from "@/components/ui/button";
import { CalendarCheck, Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "Lealtad",
    description: "Gana puntos por asistir y participar.",
  },
  {
    icon: Gift,
    title: "Puntos por clase",
    description: "Acumula puntos y canjéalos por recompensas.",
  },
  {
    icon: CalendarCheck,
    title: "Reserva al instante",
    description: "Agenda y gestiona tus clases desde tu teléfono.",
  },
];

const WalletClub = () => {
  return (
    <section id="lealtad" className="py-16 lg:py-20 bg-balance-olive text-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-center">
          {/* Content - takes 2 cols */}
          <div className="lg:col-span-2 text-center lg:text-left">
            <h2 className="font-heading text-3xl md:text-4xl font-light mb-4">
              Tu lealtad,
              <br />
              <span className="font-semibold italic">también se premia</span>
            </h2>
            <p className="font-body text-sm text-white/75 mb-6 max-w-md mx-auto lg:mx-0">
              Acumula puntos, revisa tus recompensas y reserva desde tu teléfono.
            </p>
            <div className="flex gap-3 justify-center lg:justify-start">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-balance-olive hover:bg-white/90 font-semibold"
                asChild
              >
                <Link to="/app/wallet">Ver mis puntos</Link>
              </Button>
              <Button
                variant="heroOutline"
                size="sm"
                className="border-white/40 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/app/wallet/rewards">Ver recompensas</Link>
              </Button>
            </div>
          </div>

          {/* Features - takes 3 cols */}
          <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 border border-white/10 rounded-sm p-5 hover:bg-white/10 transition-colors"
              >
                <feature.icon className="w-7 h-7 text-white/80 mb-3" />
                <h3 className="font-heading text-base font-semibold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="font-body text-xs text-white/65 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletClub;
