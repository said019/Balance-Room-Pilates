import {
  ArrowRight,
  CircleDot,
  Dumbbell,
  Flame,
  Flower2,
  Thermometer,
  Waves,
} from "lucide-react";
import studioRoom from "@/assets/studio-room.jpg";

const classes = [
  {
    name: "Yoga",
    mood: "calma",
    description: "Respiración, movilidad y presencia para entrar en calma sin perder fuerza.",
    tone: "#7E8579",
    icon: Flower2,
    span: "lg:col-span-5",
  },
  {
    name: "Hot yoga",
    mood: "calor suave",
    description: "Secuencias fluidas en ambiente cálido para sudar, soltar tensión y mejorar resistencia.",
    tone: "#8A8174",
    icon: Thermometer,
    span: "lg:col-span-4",
  },
  {
    name: "Pilates mat",
    mood: "core",
    description: "Trabajo de centro, postura y control con progresiones para todos los niveles.",
    tone: "#7E8580",
    icon: CircleDot,
    span: "lg:col-span-3",
  },
  {
    name: "Hot Pilates",
    mood: "intensidad",
    description: "Pilates con calor, estabilidad y energía en una sesión retadora.",
    tone: "#8F7D68",
    icon: Flame,
    span: "lg:col-span-3",
  },
  {
    name: "Silla wunda",
    mood: "equipo",
    description: "Resistencia, precisión y correcciones puntuales para activar músculos profundos.",
    tone: "#6F776C",
    icon: null,
    image: "/pilates-chair.png",
    span: "lg:col-span-4",
  },
  {
    name: "Sculpt",
    mood: "fuerza",
    description: "Tonificación full body con movimientos controlados y ritmo dinámico.",
    tone: "#9E927F",
    icon: Dumbbell,
    span: "lg:col-span-3",
  },
  {
    name: "Barre",
    mood: "postura",
    description: "Ballet, pilates y pulsos finos para alargar, tonificar y mejorar postura.",
    tone: "#837A70",
    icon: Waves,
    span: "lg:col-span-5",
  },
];

const ClassTypes = () => {
  return (
    <section id="clases" className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end mb-14">
          <div>
            <span className="text-sm font-body text-balance-olive tracking-widest uppercase mb-4 block">
              disciplinas
            </span>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground mb-6 text-balance">
              7 formas de moverte, todas en grupos pequeños.
            </h2>
          </div>
          <div className="max-w-2xl lg:ml-auto">
            <p className="font-body text-lg text-muted-foreground">
              Balance Room dará Yoga, Hot yoga, Pilates mat, Hot Pilates,
              Silla wunda, Sculpt y Barre. Cada clase tiene 6 lugares para
              cuidar técnica, ritmo y atención personalizada.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {classes.map((classType, index) => {
            const Icon = classType.icon;

            return (
              <article
                key={classType.name}
                className={`group rounded-[1.75rem] bg-black/[0.035] p-1.5 transition-all duration-700 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${classType.span}`}
              >
                <div className="relative min-h-[235px] overflow-hidden rounded-[1.35rem] bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-black/5">
                  <div
                    className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-125"
                    style={{ backgroundColor: classType.tone }}
                  />

                  <div className="relative flex h-full min-h-[187px] flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-[1.15rem] ring-1 ring-black/5"
                        style={{ backgroundColor: `${classType.tone}1F`, color: classType.tone }}
                      >
                        {classType.image ? (
                          <img
                            src={classType.image}
                            alt=""
                            className="h-8 w-8 object-contain opacity-85"
                          />
                        ) : Icon ? (
                          <Icon className="h-5 w-5" strokeWidth={1.7} />
                        ) : null}
                      </span>
                      <div className="text-right">
                        <span className="block font-body text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="mt-2 inline-flex rounded-full px-3 py-1 font-body text-[10px] uppercase tracking-[0.14em]"
                          style={{ backgroundColor: `${classType.tone}18`, color: classType.tone }}
                        >
                          {classType.mood}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <h3 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
                        {classType.name}
                      </h3>
                      <p className="font-body text-sm leading-relaxed text-muted-foreground mt-3 max-w-[34rem]">
                        {classType.description}
                      </p>
                      <a
                        href="#horarios"
                        className="mt-6 inline-flex items-center gap-2 font-body text-sm font-semibold transition-all duration-500 group-hover:gap-4"
                        style={{ color: classType.tone }}
                      >
                        Ver horarios
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-20 overflow-hidden rounded-[2rem] bg-black/[0.035] p-1.5">
          <div className="grid overflow-hidden rounded-[1.6rem] bg-muted lg:grid-cols-2">
            <div className="relative min-h-[320px] lg:min-h-full overflow-hidden">
              <img
                src={studioRoom}
                alt="Sala del studio Balance Room"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
            </div>

            <div className="p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
              <span className="text-xs font-body uppercase tracking-[0.2em] text-balance-olive mb-4">
                cómo se vive
              </span>
              <h3 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-6 text-balance">
                Personalizado, diverso y con espacio para sentirte acompañada.
              </h3>
              <div className="grid gap-5 sm:grid-cols-3">
                {["3 estudios activos", "6 lugares por clase", "Sin check-in QR por ahora"].map((item) => (
                  <div key={item} className="border-t border-border pt-4 font-body text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClassTypes;
