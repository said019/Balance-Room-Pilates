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

const galleryImages = [
  { src: heroStudio, alt: "Clase de meditación" },
  { src: studioBarre, alt: "Sala de barre" },
  { src: coachesGroup, alt: "Equipo Balance Room" },
  { src: studioPilatesChairs, alt: "Sillas de Pilates" },
  { src: studioRoom, alt: "Sala de yoga y mat" },
  { src: studioArches, alt: "Arcos del studio" },
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

        <div className="mt-20">
          <div className="text-center mb-10">
            <h3 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3">
              Galería del studio
            </h3>
            <p className="font-body text-base text-muted-foreground max-w-xl mx-auto">
              Clases, detalles e instalaciones del studio.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className={`group relative overflow-hidden rounded-lg bg-muted ${
                  i === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 aspect-square md:aspect-auto' : 'aspect-square'
                }`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-body uppercase tracking-wider opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  {img.alt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
