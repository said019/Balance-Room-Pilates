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
    detail: 'Créditos para una sola sala: los entrenamientos del studio. Más claro si ya sabes dónde quieres entrenar.',
    bestFor: 'Ideal para rutina fija, progreso técnico y práctica constante.',
    rule: 'Eliges estudio al comprar.',
    accentLabel: 'enfoque',
    surface: 'bg-[#ECEDE3]',
    panel: 'bg-[#F5F1E8] text-[#1C1C19] ring-[#8A927F]/24',
    card: 'bg-[#FDFBF6] text-[#1C1C19] ring-[#B7BEAE]/34 shadow-[0_24px_80px_-68px_rgba(51,42,34,.65)] hover:ring-[#8A927F]/52',
    chip: 'bg-[#838C78] text-[#FBF8F2]',
    badge: 'bg-[#ECEFE4] text-[#68725F] ring-[#8A927F]/20',
    cta: 'bg-[#838C78] text-[#FBF8F2] hover:bg-[#747D69]',
    selected: 'ring-2 ring-[#8A927F]/58 shadow-[0_22px_74px_-56px_rgba(51,42,34,.72)]',
    dot: 'bg-[#9BA391]',
    text: 'text-[#666356]',
  },
  mixto: {
    type: 'mixto',
    title: 'Mixto',
    shortTitle: 'Mixto',
    eyebrow: 'tres estudios',
    promise: 'Muévete entre todas las salas',
    detail: 'Créditos flexibles para reservar los entrenamientos del studio según tu semana.',
    bestFor: 'Ideal si alternas disciplinas o quieres más libertad para agendar.',
    rule: 'Un solo paquete, tres posibilidades.',
    accentLabel: 'flexible',
    surface: 'bg-[#E6ECE9]',
    panel: 'bg-[#F1EFE7] text-[#2E332D] ring-[#6F8A83]/24',
    card: 'bg-[#FCFAF4] text-[#2E332D] ring-[#AABBB5]/34 shadow-[0_24px_80px_-68px_rgba(51,42,34,.65)] hover:ring-[#6F8A83]/52',
    chip: 'bg-[#6F8A83] text-[#FBF8F2]',
    badge: 'bg-[#E5ECE8] text-[#5B746E] ring-[#6F8A83]/20',
    cta: 'bg-[#6F8A83] text-[#FBF8F2] hover:bg-[#607972]',
    selected: 'ring-2 ring-[#6F8A83]/58 shadow-[0_22px_74px_-56px_rgba(51,42,34,.72)]',
    dot: 'bg-[#8DA49D]',
    text: 'text-[#5F6760]',
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
