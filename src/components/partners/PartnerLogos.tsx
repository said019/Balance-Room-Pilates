import { cn } from '@/lib/utils';

const WELLHUB_LOGO_URL =
  'https://assets-cdn.wellhub.com/images/mep-cms/horizontal_complete_logo_magenta_3_e637a577de.png';
const TOTALPASS_LOGO_URL =
  'https://totalpass.com/_next/static/media/totalpass-desktop-white.ce53e1c2.svg';

export function WellhubLogo({ className }: { className?: string }) {
  return (
    <img
      alt="Wellhub"
      className={cn('h-5 w-auto object-contain', className)}
      decoding="async"
      draggable={false}
      src={WELLHUB_LOGO_URL}
    />
  );
}

export function TotalPassLogo({ className }: { className?: string }) {
  return (
    <span
      aria-label="TotalPass"
      className="inline-flex rounded-md bg-[#121212] px-2.5 py-1.5"
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className={cn('h-4 w-auto object-contain', className)}
        decoding="async"
        draggable={false}
        src={TOTALPASS_LOGO_URL}
      />
    </span>
  );
}
