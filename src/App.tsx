import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoader } from "@/components/common/PageLoader";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { PWAManifestLink } from "@/components/common/PWAManifestLink";
import { PageViewTracker } from "@/components/common/PageViewTracker";
import { AppLayout } from "@/components/layout/AppLayout";
import { trackPageView } from "@/lib/event-tracking";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Wizard = lazy(() => import("./pages/Wizard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Courses = lazy(() => import("./pages/Courses"));
const Chat = lazy(() => import("./pages/Chat"));
const Study = lazy(() => import("./pages/Study"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Profile = lazy(() => import("./pages/Profile"));
const CareerTools = lazy(() => import("./pages/CareerTools"));
const Community = lazy(() => import("./pages/Community"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Refund = lazy(() => import("./pages/Refund"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Tickets = lazy(() => import("./pages/Tickets"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const CareerDNA = lazy(() => import("./pages/CareerDNA"));
const CareerDNAResult = lazy(() => import("./pages/CareerDNAResult"));
const CareerDNASquad = lazy(() => import("./pages/CareerDNASquad"));
const Earn = lazy(() => import("./pages/Earn"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Users = lazy(() => import("./pages/admin/Users"));
const Subscriptions = lazy(() => import("./pages/admin/Subscriptions"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const Traffic = lazy(() => import("./pages/admin/Traffic"));
const Conversions = lazy(() => import("./pages/admin/Conversions"));
const UserJourney = lazy(() => import("./pages/admin/UserJourney"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));
const AdminTickets = lazy(() => import("./pages/admin/Tickets"));
const AdminTicketDetail = lazy(() => import("./pages/admin/AdminTicketDetail"));
const Leads = lazy(() => import("./pages/admin/Leads"));
const ContactRequests = lazy(() => import("./pages/admin/ContactRequests"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

const RoutesContent = () => (
  <MotionConfig reducedMotion="user">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <ScrollToTop />
      <PWAManifestLink />
      <PageViewTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/about" element={<About />} />
        <Route path="/careers" element={<Navigate to="/about" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/career-dna" element={<CareerDNA />} />
        <Route path="/career-dna/result/:id" element={<CareerDNAResult />} />
        <Route path="/career-dna/squad/:slug" element={<CareerDNASquad />} />
        <Route path="/wizard" element={<Wizard />} />
        <Route path="/earn" element={<Earn />} />
        <Route path="/dashboard" element={<AppLayout />}>
          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="roadmap/:id" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="study" element={<ProtectedRoute><Study /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="career-tools" element={<ProtectedRoute><CareerTools /></ProtectedRoute>} />
          <Route path="community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          <Route path="support" element={<Navigate to="/dashboard/tickets" replace />} />
          <Route path="tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path="tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
          <Route path="checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
          <Route path="checkout/cancel" element={<CheckoutCancel />} />
          <Route path="affiliate" element={<Affiliate />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<Users />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="traffic" element={<Traffic />} />
          <Route path="conversions" element={<Conversions />} />
          <Route path="user-journey" element={<UserJourney />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="tickets/:id" element={<AdminTicketDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="contact-requests" element={<ContactRequests />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-log" element={<AuditLog />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </TooltipProvider>
  </MotionConfig>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <RoutesContent />
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
