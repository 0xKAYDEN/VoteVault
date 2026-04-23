import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth.context";
import { Header } from "@/components/Header";
import { AmbientBackground } from "@/components/AmbientBackground";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ServerProfile from "./pages/ServerProfile.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AmbientBackground />
          <Header />
          <Toaster />
          <Sonner position="top-right" theme="dark" toastOptions={{ classNames: { toast: "glass-strong border-white/10 text-foreground" } }} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/server/:slug" element={<ServerProfile />} />
            <Route path="/api-docs" element={<ApiDocs />} />
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
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
