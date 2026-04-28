export interface StudioClassType {
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  durationMinutes: number;
  maxCapacity: number;
  icon?: string;
}

export interface StudioPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  heroGradient: string;
  cardGradient: string;
  overlayDark: string;
  glowSage: string;
  glowWarm: string;
}

export interface StudioInfo {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  mapUrl: string;
  classTypes: StudioClassType[];
  bank: {
    name: string;
    account: string;
    clabe: string;
    beneficiary: string;
  };
  businessHours: Array<{ label: string; hours: string }>;
  palette: StudioPalette;
}

const studioDirectory: Record<string, StudioInfo> = {
  balance: {
    slug: 'balance',
    name: 'Balance Room Pilates',
    tagline: 'Yoga, Pilates, Barre y Sculpt en un espacio sereno.',
    description:
      'Sesiones pequeñas, atención personalizada y paquetes de créditos con vigencia mensual.',
    addressLine: 'Hermenegildo Galeana Int. Local 4',
    city: 'San Juan del Río',
    state: 'Qro.',
    postalCode: '76803',
    phone: '+52 427 100 7347',
    whatsapp: '+52 427 100 7347',
    email: 'hola@balanceroom.mx',
    instagram: '@balanceroom.pilates',
    mapUrl: 'https://maps.google.com/?q=Hermenegildo+Galeana+Int+Local+4+Centro+76803+San+Juan+del+Rio+Qro',
    classTypes: [
      {
        name: 'Yoga',
        description:
          'Movimiento consciente, respiración y movilidad para entrar en calma sin perder fuerza.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'leaf',
      },
      {
        name: 'Pilates Mat',
        description:
          'Trabajo preciso de core, postura y control con progresiones para todos los niveles.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'target',
      },
      {
        name: 'Hot yoga',
        description:
          'Secuencias fluidas en ambiente cálido para sudar, soltar tensión y mejorar resistencia.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'flame',
      },
      {
        name: 'Hot Pilates',
        description:
          'Pilates con intensidad y calor: fuerza, estabilidad y energía en una sesión retadora.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'flame',
      },
      {
        name: 'Silla wunda',
        description:
          'Clase boutique con equipo, resistencia y correcciones puntuales para activar músculos profundos.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'sparkles',
      },
      {
        name: 'Sculpt',
        description:
          'Entrenamiento de cuerpo completo (full body) o enfocado en grupos musculares específicos con movimientos controlados, sentadillas, planchas y ejercicios con resistencia para tonificar. Fusiona elementos de fuerza, entrenamiento funcional, pilates y a veces yoga o HIIT. Mejora la fuerza, potencia, resistencia, flexibilidad y quema calorías.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'waves',
      },
      {
        name: 'Barre',
        description:
          'Ballet, pilates y pulsos finos para alargar, tonificar y mejorar postura.',
        level: 'all',
        durationMinutes: 50,
        maxCapacity: 6,
        icon: 'sparkles',
      },
    ],
    bank: {
      name: 'BBVA',
      account: '0123456789',
      clabe: '012345678901234567',
      beneficiary: 'Balance Room Pilates',
    },
    businessHours: [
      { label: 'Mañana', hours: '3 clases desde las 7:00' },
      { label: 'Tarde', hours: '3 clases desde las 17:00' },
      { label: 'Estudios', hours: '3 salas con cupo de 6' },
      { label: 'Cancelación', hours: 'Hasta 5 horas antes' },
    ],
    palette: {
      background: '44 32% 94%',
      foreground: '38 12% 30%',
      card: '44 28% 96%',
      cardForeground: '38 12% 30%',
      popover: '44 32% 94%',
      popoverForeground: '38 12% 30%',
      primary: '38 14% 38%',
      primaryForeground: '44 32% 94%',
      secondary: '70 12% 46%',
      secondaryForeground: '44 32% 94%',
      muted: '44 20% 88%',
      mutedForeground: '38 10% 46%',
      accent: '40 22% 82%',
      accentForeground: '38 12% 30%',
      border: '42 16% 84%',
      input: '42 16% 84%',
      ring: '38 14% 38%',
      heroGradient:
        'linear-gradient(135deg, hsl(44 34% 95%) 0%, hsl(40 26% 91%) 50%, hsl(70 16% 84%) 100%)',
      cardGradient:
        'linear-gradient(180deg, hsl(44 30% 96%) 0%, hsl(44 22% 92%) 100%)',
      overlayDark:
        'linear-gradient(180deg, hsla(38, 12%, 25%, 0.2) 0%, hsla(38, 12%, 25%, 0.55) 100%)',
      glowSage: '0 12px 32px hsla(70, 12%, 46%, 0.2)',
      glowWarm: '0 12px 32px hsla(40, 22%, 60%, 0.18)',
    },
  },
};

const formatSlugName = (slug: string) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const getStudioBySlug = (slug?: string): StudioInfo => {
  if (!slug) {
    return studioDirectory.balance;
  }

  const normalized = slug.toLowerCase();
  if (studioDirectory[normalized]) {
    return studioDirectory[normalized];
  }

  return {
    ...studioDirectory.balance,
    slug: normalized,
    name: formatSlugName(normalized),
  };
};
