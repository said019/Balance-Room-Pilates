import type { BrowserContext } from '@playwright/test';

/** Local UI-only fixtures. All API requests are intercepted; no real accounts or writes. */
export const previewAdmin = { id: 'admin-preview', role: 'admin', display_name: 'Administración Altitud', email: 'admin@example.invalid' };
const today = new Date().toISOString().slice(0, 10);
const stamp = `${today}T12:00:00.000Z`;
const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const client = { id: '00000000-0000-4000-8000-000000002707', display_name: 'María Fernanda Hernández de la Torre', email: 'maria.fernanda.hernandez@example.invalid', phone: '+527200000001', role: 'client', is_active: true, created_at: stamp, date_of_birth: '1992-07-15', emergency_contact_name: 'Contacto de prueba', emergency_contact_phone: '+527200000002', health_notes: null };
const plan = { id: '00000000-0000-4000-8000-000000002708', name: 'Unlimited · Performance Lifestyle', price: 1599, currency: 'MXN', duration_days: 30, class_limit: null, classes_included: null, description: 'Acceso a entrenamiento híbrido, fuerza y running.', features: ['30 días de vigencia', 'Clases ilimitadas'], is_active: true, sort_order: 1, package_type: 'individual' };
const membership = { id: 'membership-preview', user_id: client.id, plan_id: plan.id, user_name: client.display_name, user_email: client.email, user_phone: client.phone, plan_name: plan.name, plan_price: plan.price, price_paid: plan.price, plan_duration_days: 30, class_limit: null, classes_remaining: null, credits_total: null, credits_remaining: null, start_date: today, end_date: future, status: 'active', payment_method: 'transfer', created_at: stamp, updated_at: stamp };
const facility = { equipment: ['Mancuernas', 'Remo'], description: 'Sala de entrenamiento híbrido y funcional', sort_order: 1, created_at: stamp, updated_at: stamp, id: 'facility-preview', name: 'Studio principal · Plaza Bosques', capacity: 12, max_capacity: 12, is_active: true, color: '#5F632C', address: 'Plaza Bosques, locales 4 y 5, Zinacantepec' };
const instructor = { id: 'coach-preview', display_name: 'Alejandra Martínez Rodríguez', email: 'coach@example.invalid', phone: '+527200000003', is_active: true, bio: 'Entrenamiento de fuerza y rendimiento.', specialties: ['Híbrido', 'TRAIN', 'Running'], photo_url: null, color: '#7F6146', total_classes: 28, total_students: 240, avg_occupancy: 86, avg_rating: 4.8, total_reviews: 12, recommendation_rate: 96 };
const classType = { id: 'type-preview', name: 'Híbrido / Funcional', description: 'Fuerza y resistencia en grupos pequeños.', color: '#5F632C', duration_minutes: 50, capacity: 12, max_capacity: 12, is_active: true, level: 'all' };
const scheduledClass = { id: 'class-preview', class_type_id: classType.id, class_type_name: classType.name, name: classType.name, class_type_color: classType.color, date: today, start_time: '08:00:00', end_time: '08:50:00', capacity: 12, max_capacity: 12, current_capacity: 8, booked_count: 8, enrolled_count: 8, status: 'scheduled', instructor_id: instructor.id, instructor_name: instructor.display_name, facility_id: facility.id, facility_name: facility.name, duration_minutes: 50 };
const booking = { booking_id: 'booking-preview', id: 'booking-preview', booking_status: 'confirmed', status: 'confirmed', channel: 'balance', created_at: stamp, checked_in_at: null, waitlist_position: null, user_id: client.id, user_name: client.display_name, user_email: client.email, user_phone: client.phone, class_id: scheduledClass.id, date: today, start_time: '08:00:00', class_date: today, class_start_time: '08:00:00', class_end_time: '08:50:00', class_name: classType.name, instructor_name: instructor.display_name, membership_id: membership.id, plan_name: plan.name };
const order = { id: 'order-preview', order_number: 'ALT-2707-001', user_id: client.id, user_name: client.display_name, user_email: client.email, user_phone: client.phone, total: 1599, amount: 1599, currency: 'MXN', status: 'pending_verification', payment_method: 'transfer', created_at: stamp, updated_at: stamp, payment_reference: 'TRANSFERENCIA-DE-PRUEBA', items: [{ id: 'item-preview', name: plan.name, quantity: 1, unit_price: 1599, total: 1599, plan_name: plan.name }] };
const event = { id: 'event-preview', title: 'Técnica de carrera y comunidad Altitud', description: 'Sesión especial de técnica y movilidad.', type: 'workshop', instructor: instructor.display_name, date: future, startTime: '08:00', endTime: '09:00', start_time: '08:00', end_time: '09:00', location: facility.name, capacity: 12, registered: 8, price: 190, memberDiscount: 0, status: 'published', tags: ['Running'], requirements: 'Llegar con anticipación.', includes: ['Coaching'], registrations: [], waitlistEnabled: true, requiredPayment: true, walletPass: false, autoReminders: false, allowCancellations: true };
const schedule = { ...scheduledClass, id: 'schedule-preview', day_of_week: new Date().getDay(), is_active: true, is_recurring: true };
const profile = { ...client, currentMembership: membership, memberships: [membership], recentBookings: [booking], notes: [], stats: { totalBookings: 8, attended: 6, noShows: 0, totalSpent: 1599 } };

