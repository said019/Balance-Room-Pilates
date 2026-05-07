import { memo, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MessageSquare, Star } from "lucide-react";
import heroStudio from "@/assets/hero-studio.jpg";
import studioPilatesChairs from "@/assets/studio-pilates-chairs.jpg";
import studioBarre from "@/assets/studio-barre.jpg";
import studioRoom from "@/assets/studio-room.jpg";
import studioArches from "@/assets/studio-arches.jpg";
import coachesGroup from "@/assets/coaches-group.jpg";

const reviewSlots = [
  "Reseña 01",
  "Reseña 02",
  "Reseña 03",
  "Reseña 04",
];

type GalleryItem = {
  src: string;
  alt: string;
  kicker: string;
  caption: string;
};

const galleryImages: GalleryItem[] = [
  { src: heroStudio, alt: "Clase de meditación matutina", kicker: "Mañanas", caption: "Práctica en silencio antes de las 7" },
  { src: studioArches, alt: "Arcos del studio iluminados", kicker: "Arquitectura", caption: "Arcos blancos, luz cálida" },
  { src: studioBarre, alt: "Sala de barre", kicker: "Sala Barre", caption: "Pulsos finos y postura" },
  { src: coachesGroup, alt: "Equipo Balance Room", kicker: "El equipo", caption: "Coaches que acompañan" },
  { src: studioPilatesChairs, alt: "Sillas wunda alineadas", kicker: "Wunda", caption: "Resistencia en boutique" },
  { src: studioRoom, alt: "Sala de yoga y mat", kicker: "Mat", caption: "Mats sobre madera natural" },
];

const Testimonials = () => {
  return (
    <section className="py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-body text-balance-olive tracking-widest uppercase mb-4 block">
            Testimonios
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-light text-foreground">
            Lo que dirán
            <br />
            <span className="font-semibold text-balance-olive">nuestras clientas</span>
          </h2>
          <p className="mt-5 font-body text-lg text-muted-foreground">
            Este espacio queda listo para integrar reseñas verificadas cuando el studio quiera publicarlas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {reviewSlots.map((slot, index) => (
            <div
              key={slot}
              className="rounded-[1.5rem] border border-dashed border-[#CFC8B8] bg-card/70 p-6 sm:p-8"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-1 mb-5 text-[#B8AD9E]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4" strokeWidth={1.5} />
                ))}
              </div>

              <div className="min-h-[126px] rounded-2xl bg-muted/45 p-5">
                <MessageSquare className="mb-5 h-6 w-6 text-balance-olive/60" strokeWidth={1.5} />
                <div className="space-y-3">
                  <div className="h-3 w-full rounded-full bg-[#D8D0C2]" />
                  <div className="h-3 w-11/12 rounded-full bg-[#D8D0C2]" />
                  <div className="h-3 w-8/12 rounded-full bg-[#D8D0C2]" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[#CFC8B8] bg-muted/50">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div>
                  <span className="block font-body font-semibold text-foreground">
                    {slot}
                  </span>
                  <span className="text-sm font-body text-muted-foreground">
                    Pendiente por publicar
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <StudioGallery />
      </div>
    </section>
  );
};

// ──────────────────────────────────────────────────────────
// Studio Gallery — editorial bento with magnetic tilt
// ──────────────────────────────────────────────────────────

const galleryVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 110, damping: 22 },
  },
};

