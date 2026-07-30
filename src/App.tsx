import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CancellationPolicy from "./pages/CancellationPolicy";
import MapsExport from "./pages/MapsExport";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Client pages
import ClientDashboard from "./pages/client/Dashboard";
import BookClasses from "./pages/client/BookClasses";
import BookClassConfirm from "./pages/client/BookClassConfirm";
import MyBookings from "./pages/client/MyBookings";
import ClassBookingDetail from "./pages/client/ClassBookingDetail";
import ClientProfile from "./pages/client/Profile";
import ProfileEdit from "./pages/client/ProfileEdit";
import ProfileMembership from "./pages/client/ProfileMembership";
import ProfilePreferences from "./pages/client/ProfilePreferences";
import Notifications from "./pages/client/Notifications";
import News from "./pages/client/News";
import ClientCheckout from "./pages/client/Checkout";
import ClientOrders from "./pages/client/Orders";
import ClientOrderDetail from "./pages/client/OrderDetail";
import ClientEvents from "./pages/client/Events";
import Checkout from "./pages/Checkout";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import PlansList from "./pages/admin/plans/PlansList";
import ClientsList from "./pages/admin/clients/ClientsList";
import ClientDetail from "./pages/admin/clients/ClientDetail";
import PendingMemberships from "./pages/admin/memberships/PendingMemberships";
import MembershipsActive from "./pages/admin/memberships/MembershipsActive";
import MembershipsExpiring from "./pages/admin/memberships/MembershipsExpiring";
import MembershipsAll from "./pages/admin/memberships/MembershipsAll";
import InstructorsList from "./pages/admin/staff/InstructorsList";
import ClassTypesList from "./pages/admin/classes/ClassTypesList";
import WeeklySchedule from "./pages/admin/schedules/WeeklySchedule";
import ClassesCalendar from "./pages/admin/classes/ClassesCalendar";
import GenerateClasses from "./pages/admin/classes/GenerateClasses";
import BookingsList from "./pages/admin/bookings/BookingsList";
import Waitlist from "./pages/admin/bookings/Waitlist";
import TotalPassToday from "./pages/admin/bookings/TotalPassToday";
import MemberNew from "./pages/admin/members/MemberNew";
import AssignMembership from "./pages/admin/members/AssignMembership";
import PhysicalSale from "./pages/admin/members/PhysicalSale";
import PaymentsHub from "./pages/admin/payments/PaymentsHub";

// Settings pages
import GeneralSettings from "./pages/admin/settings/GeneralSettings";
import StudioSettings from "./pages/admin/settings/StudioSettings";
import PoliciesSettings from "./pages/admin/settings/PoliciesSettings";
import AdminCancellationPolicy from "./pages/admin/settings/CancellationPolicy";
import NotificationSettings from "./pages/admin/settings/NotificationSettings";
import WhatsAppSettings from "./pages/admin/settings/WhatsAppSettings";
import Plataformas from "./pages/admin/settings/Plataformas";

// Reports pages
import ReportsOverview from "./pages/admin/reports/ReportsOverview";
import ReportsClasses from "./pages/admin/reports/ReportsClasses";
import ReportsRevenue from "./pages/admin/reports/ReportsRevenue";
import ReportsRetention from "./pages/admin/reports/ReportsRetention";
import ReportsInstructors from "./pages/admin/reports/ReportsInstructors";
import InstructorDetail from "./pages/admin/reports/InstructorDetail";

// Orders/Payments verification page


import EventsManager from "./pages/admin/events/EventsManager";
import Communication from "./pages/admin/marketing/Communication";
import DiscountCodes from "./pages/admin/discount-codes/DiscountCodes";
import FacilitiesList from "./pages/admin/facilities/FacilitiesList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

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
        <AuthInitializer>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
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
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
