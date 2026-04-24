import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth.context";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { AmbientBackground } from "@/components/AmbientBackground";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ServerProfile from "./pages/ServerProfile.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
import Pricing from "./pages/Pricing.tsx";
import Payment from "./pages/Payment.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Contact from "./pages/Contact.tsx";
import Categories from "./pages/Categories.tsx";
import CategoryServers from "./pages/CategoryServers.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.tsx";
import DashboardOverview from "./pages/dashboard/DashboardOverview.tsx";
import MyServers from "./pages/dashboard/MyServers.tsx";
import NewServer from "./pages/dashboard/NewServer.tsx";
import EditServer from "./pages/dashboard/EditServer.tsx";
import ApiKeys from "./pages/dashboard/ApiKeys.tsx";
import VoteAnalytics from "./pages/dashboard/VoteAnalytics.tsx";
import Settings from "./pages/dashboard/Settings.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminServers from "./pages/admin/AdminServers.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Get your reCAPTCHA v3 site key from: https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LdfUsgsAAAAAENdS9b111PeGCaa6vTSV0CRhTK3";

const App = () => (
  <ErrorBoundary level="app" onError={(error, errorInfo) => {
    // Log to error reporting service
    console.error('App-level error:', error, errorInfo);
  }}>
    <QueryClientProvider client={queryClient}>
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <ThemeProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <AmbientBackground />
                <Header />
                <Toaster />
                <Sonner position="top-right" theme="dark" toastOptions={{ classNames: { toast: "glass-strong border-white/10 text-foreground" } }} />
                <ErrorBoundary level="route">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/server/:slug" element={<ServerProfile />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/api-docs" element={<ApiDocs />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:slug" element={<CategoryServers />} />
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<DashboardOverview />} />
                      <Route path="analytics" element={<VoteAnalytics />} />
                      <Route path="servers" element={<MyServers />} />
                      <Route path="servers/new" element={<NewServer />} />
                      <Route path="servers/edit/:id" element={<EditServer />} />
                      <Route path="api-keys" element={<ApiKeys />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminOverview />} />
                      <Route path="servers" element={<AdminServers />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="payments" element={<AdminPayments />} />
                    </Route>
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </GoogleReCaptchaProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