const StudioGallery = () => {
  const total = galleryImages.length;
  const [anchor, ...rest] = galleryImages;

  return (
    <div className="mt-28 lg:mt-36">
      <header className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end mb-12 lg:mb-16">
        <div>
          <span className="inline-flex items-center gap-3 font-body text-[11px] uppercase tracking-[0.22em] text-balance-olive">
            <span className="h-px w-10 bg-balance-olive/60" />
            Galería · {String(total).padStart(2, "0")}
          </span>
          <h3 className="mt-5 font-heading text-4xl md:text-5xl lg:text-[3.5rem] leading-[0.95] text-balance-dark">
            El studio,
            <br />
            <span className="italic font-light text-balance-olive">en detalle.</span>
          </h3>
        </div>
        <p className="font-body text-base text-muted-foreground max-w-md lg:max-w-sm lg:justify-self-end lg:text-right">
          Salas, equipo y luz natural. Captado dentro del espacio donde practicamos cada mañana.
        </p>
      </header>

      <motion.div
        variants={galleryVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 md:gap-5 lg:gap-6 grid-cols-2 lg:grid-cols-12 lg:auto-rows-[12rem]"
      >
        {/* Anchor — editorial hero (left, double height) */}
        <motion.figure
          variants={itemVariants}
          className="col-span-2 lg:col-span-7 lg:row-span-3 lg:translate-y-2"
        >
          <TiltImage item={anchor} index={1} variant="anchor" />
        </motion.figure>

        {/* Tall portrait card */}
        <motion.figure
          variants={itemVariants}
          className="col-span-1 lg:col-span-5 lg:row-span-2 lg:-translate-y-3"
        >
          <TiltImage item={rest[0]} index={2} variant="tall" />
        </motion.figure>

        {/* Wide landscape under the tall */}
        <motion.figure
          variants={itemVariants}
          className="col-span-1 lg:col-span-5 lg:row-span-1"
        >
          <TiltImage item={rest[1]} index={3} variant="wide" />
        </motion.figure>

        {/* Bottom row — three squares with offset */}
        <motion.figure
          variants={itemVariants}
          className="col-span-2 sm:col-span-1 lg:col-span-4 lg:row-span-2"
        >
          <TiltImage item={rest[2]} index={4} variant="square" />
        </motion.figure>

        <motion.figure
          variants={itemVariants}
          className="col-span-1 lg:col-span-4 lg:row-span-2 lg:translate-y-4"
        >
          <TiltImage item={rest[3]} index={5} variant="square" />
        </motion.figure>

        <motion.figure
          variants={itemVariants}
          className="col-span-1 lg:col-span-4 lg:row-span-2"
        >
          <TiltImage item={rest[4]} index={6} variant="square" />
        </motion.figure>
      </motion.div>

      <footer className="mt-10 flex items-center justify-between gap-6 border-t border-balance-dark/10 pt-6">
        <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Av. Insurgentes 51 · Tizatlalli
        </p>
        <p className="font-mono text-xs text-balance-olive">
          {String(total).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
      </footer>
    </div>
  );
};

// Magnetic tilt + caption — isolated for performance
type TiltVariant = "anchor" | "tall" | "wide" | "square";

const TiltImage = memo(function TiltImage({
  item,
  index,
  variant,
}: {
  item: GalleryItem;
  index: number;
  variant: TiltVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rx = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 180, damping: 22 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 180, damping: 22 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const aspect =
    variant === "anchor"
      ? "aspect-[4/5] lg:aspect-auto lg:h-full"
      : variant === "tall"
        ? "aspect-[3/4] lg:aspect-auto lg:h-full"
        : variant === "wide"
          ? "aspect-[16/10] lg:aspect-auto lg:h-full"
          : "aspect-square lg:aspect-auto lg:h-full";

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      className={`group relative h-full w-full overflow-hidden rounded-[1.25rem] bg-balance-cream ring-1 ring-balance-dark/5 ${aspect}`}
    >
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
      />

      {/* Tinted vignette for caption legibility — always-on, subtle */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-balance-dark/70 via-balance-dark/10 to-transparent" />

      {/* Top-left index marker (editorial page number) */}
      <div className="absolute left-4 top-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-balance-cream/85">
        <span className="h-1 w-1 rounded-full bg-balance-cream/85" />
        {String(index).padStart(2, "0")} / {String(galleryImages.length).padStart(2, "0")}
      </div>

      {/* Caption — always visible, refined hover lift */}
      <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6">
        <span className="font-body text-[10px] uppercase tracking-[0.22em] text-balance-cream/75">
          {item.kicker}
        </span>
        <p className="mt-1.5 font-heading text-lg lg:text-xl leading-tight text-balance-cream">
          {item.caption}
        </p>
        <span className="mt-3 block h-px w-8 origin-left scale-x-50 bg-balance-cream/70 transition-transform duration-500 ease-out group-hover:scale-x-100" />
      </div>

      {/* Inner refraction edge */}
      <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
    </motion.div>
  );
});

export default Testimonials;