export const adminRoutes = [
  '/admin/dashboard', '/admin/events', '/admin/marketing', '/admin/discount-codes', '/admin/calendar',
  '/admin/bookings', '/admin/bookings/waitlist', '/admin/totalpass/checkins', '/admin/classes/schedules',
  '/admin/classes/types', '/admin/classes/prices', '/admin/classes/generate', '/admin/members', '/admin/members/new',
  '/admin/members/member-preview/assign-membership', '/admin/members/member-preview/physical-sale', '/admin/members/member-preview',
  '/admin/memberships/pending', '/admin/memberships/active', '/admin/memberships/expiring', '/admin/memberships/all',
  '/admin/instructors', '/admin/payments', '/admin/payments?tab=transactions', '/admin/payments?tab=pending', '/admin/payments?tab=register', '/admin/payments?tab=manual-income', '/admin/reports/overview', '/admin/reports/classes', '/admin/reports/revenue',
  '/admin/reports/retention', '/admin/reports/instructors/coach-preview', '/admin/reports/instructors',
  '/admin/settings/general', '/admin/settings/studio', '/admin/settings/policies', '/admin/settings/cancellations',
  '/admin/settings/notifications', '/admin/settings/whatsapp', '/admin/settings/platforms', '/admin/facilities',
] as const;

