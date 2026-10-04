import { useState } from 'react';

const publicMedia = 'https://api.2707altitud.com.mx/api/media/public/';
const posterSizes = '(max-width: 767px) calc(100vw - 48px), (max-width: 1151px) calc((100vw - 96px) / 2), 528px';

export const ADDITIONAL_PUBLIC_IMAGES = {
  hero: {
    src: `${publicMedia}c8cefb64-5004-4fc8-a926-7ae769b379ce`, width: 1200, height: 799,
    alt: 'Atletas de Altitud cruzando la meta en una competencia híbrida',
    // The tall desktop frame crops the landscape photo: keep native detail there.
    // On mobile, cover needs at least 360px * 1200/799 = 541 source pixels at 1x.
    sizes: '(max-width: 767px) max(calc(100vw - 48px), 541px), 1200px',
  },
  classes: {
    src: `${publicMedia}12288703-5b04-4b51-b159-d441e7cb0833`, width: 853, height: 880,
    alt: 'Invitación de 2707 Altitud a las clases gratis de apertura', sizes: posterSizes,
  },
  inauguration: {
    src: `${publicMedia}ccef5db1-2c45-4096-9048-e85b5c734c60`, width: 853, height: 1014,
    alt: 'Invitación a la inauguración Training Experience de 2707 Altitud', sizes: posterSizes,
  },
} as const;

export function AdditionalPublicImage({ image, className }: {
  image: keyof typeof ADDITIONAL_PUBLIC_IMAGES; className?: string;
}) {
  const photo = ADDITIONAL_PUBLIC_IMAGES[image];
  const [variantsAvailable, setVariantsAvailable] = useState(true);
  return <picture>
    {variantsAvailable && <source type="image/webp"
      srcSet={`${photo.src}/variants/640.webp 640w, ${photo.src}/variants/${photo.width}.webp ${photo.width}w`}
      sizes={photo.sizes} />}
    <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height}
      className={className} loading={image === 'hero' ? undefined : 'lazy'}
      referrerPolicy={image === 'hero' ? 'no-referrer' : undefined}
      onError={() => setVariantsAvailable(false)} />
  </picture>;
}
