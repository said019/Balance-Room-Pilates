import { MapPin, Navigation } from 'lucide-react';

const STUDIO_ADDRESS_LINE1 = 'Av. Insurgentes 51, Mz. 006';
const STUDIO_ADDRESS_LINE2 = 'San Salvador Tizatlalli, 52172';
const STUDIO_ADDRESS_LINE3 = 'Estado de México';
const MAP_LINK = 'https://maps.app.goo.gl/d54t7iVdL5DzWgYy9?g_st=iw';
const MAP_EMBED =
  'https://www.google.com/maps?q=Av.+Insurgentes+51,+San+Salvador+Tizatlalli,+52172,+Edo.+M%C3%A9x.&output=embed';

const Location = () => {
  return (
    <section id="ubicacion" className="py-20 lg:py-28 bg-muted/20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-balance-olive/25 bg-balance-cream/65 px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
            <MapPin className="h-3.5 w-3.5" />
            Visítanos
          </span>
          <h2 className="mt-5 font-heading text-4xl md:text-5xl font-light tracking-[-0.03em] text-foreground">
            Encuéntranos en <em className="font-semibold italic text-balance-olive">San Salvador Tizatlalli</em>
          </h2>
          <p className="mt-4 max-w-xl font-body text-base text-muted-foreground leading-relaxed">
            Nuestro studio boutique está a unos minutos del centro. Ven a conocer las salas, tomar tu primera clase o resolver dudas con el equipo.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-8 items-stretch">
          {/* Address card */}
          <div className="rounded-[1.75rem] border border-border bg-card p-7 lg:p-8 flex flex-col justify-between shadow-[0_18px_58px_-50px_rgba(51,42,34,0.45)]">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-balance-olive/12 text-balance-olive">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Dirección
                  </p>
                  <p className="mt-1.5 font-heading text-lg font-medium leading-snug text-foreground">
                    {STUDIO_ADDRESS_LINE1}
                  </p>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {STUDIO_ADDRESS_LINE2}
                    <br />
                    {STUDIO_ADDRESS_LINE3}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-balance-cream/55 border border-balance-olive/15 p-4">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-balance-olive">
                  Horarios
                </p>
                <p className="mt-1.5 font-body text-sm text-foreground leading-relaxed">
                  Mañanas desde las <strong>7:00</strong> · tardes desde las <strong>17:00</strong>
                </p>
              </div>
            </div>

            <a
              href={MAP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-balance-olive px-6 py-3 font-body text-sm font-semibold text-balance-cream transition-colors hover:bg-balance-olive/90"
            >
              <Navigation className="h-4 w-4" />
              Cómo llegar
            </a>
          </div>

          {/* Embedded map */}
          <div className="rounded-[1.75rem] overflow-hidden border border-border shadow-[0_18px_58px_-50px_rgba(51,42,34,0.55)] min-h-[320px] lg:min-h-[420px]">
            <iframe
              title="Ubicación Balance Room Pilates"
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[320px] lg:min-h-[420px] border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