export async function installAdminPreview(context: BrowserContext) {
  const unexpected: string[] = [];
  await context.addInitScript(admin => {
    localStorage.setItem('altitud2707_token', 'local-ui-preview-token');
    localStorage.setItem('altitud2707-auth-storage', JSON.stringify({ state: { user: admin, token: 'local-ui-preview-token', isAuthenticated: true }, version: 0 }));
  }, previewAdmin);
  await context.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api/, '');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      unexpected.push(`${request.method()} ${path}`);
      return route.fulfill({ status: 405, json: { error: 'La prueba visual no permite modificaciones.' } });
    }
    let data: unknown;
    if (path === '/auth/me') data = { user: previewAdmin };
    else if (path === '/admin/notifications') data = { notifications: [], unreadCount: 0 };
    else if (path === '/admin/stats') data = { scheduledClasses: 7, confirmedBookings: 62, activeMemberships: 48, revenue: 3198, classesByStudio: [{ facilityId: facility.id, name: facility.name, count: 7 }] };
    else if (path === '/admin/birthdays') data = [];
    else if (path === '/admin/clients/member-preview/full-profile') data = profile;
    else if (path === '/users/member-preview/founder') data = { user: { is_founder: false }, audit: [] };
    else if (path === '/users/member-preview') data = client;
    else if (path === '/users') data = { users: [client], total: 1, page: 1, totalPages: 1, pagination: { total: 1, limit: 10, offset: 0 } };
    else if (path === '/plans') data = [plan, { ...plan, id: 'plan-four', name: '4 clases', price: 649, class_limit: 4, classes_included: 4 }, { ...plan, id: 'plan-trial', name: 'Clase prueba', price: 100, class_limit: 1, classes_included: 1 }];
    else if (path === '/memberships/pending') data = [{ ...membership, status: 'pending_activation' }];
    else if (path === '/memberships') data = [membership];
    else if (path === '/class-types') data = [classType];
    else if (path === '/facilities') data = [facility];
    else if (path === '/instructors') data = [instructor];
    else if (path === '/classes') data = [scheduledClass];
    else if (path === '/schedules') data = [schedule];
    else if (path === '/bookings') data = [{ ...booking, ...(url.searchParams.get('status') === 'waitlist' ? { booking_status: 'waitlist', waitlist_position: 1 } : {}) }];
    else if (path.startsWith('/bookings/class/')) data = [booking];
    else if (path === '/orders/pending') data = [order];
    else if (path === '/events/registrations/pending') data = [];
    else if (path === '/events/admin/all' || path === '/events') data = [event];
    else if (path === '/closed-days/range') data = [];
    else if (path === '/discount-codes') data = [{ id: 'code-preview', code: 'BIENVENIDA2707', description: 'Promoción de bienvenida', discountType: 'percentage', discountValue: 10, isActive: true, currentUses: 4, maxUses: 50, applicablePlans: [], createdAt: stamp, validFrom: today, validUntil: null, minPurchase: 0 }];
    else if (path === '/marketing/recipients-count') data = { count: 48 };
    else if (path === '/marketing/broadcasts') data = [];
    else if (path === '/reports/overview') data = { monthlyRevenue: 78351, monthlyBookings: 320, activeMembers: 48, newMembers: 12, attendanceRate: 94, weeklyClasses: 39, avgTicketPerClass: 120, classesPurchased: 420, financialTrend: [{ label: 'Septiembre', revenue: 78351 }] };
    else if (path === '/reports/classes') data = { byDayOfWeek: [{ day_of_week: 1, avg_attendance: 9 }], byTime: [{ start_time: '08:00:00', avg_attendance: 10 }], byType: [{ name: classType.name, class_type_name: classType.name, count: 28 }], classesByStudio: [{ facilityId: facility.id, name: facility.name, count: 28 }] };
    else if (path === '/reports/revenue') data = { total: 78351, avgTicketPerClass: 120, classesPurchased: 420, daily: [{ date: today, total: 3198, count: 2 }], byMethod: [{ payment_method: 'transfer', total: 3198 }], byPlan: [{ plan_name: plan.name, total: 3198, count: 2 }] };
    else if (path === '/reports/retention') data = { summary: { totalBookings: 320, attended: 300, noShows: 8, lateCancellations: 4, earlyCancellations: 8 }, retentionMetrics: { renewalRate: 89, expiredLast90Days: 18, renewedLast90Days: 16 }, repositions: { created: 8 }, riskyUsers: [{ ...client, no_shows: 2, late_cancels: 1 }] };
    else if (path === '/reports/instructors') data = [instructor];
    else if (path === '/reviews/instructor/coach-preview/summary') data = { summary: { stats: { averageRating: 4.8, totalReviews: 12, recommendationRate: 96 }, distribution: { fiveStar: 10, fourStar: 2 }, difficulty: {} } };
    else if (path === '/reviews/admin') data = { reviews: [], total: 0 };
    else if (path === '/settings/cancellation-policy') data = { minHoursBeforeClass: 4, allowCancellation: true, refundCredits: true };
    else if (path === '/settings/bank-info') data = { bankName: 'Banco de prueba', accountHolder: 'Studio ficticio', clabe: '000000000000000000' };
    else if (path.startsWith('/settings/')) data = { value: {} };
    else if (path === '/evolution/status') data = { connected: false, status: 'disconnected', configured: false };
    else if (path === '/partners/settings') data = [];
    else if (path === '/partners/totalpass/access/status') data = { configured: false, enabled: false };
    else if (path === '/partners/totalpass/today') data = { date: today, total: 1, registered: 0, pending: 1, bookings: [{ bookingId: booking.id, time: '08:00:00', className: classType.name, instructorName: instructor.display_name, userName: client.display_name, userEmail: client.email, userPhone: client.phone, bookingStatus: 'confirmed', checkedInAt: null, localCheckin: false, checkinTotalPass: false, status: 'pending' }] };
    else if (path === '/stats/cash-payments-today') data = { amountToday: 3198, paymentsToday: 2, membershipsActivated: 2, guestsToday: 1 };
    else if (path === '/payments/transactions') data = [{ id: 'payment-preview', user_id: client.id, membership_id: membership.id, amount: 1599, currency: 'MXN', payment_method: 'transfer', reference: 'TRANSFERENCIA-PRUEBA', notes: null, status: url.searchParams.get('status') === 'pending' ? 'pending' : 'completed', processed_by: null, created_at: stamp, user_name: client.display_name, user_email: client.email, plan_name: plan.name }];
    else if (path === '/payments/manual-income') data = [{ id: 'income-preview', income_date: today, concept: 'Sesión especial de entrenamiento', facility_name: facility.name, payment_method: 'cash', amount: 190 }];
    else if (path === '/payments/reports') data = {};
    else { unexpected.push(`${request.method()} ${path}`); data = []; }
    return route.fulfill({ json: data });
  });
  return unexpected;
}
