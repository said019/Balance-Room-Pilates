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

const studio: StudioInfo = {
  "slug": "altitud2707",
  "name": "2707 Altitud",
  "tagline": "Tu siguiente nivel empieza aquí.",
  "description": "Entrenamiento híbrido y funcional en grupos pequeños.",
  "addressLine": "Ubicación exacta por confirmar",
  "city": "Zinacantepec",
  "state": "Estado de México",
  "postalCode": "",
  "phone": "",
  "whatsapp": "",
  "email": "",
  "instagram": "",
  "mapUrl": "",
  "classTypes": [],
  "bank": {
    "name": "",
    "account": "",
    "clabe": "",
    "beneficiary": ""
  },
  "businessHours": [],
  "palette": {
    "background": "45 31% 95%",
    "foreground": "60 6% 10%",
    "card": "45 31% 97%",
    "cardForeground": "60 6% 10%",
    "popover": "45 31% 95%",
    "popoverForeground": "60 6% 10%",
    "primary": "64 38% 28%",
    "primaryForeground": "45 31% 95%",
    "secondary": "28 29% 39%",
    "secondaryForeground": "45 31% 95%",
    "muted": "44 20% 88%",
    "mutedForeground": "60 7% 36%",
    "accent": "38 34% 71%",
    "accentForeground": "60 6% 10%",
    "border": "38 22% 78%",
    "input": "38 22% 78%",
    "ring": "64 38% 28%",
    "heroGradient": "#F6F4EE",
    "cardGradient": "#F6F4EE",
    "overlayDark": "linear-gradient(180deg,transparent,#1C1C19)",
    "glowSage": "none",
    "glowWarm": "none"
  }
};

export const getStudioBySlug = (_slug?: string): StudioInfo => studio;
