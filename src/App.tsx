import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Public pages
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const MapsExport = lazy(() => import("./pages/MapsExport"));

// Auth pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

const MemberPreview = lazy(() => import("./pages/client/MemberApp"));

// Client pages
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const BookClasses = lazy(() => import("./pages/client/BookClasses"));
const BookClassConfirm = lazy(() => import("./pages/client/BookClassConfirm"));
const MyBookings = lazy(() => import("./pages/client/MyBookings"));
const ClassBookingDetail = lazy(() => import("./pages/client/ClassBookingDetail"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));
const ProfileEdit = lazy(() => import("./pages/client/ProfileEdit"));
const ProfileMembership = lazy(() => import("./pages/client/ProfileMembership"));
const ProfilePreferences = lazy(() => import("./pages/client/ProfilePreferences"));
const Notifications = lazy(() => import("./pages/client/Notifications"));
const News = lazy(() => import("./pages/client/News"));
const ClientCheckout = lazy(() => import("./pages/client/Checkout"));
const ClientOrders = lazy(() => import("./pages/client/Orders"));
const ClientOrderDetail = lazy(() => import("./pages/client/OrderDetail"));
const ClientEvents = lazy(() => import("./pages/client/Events"));
const Checkout = lazy(() => import("./pages/AltitudMemberships"));
const AltitudBooking = lazy(() => import("./pages/AltitudBooking"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const PlansList = lazy(() => import("./pages/admin/plans/PlansList"));
const ClientsList = lazy(() => import("./pages/admin/clients/ClientsList"));
const ClientDetail = lazy(() => import("./pages/admin/clients/ClientDetail"));
const PendingMemberships = lazy(() => import("./pages/admin/memberships/PendingMemberships"));
const MembershipsActive = lazy(() => import("./pages/admin/memberships/MembershipsActive"));
const MembershipsExpiring = lazy(() => import("./pages/admin/memberships/MembershipsExpiring"));
const MembershipsAll = lazy(() => import("./pages/admin/memberships/MembershipsAll"));
const InstructorsList = lazy(() => import("./pages/admin/staff/InstructorsList"));
const ClassTypesList = lazy(() => import("./pages/admin/classes/ClassTypesList"));
const WeeklySchedule = lazy(() => import("./pages/admin/schedules/WeeklySchedule"));
const ClassesCalendar = lazy(() => import("./pages/admin/classes/ClassesCalendar"));
const GenerateClasses = lazy(() => import("./pages/admin/classes/GenerateClasses"));
const BookingsList = lazy(() => import("./pages/admin/bookings/BookingsList"));
const Waitlist = lazy(() => import("./pages/admin/bookings/Waitlist"));
const TotalPassToday = lazy(() => import("./pages/admin/bookings/TotalPassToday"));
const MemberNew = lazy(() => import("./pages/admin/members/MemberNew"));
const AssignMembership = lazy(() => import("./pages/admin/members/AssignMembership"));
const PhysicalSale = lazy(() => import("./pages/admin/members/PhysicalSale"));
const PaymentsHub = lazy(() => import("./pages/admin/payments/PaymentsHub"));

// Settings pages
const GeneralSettings = lazy(() => import("./pages/admin/settings/GeneralSettings"));
const StudioSettings = lazy(() => import("./pages/admin/settings/StudioSettings"));
const PoliciesSettings = lazy(() => import("./pages/admin/settings/PoliciesSettings"));
const AdminCancellationPolicy = lazy(() => import("./pages/admin/settings/CancellationPolicy"));
const NotificationSettings = lazy(() => import("./pages/admin/settings/NotificationSettings"));
const WhatsAppSettings = lazy(() => import("./pages/admin/settings/WhatsAppSettings"));
const Plataformas = lazy(() => import("./pages/admin/settings/Plataformas"));

// Reports pages
const ReportsOverview = lazy(() => import("./pages/admin/reports/ReportsOverview"));
const ReportsClasses = lazy(() => import("./pages/admin/reports/ReportsClasses"));
const ReportsRevenue = lazy(() => import("./pages/admin/reports/ReportsRevenue"));
const ReportsRetention = lazy(() => import("./pages/admin/reports/ReportsRetention"));
const ReportsInstructors = lazy(() => import("./pages/admin/reports/ReportsInstructors"));
const InstructorDetail = lazy(() => import("./pages/admin/reports/InstructorDetail"));

// Orders/Payments verification page


const EventsManager = lazy(() => import("./pages/admin/events/EventsManager"));
const Communication = lazy(() => import("./pages/admin/marketing/Communication"));
const DiscountCodes = lazy(() => import("./pages/admin/discount-codes/DiscountCodes"));
const FacilitiesList = lazy(() => import("./pages/admin/facilities/FacilitiesList"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function RoutePosition() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
    const titles: Record<string, string> = { '/reservar': 'Horarios', '/login': 'Mi cuenta', '/register': 'Crear cuenta', '/pricing': 'Membresías', '/forgot-password': 'Recuperar contraseña' };
    document.title = `${pathname.startsWith('/app') ? 'Mi Altitud · App de usuario' : titles[pathname] || 'Entrenamiento híbrido y funcional'} | 2707 Altitud`;
  }, [pathname, hash]);
  return null;
}

// Component to check auth on app load
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

function LegacyClientBookRedirect() {
  const { classId } = useParams();
  return <Navigate to={classId ? `/app/book/${classId}` : "/app/book"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RoutePosition />
        <AuthInitializer>
          <Suspense fallback={<div className="alt-loading" role="status" aria-label="Cargando página"><div /><div /><div /><span>Cargando 2707 Altitud…</span></div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/reservar" element={<AltitudBooking />} />
            <Route path="/pricing" element={<Checkout />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cancellation-policy" element={<CancellationPolicy />} />
            <Route path="/maps-export" element={<MapsExport />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Client Routes */}
            <Route path="/app/preview/*" element={<MemberPreview preview />} />
            <Route path="/app" element={<ClientDashboard />} />
            <Route path="/app/book" element={<BookClasses />} />
            <Route path="/app/book/:classId" element={<BookClassConfirm />} />
            <Route path="/app/classes" element={<MyBookings />} />
            <Route path="/app/classes/:bookingId" element={<ClassBookingDetail />} />
            <Route path="/app/profile" element={<ClientProfile />} />
            <Route path="/app/profile/edit" element={<ProfileEdit />} />
            <Route path="/app/profile/membership" element={<ProfileMembership />} />
            <Route path="/app/profile/preferences" element={<ProfilePreferences />} />
            <Route path="/app/notifications" element={<Notifications />} />
            <Route path="/app/news" element={<News />} />
            <Route path="/app/checkout" element={<ClientCheckout />} />
            <Route path="/app/orders" element={<ClientOrders />} />
            <Route path="/app/orders/:orderId" element={<ClientOrderDetail />} />
            <Route path="/app/events" element={<ClientEvents />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<EventsManager />} />
            <Route path="/admin/marketing" element={<Communication />} />
            <Route path="/admin/discount-codes" element={<DiscountCodes />} />
            <Route path="/admin/calendar" element={<ClassesCalendar />} />

            <Route path="/admin/bookings" element={<BookingsList />} />
            <Route path="/admin/bookings/waitlist" element={<Waitlist />} />
            <Route path="/admin/totalpass/checkins" element={<TotalPassToday />} />

            <Route path="/admin/classes/schedules" element={<WeeklySchedule />} />
            <Route path="/admin/classes/types" element={<ClassTypesList />} />
            <Route path="/admin/classes/prices" element={<PlansList />} />
            <Route path="/admin/classes/generate" element={<GenerateClasses />} />

            <Route path="/admin/members" element={<ClientsList />} />
            <Route path="/admin/members/new" element={<MemberNew />} />
            <Route path="/admin/members/:userId/assign-membership" element={<AssignMembership />} />
            <Route path="/admin/members/:userId/physical-sale" element={<PhysicalSale />} />
            <Route path="/admin/members/:id" element={<ClientDetail />} />

            <Route path="/admin/memberships/pending" element={<PendingMemberships />} />
            <Route path="/admin/memberships/active" element={<MembershipsActive />} />
            <Route path="/admin/memberships/expiring" element={<MembershipsExpiring />} />
            <Route path="/admin/memberships/all" element={<MembershipsAll />} />
            <Route path="/admin/memberships/paquetes" element={<PlansList />} />
            <Route path="/admin/memberships" element={<Navigate to="/admin/memberships/all" replace />} />
            <Route path="/admin/instructors" element={<InstructorsList />} />
            <Route path="/admin/payments" element={<PaymentsHub />} />
            <Route path="/admin/payments/transactions" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/admin/payments/pending" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/admin/payments/register" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/admin/payments/reports" element={<Navigate to="/admin/payments" replace />} />

            <Route path="/admin/reports/overview" element={<ReportsOverview />} />
            <Route path="/admin/reports/classes" element={<ReportsClasses />} />
            <Route path="/admin/reports/revenue" element={<ReportsRevenue />} />
            <Route path="/admin/reports/retention" element={<ReportsRetention />} />
            <Route path="/admin/reports/instructors/:id" element={<InstructorDetail />} />
            <Route path="/admin/reports/instructors" element={<ReportsInstructors />} />

            <Route path="/admin/settings/general" element={<GeneralSettings />} />
            <Route path="/admin/settings/studio" element={<StudioSettings />} />
            <Route path="/admin/settings/policies" element={<PoliciesSettings />} />
            <Route path="/admin/settings/cancellations" element={<AdminCancellationPolicy />} />
            <Route path="/admin/settings/notifications" element={<NotificationSettings />} />
            <Route path="/admin/settings/whatsapp" element={<WhatsAppSettings />} />
            <Route path="/admin/settings/platforms" element={<Plataformas />} />
            <Route path="/admin/settings" element={<Navigate to="/admin/settings/general" replace />} />

            <Route path="/admin/facilities" element={<FacilitiesList />} />
            <Route path="/admin/orders" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/admin/orders/verification" element={<Navigate to="/admin/payments" replace />} />

            {/* Legacy redirects */}
            <Route path="/admin/clients" element={<ClientsList />} />
            <Route path="/admin/clients/:id" element={<ClientDetail />} />
            <Route path="/admin/class-types" element={<Navigate to="/admin/classes/types" replace />} />
            <Route path="/admin/schedules" element={<Navigate to="/admin/classes/schedules" replace />} />
            <Route path="/admin/plans" element={<PlansList />} />
            <Route path="/admin/bookings/calendar" element={<Navigate to="/admin/calendar" replace />} />

            {/* Redirects */}
            <Route path="/client/dashboard" element={<Navigate to="/app" replace />} />
            <Route path="/auth/register" element={<Navigate to="/register" replace />} />
            <Route path="/auth/login" element={<Navigate to="/login" replace />} />
            <Route path="/client/book" element={<Navigate to="/app/book" replace />} />
            <Route path="/client/book/:classId" element={<LegacyClientBookRedirect />} />
            <Route path="/app/my-bookings" element={<Navigate to="/app/classes" replace />} />
            <Route path="/client/my-bookings" element={<Navigate to="/app/classes" replace />} />
            <Route path="/client/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/client/*" element={<Navigate to="/app" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
