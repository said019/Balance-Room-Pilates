import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroStudio from "@/assets/hero-studio.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#2f281f]" />
        <img
          src={heroStudio}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-30 lg:hidden"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_24%,rgba(126,133,121,0.42),transparent_38%),radial-gradient(ellipse_at_82%_74%,rgba(207,200,184,0.22),transparent_32%),linear-gradient(135deg,#332A22_0%,#51483E_48%,#7E8579_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211b15]/85 via-[#211b15]/30 to-[#f6f1e7]/5" />
        {/* Framed studio photo — visible on mobile (compact) and desktop (large floating card) */}
        <div className="absolute right-4 top-20 h-[34vh] w-[60vw] max-w-[300px] rounded-[1.5rem] border border-white/16 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] lg:right-4 lg:top-24 lg:h-[54vh] lg:w-[38vw] lg:max-w-none lg:min-w-[420px] lg:rounded-[2rem] lg:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <img
            src={heroStudio}
            alt="Clase Balance Room Pilates"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      <div className="relative z-10 w-full pb-24 pt-40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white/80 backdrop-blur-md animate-fade-up">
              <img
                src="/balance-room-logo-transparent.png"
                alt="Balance Room Pilates"
                className="h-9 w-auto object-contain"
              />
              <span className="font-body text-[11px] uppercase tracking-[0.22em]">
                studio boutique · 3 salas · 6 lugares
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[0.95] mb-6 animate-fade-up">
              Balance Room
              <br />
              <span className="font-semibold italic text-[#D8CAB0]">
                Pilates
              </span>
            </h1>

            <p className="font-body text-base md:text-xl text-white/75 max-w-2xl mb-9 animate-fade-up delay-100 leading-relaxed text-pretty">
              Yoga, Hot yoga, Pilates mat, Hot Pilates, Silla wunda, Sculpt y
              Barre en clases pequeñas, cercanas y personalizadas.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 animate-fade-up delay-200">
              <Button variant="hero" size="xl" asChild className="group bg-[#7F8372] hover:bg-[#707563] rounded-full w-full sm:w-auto text-center justify-center">
                <a href="#precios">
                  Ver paquetes
                  <span className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                className="rounded-full border-white/30 text-white hover:bg-white/10 w-full sm:w-auto justify-center"
                asChild
              >
                <a href="#horarios">Explorar horarios</a>
              </Button>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3 animate-fade-up delay-300">
              {[
                ["7", "disciplinas"],
                ["6", "lugares por clase"],
                ["30", "días de vigencia"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <span className="block font-heading text-3xl text-white">{value}</span>
                  <span className="font-body text-[11px] uppercase tracking-[0.16em] text-white/60">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <a
            href="#clases"
            className="flex flex-col items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors"
          >
            <span className="text-[10px] font-body tracking-[0.2em] uppercase">
              Descubre
            </span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
