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
} as const;

export const STUDIO_SERVICES = [
  { id: 'hybrid', name: 'Híbrido / funcional', label: 'FUERZA + RESISTENCIA', description: 'Fuerza, capacidad cardiovascular y movimientos funcionales para construir una condición física completa.' },
  { id: 'train', name: 'TRAIN', label: 'HIPERTROFIA AL RITMO DE LA MÚSICA', description: 'TRAIN es nuestra clase de hipertrofia guiada por la música, donde cada movimiento tiene intención y cada repetición sigue el ritmo.' },
  { id: 'running', name: 'Running', label: 'SESIONES DE CARRERA', description: 'Sesiones enfocadas en carrera para acompañar tu entrenamiento y ayudarte a avanzar hacia tu siguiente reto.' },
] as const;

export const TRAIN_DETAILS = [
  'A través de secuencias estructuradas de fuerza, trabajamos control, técnica y tiempo bajo tensión para estimular el músculo de forma eficiente.',
  'Aquí no se trata de moverte más rápido, sino de moverte mejor: cargar, controlar y progresar.',
] as const;

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
    'Precio especial de $1,299 al mes durante el beneficio.',
    'Acceso Unlimited a las clases incluidas en la membresía.',
    'Prioridad de reservación antes de liberar horarios al público general.',
    'Acceso anticipado a clases especiales, workshops y eventos de Altitud.',
    'Kit Founding Member: termo o gorra a elegir, más playera de edición especial personalizada y numerada.',
  ],
} as const;

export const STUDIO_RULES = [
  'Llega con anticipación y respeta el horario de inicio.',
  'Cancela o reagenda dentro del plazo vigente que aparece en tu reserva.',
  'Las inasistencias y cancelaciones tardías cuentan como clase utilizada y no se recuperan.',
  'Los paquetes tienen vigencia. Las clases no utilizadas no son acumulables ni transferibles, salvo excepción autorizada por Altitud.',
  'Sigue las indicaciones del coach durante las sesiones.',
  'Mantén una actitud de respeto hacia coaches y demás usuarios.',
  'Usa el equipo de acuerdo con las indicaciones del staff.',
] as const;

export function formatMxn(price: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price);
}
