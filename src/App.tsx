import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth.context";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MiniChatPanel } from "@/components/MiniChatPanel";
import { AmbientBackground } from "@/components/AmbientBackground";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ServerProfile from "./pages/ServerProfile.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
import Pricing from "./pages/Pricing.tsx";
import Payment from "./pages/Payment.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
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
import Premium from "./pages/dashboard/Premium.tsx";
import MyThreads from "./pages/dashboard/MyThreads.tsx";
import MyReviews from "./pages/dashboard/MyReviews.tsx";
import Threads from "./pages/Threads.tsx";
import ThreadDetail from "./pages/ThreadDetail.tsx";
import NewThread from "./pages/NewThread.tsx";
import Messages from "./pages/Messages.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminServers from "./pages/admin/AdminServers.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import AdminCategories from "./pages/admin/AdminCategories.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import NotFound from "./pages/NotFound.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


const App = () => (
  <ErrorBoundary level="app" onError={(error, errorInfo) => {
    // Log to error reporting service
    console.error('App-level error:', error, errorInfo);
  }}>
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <AmbientBackground />
                <Header />
                <Toaster />
                {/* Toast: top-right, always visible */}
                <Sonner
                  position="top-right"
                  theme="dark"
                  toastOptions={{
                    classNames: { toast: "glass-strong border-white/10 text-foreground" },
                    style: { top: '4.5rem' },
                  }}
                />
                <MiniChatPanel />
                <ErrorBoundary level="route">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/server/:slug" element={<ServerProfile />} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/api-docs" element={<ApiDocs />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:slug" element={<CategoryServers />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/threads" element={<Threads />} />
                    <Route path="/threads/new" element={<NewThread />} />
                    <Route path="/threads/:publicId" element={<ThreadDetail />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/messages/:friendId" element={<Messages />} />
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<DashboardOverview />} />
                      <Route path="analytics" element={<VoteAnalytics />} />
                      <Route path="servers" element={<MyServers />} />
                      <Route path="servers/new" element={<NewServer />} />
                      <Route path="servers/edit/:id" element={<EditServer />} />
                      <Route path="api-keys" element={<ApiKeys />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="premium" element={<Premium />} />
                      <Route path="threads" element={<MyThreads />} />
                      <Route path="reviews" element={<MyReviews />} />
                    </Route>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminOverview />} />
                      <Route path="servers" element={<AdminServers />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="categories/new" element={<AdminCategories />} />
                      <Route path="reports" element={<AdminReports />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
                <Footer />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
