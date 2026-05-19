export type PackageType = 'individual' | 'mixto' | 'sample';

export interface PlanPresentationInput {
  name: string;
  category?: string | null;
  package_type?: PackageType;
  requires_studio_selection?: boolean;
}

export interface PackagePresentation {
  type: PackageType;
  title: string;
  shortTitle: string;
  eyebrow: string;
  promise: string;
  detail: string;
  bestFor: string;
  rule: string;
  accentLabel: string;
  surface: string;
  panel: string;
  card: string;
  chip: string;
  badge: string;
  cta: string;
  selected: string;
  dot: string;
  text: string;
}

export const packageOrder: PackageType[] = ['sample', 'individual', 'mixto'];

export const packagePresentations: Record<PackageType, PackagePresentation> = {
  sample: {
    type: 'sample',
    title: 'Clase muestra',
    shortTitle: 'Muestra',
    eyebrow: 'primera visita',
    promise: 'Prueba sin comprometerte',
    detail: 'Una clase para sentir el ritmo del estudio antes de comprar más créditos.',
    bestFor: 'Ideal si vienes por primera vez o quieres explorar una disciplina.',
    rule: 'Una entrada, una experiencia concreta.',
    accentLabel: 'descubrir',
    surface: 'bg-[#EFE2D2]',
    panel: 'bg-[#F7EFE5] text-[#3A2D24] ring-[#B88968]/25',
    card: 'bg-[#FBF6EE] text-[#3A2D24] ring-[#C99F7A]/28 hover:ring-[#A87454]/45',
    chip: 'bg-[#9B6C52] text-[#FFF8EE]',
    badge: 'bg-[#F1D7C2] text-[#6F4C39] ring-[#A87454]/20',
    cta: 'bg-[#9B6C52] text-[#FFF8EE] hover:bg-[#855B45]',
    selected: 'ring-2 ring-[#9B6C52]/70 shadow-[0_22px_70px_-52px_rgba(155,108,82,.95)]',
    dot: 'bg-[#B88968]',
    text: 'text-[#6B5546]',
  },
  individual: {
    type: 'individual',
    title: 'Individual',
    shortTitle: 'Individual',
    eyebrow: 'un estudio',
    promise: 'Enfócate en tu sala favorita',
    detail: 'Créditos para una sola sala: Wunda, Barre o Hot Room. Más claro si ya sabes dónde quieres entrenar.',
    bestFor: 'Ideal para rutina fija, progreso técnico y práctica constante.',
    rule: 'Eliges estudio al comprar.',
    accentLabel: 'enfoque',
    surface: 'bg-[#EFF6D8]',
    panel: 'bg-[#F0F7DE] text-[#2F3A18] ring-[#8FA64E]/35',
    card: 'bg-[#FBFFF0] text-[#2F3A18] ring-[#A9C85F]/45 shadow-[0_24px_82px_-58px_rgba(93,115,43,.9)] hover:ring-[#718737]/70',
    chip: 'bg-[#657C2F] text-[#FBFFF0]',
    badge: 'bg-[#E0F0B9] text-[#4E6324] ring-[#8FA64E]/30',
    cta: 'bg-[#657C2F] text-[#FBFFF0] hover:bg-[#566A28]',
    selected: 'ring-2 ring-[#8FA64E]/80 shadow-[0_24px_82px_-48px_rgba(93,115,43,.95)]',
    dot: 'bg-[#9FBE53]',
    text: 'text-[#5D6D3E]',
  },
  mixto: {
    type: 'mixto',
    title: 'Mixto',
    shortTitle: 'Mixto',
    eyebrow: 'tres estudios',
    promise: 'Muévete entre todas las salas',
    detail: 'Créditos flexibles para reservar Wunda, Barre o Hot Room según tu semana.',
    bestFor: 'Ideal si alternas disciplinas o quieres más libertad para agendar.',
    rule: 'Un solo paquete, tres posibilidades.',
    accentLabel: 'flexible',
    surface: 'bg-[#D8F5EC]',
    panel: 'bg-[#E5F8F1] text-[#123931] ring-[#12A485]/35',
    card: 'bg-[#F0FFFA] text-[#123931] ring-[#18B996]/45 shadow-[0_26px_90px_-62px_rgba(8,122,104,.95)] hover:ring-[#087A68]/75',
    chip: 'bg-[#087A68] text-[#F5FFFB]',
    badge: 'bg-[#C7F4E7] text-[#075F51] ring-[#12A485]/30',
    cta: 'bg-[#087A68] text-[#F5FFFB] hover:bg-[#056353]',
    selected: 'ring-2 ring-[#18B996]/85 shadow-[0_24px_90px_-46px_rgba(8,122,104,.95)]',
    dot: 'bg-[#18B996]',
    text: 'text-[#346B61]',
  },
};

export function getPackageType(plan: PlanPresentationInput): PackageType {
  if (plan.package_type) return plan.package_type;

  const name = plan.name.toLowerCase();
  const category = (plan.category || '').toLowerCase();

  if (
    category.includes('trial') ||
    category.includes('sample') ||
    name.includes('muestra') ||
    name.includes('prueba') ||
    name.includes('drop')
  ) {
    return 'sample';
  }

  if (plan.requires_studio_selection || name.includes('individual')) {
    return 'individual';
  }

  return 'mixto';
}

export function getPackagePresentation(plan: PlanPresentationInput): PackagePresentation {
  return packagePresentations[getPackageType(plan)];
}

export function getClassesLabel(classLimit?: number | null, fallback = 1) {
  const classes = classLimit ?? fallback;
  if (classes <= 0) return 'Acceso';
  return `${classes} clase${classes > 1 ? 's' : ''}`;
}
