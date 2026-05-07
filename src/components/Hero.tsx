import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroStudio from "@/assets/hero-studio.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden lg:min-h-[100dvh] lg:items-end">
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
        {/* Framed studio photo stays off phones so the mobile hero can breathe. */}
        <div className="hidden md:block absolute right-6 top-28 h-[42vh] w-[44vw] max-w-[420px] rounded-[1.75rem] border border-white/16 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] lg:right-4 lg:top-24 lg:h-[54vh] lg:w-[38vw] lg:max-w-none lg:min-w-[420px] lg:rounded-[2rem] lg:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <img
            src={heroStudio}
            alt="Clase Balance Room Pilates"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>
      </div>

      <div className="relative z-10 w-full pb-16 pt-28 sm:pt-36 lg:pb-24 lg:pt-40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-[34rem] lg:max-w-4xl">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white/80 backdrop-blur-md animate-fade-up sm:mb-7 sm:gap-3 sm:px-4">
              <img
                src="/balance-room-logo-transparent.png"
                alt="Balance Room Pilates"
                className="h-7 w-auto shrink-0 object-contain sm:h-9"
              />
              <span className="font-body text-[9px] uppercase tracking-[0.18em] sm:text-[11px] sm:tracking-[0.22em]">
                studio boutique · 3 salas · 6 lugares
              </span>
            </div>

            <h1 className="font-heading text-[clamp(3.35rem,17vw,5.25rem)] md:text-7xl lg:text-8xl font-light text-white leading-[0.92] mb-5 sm:mb-6 animate-fade-up">
              Balance Room
              <br />
              <span className="font-semibold italic text-[#D8CAB0]">
                Pilates
              </span>
            </h1>

            <p className="font-body text-[15px] md:text-xl text-white/75 max-w-[30rem] lg:max-w-2xl mb-7 sm:mb-9 animate-fade-up delay-100 leading-relaxed text-pretty">
              Yoga, Hot yoga, Pilates mat, Hot Pilates, Silla wunda, Sculpt y
              Barre en clases pequeñas, cercanas y personalizadas.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 animate-fade-up delay-200">
              <Button variant="hero" size="xl" asChild className="group min-h-14 bg-[#7F8372] hover:bg-[#707563] rounded-full w-full sm:w-auto text-center justify-center px-6 text-base sm:px-10 sm:text-lg">
                <Link to="/login">
                  Iniciar sesión
                  <span className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-1 sm:h-8 sm:w-8">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                className="min-h-14 rounded-full border-white/30 text-white hover:bg-white/10 w-full sm:w-auto justify-center px-6 text-base sm:px-10 sm:text-lg"
                asChild
              >
                <a href="#horarios">Explorar horarios</a>
              </Button>
            </div>

            <div className="mt-10 hidden max-w-2xl grid-cols-3 gap-3 animate-fade-up delay-300 sm:grid lg:mt-12">
              {[
                ["7", "disciplinas"],
                ["6", "lugares por clase"],
                ["30", "días de vigencia"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-[8.5rem] rounded-[1.35rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <span className="block font-heading text-3xl text-white sm:text-4xl">{value}</span>
                  <span className="font-body text-[10px] uppercase tracking-[0.14em] text-white/60 sm:text-[11px] sm:tracking-[0.16em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-float sm:block">
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
