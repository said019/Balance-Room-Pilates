// Confirmed studio information. Promotional names and unconfirmed validity periods
// remain descriptive until the studio supplies them. Never store bank details here.
export const STUDIO = {
  name: '2707 Altitud',
  capacity: 12,
  cancellationHours: 4,
  address: 'Plaza Bosques, locales 4 y 5. Zinacantepec, Estado de México.',
  phone: '720 103 5409',
  phoneHref: 'tel:+527201035409',
  whatsappHref: 'https://wa.me/527201035409',
  mapHref: 'https://maps.app.goo.gl/Sm3s5YHYSPozYT476?g_st=iw',
  instagramHref: 'https://www.instagram.com/altitud2707/',
  facebookHref: 'https://www.facebook.com/Altitud2707',
  socialHandle: '@Altitud2707',
  weekdayTimes: ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '6:00 PM', '7:00 PM', '8:00 PM'],
  weekendTimes: ['8:00 AM', '9:00 AM'],
  attentionHours: ['6:00 a 10:00 AM', '5:00 a 9:00 PM'],
} as const;

export const STUDIO_SERVICES = [
  { id: 'hybrid', name: 'Híbrido / funcional', label: 'FUERZA + RESISTENCIA', description: 'Fuerza, capacidad cardiovascular y movimientos funcionales para construir una condición física completa.' },
  { id: 'train', name: 'TRAIN', label: 'ENTRENAMIENTO DE FUERZA', description: 'Entrenamiento de fuerza con atención a la técnica y acompañamiento cercano en cada sesión.' },
  { id: 'running', name: 'Running', label: 'SESIONES DE CARRERA', description: 'Sesiones enfocadas en carrera para acompañar tu entrenamiento y ayudarte a avanzar hacia tu siguiente reto.' },
] as const;

export type StudioPlan = {
  id: string;
  name: string;
  classes: number | null;
  price: number;
  validityDays: number | null;
  firstVisit: boolean;
  note: string;
};

export const STUDIO_PLANS: readonly StudioPlan[] = [
  { id: 'trial', name: 'Clase prueba', classes: 1, price: 100, validityDays: null, firstVisit: true, note: 'Tu primer acercamiento al studio.' },
  { id: 'single', name: 'Clase suelta', classes: 1, price: 190, validityDays: null, firstVisit: false, note: 'Una sesión para seguir en movimiento.' },
  { id: 'first-five', name: 'Primera vez · 5 clases', classes: 5, price: 500, validityDays: null, firstVisit: true, note: 'Paquete de prueba para tu primera vez.' },
  { id: 'four', name: '4 clases', classes: 4, price: 649, validityDays: 30, firstVisit: false, note: 'Dale un lugar al entrenamiento en tu semana.' },
  { id: 'eight', name: '8 clases', classes: 8, price: 1099, validityDays: 30, firstVisit: false, note: 'Encuentra una rutina que te acompañe.' },
  { id: 'twelve', name: '12 clases', classes: 12, price: 1399, validityDays: 30, firstVisit: false, note: 'Haz de la constancia tu siguiente paso.' },
  { id: 'unlimited', name: 'Unlimited', classes: null, price: 1599, validityDays: 30, firstVisit: false, note: 'Acceso Unlimited a las clases incluidas.' },
];

export const FOUNDING_50 = {
  price: 1299,
  regularPrice: 1599,
  months: 6,
  limit: 50,
  whatsappHref: `${STUDIO.whatsappHref}?text=${encodeURIComponent('Hola, me interesa Founding 50 de 2707 Altitud. ¿Me ayudan a confirmar disponibilidad y cómo asegurar mi lugar?')}`,
  requirements: [
    'Ser una de las primeras 50 personas en adquirir la membresía.',
    'Realizar el primer pago para asegurar el lugar.',
    'Mantener la membresía activa y los pagos consecutivos durante el beneficio.',
    'La membresía es personal e intransferible.',
    'Si cancelas o interrumpes la membresía, pierdes el precio Founding 50. Al regresar aplica el precio vigente.',
    'El precio de $1,299 al mes se mantiene durante 6 meses desde la activación.',
    'Aplican las políticas generales de reservación, cancelación y no-show de Altitud.',
  ],
  benefits: [
    'Precio especial de $1,299 al mes durante 6 meses, frente a $1,599 del precio regular.',
    'Acceso Unlimited a las clases incluidas en la membresía.',
    'Prioridad de reservación antes de liberar horarios al público general.',
    'Acceso anticipado a clases especiales, workshops y eventos de Altitud.',
    'Kit Founding Member: termo o gorra a elegir, más playera de edición especial personalizada y numerada.',
  ],
} as const;

export const STUDIO_RULES = [
  'Llega con anticipación y respeta el horario de inicio.',
  'Cancela o reagenda con mínimo 4 horas de anticipación.',
  'Las inasistencias y cancelaciones tardías cuentan como clase utilizada y no se recuperan.',
  'Los paquetes tienen vigencia. Las clases no utilizadas no son acumulables ni transferibles, salvo excepción autorizada por Altitud.',
  'Sigue las indicaciones del coach durante las sesiones.',
  'Mantén una actitud de respeto hacia coaches y demás usuarios.',
  'Usa el equipo de acuerdo con las indicaciones del staff.',
] as const;

export function formatMxn(price: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price);
}
