
import { useEffect } from "react";
import { I18nextProvider } from 'react-i18next';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { RequireAuth } from "@/components/RequireAuth";
import { UserSetupProvider } from "@/components/UserSetupProvider";
import i18n from './i18n';
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import JoinOrganization from "./pages/JoinOrganization";
import Today from "./pages/Today";
import Calendar from "./pages/Calendar";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import TaskMap from "./pages/TaskMap";
import ListsHomeScreen from "./pages/ListsHomeScreen";
import TaskListScreen from "./pages/TaskListScreen";
import TaskHistory from "./pages/TaskHistory";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProjects from "./pages/AdminProjects";
import AdminReports from "./pages/AdminReports";
import AdminTimeTracking from "./pages/AdminTimeTracking";
import AdminSettings from "./pages/AdminSettings";
import AdminLayout from "./components/AdminLayout";
import { RequireRole } from "./components/RequireRole";
import { registerOnlineListener } from "@/lib/offlineQueue";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW()
      })
    }
    
    // Register online/offline listeners for mutation queue
    registerOnlineListener()
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrganizationProvider>
            <UserSetupProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/join-organization" element={<JoinOrganization />} />
                  <Route path="/today" element={
                    <RequireAuth>
                      <Today />
                    </RequireAuth>
                  } />
                  <Route path="/tasks" element={
                    <RequireAuth>
                      <Today />
                    </RequireAuth>
                  } />
                  <Route path="/calendar" element={
                    <RequireAuth>
                      <Calendar />
                    </RequireAuth>
                  } />
                  <Route path="/projects" element={
                    <RequireAuth>
                      <Projects />
                    </RequireAuth>
                  } />
                  <Route path="/projects/:id" element={
                    <RequireAuth>
                      <ProjectDetails />
                    </RequireAuth>
                  } />
                  <Route path="/profile" element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  } />
                  <Route path="/settings" element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  } />
                  <Route path="/map" element={
                    <RequireAuth>
                      <TaskMap />
                    </RequireAuth>
                  } />
                  <Route path="/lists" element={<RequireAuth><ListsHomeScreen /></RequireAuth>} />
                  <Route path="/lists/:id" element={<RequireAuth><TaskListScreen /></RequireAuth>} />
                  <Route path="/history" element={<RequireAuth><TaskHistory /></RequireAuth>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  <Route path="/admin/users" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminUsers />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  <Route path="/admin/projects" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminProjects />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  <Route path="/admin/reports" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminReports />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  <Route path="/admin/time-tracking" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminTimeTracking />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  <Route path="/admin/settings" element={
                    <RequireRole allowedRoles={['admin']}>
                      <AdminLayout>
                        <AdminSettings />
                      </AdminLayout>
                    </RequireRole>
                  } />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </UserSetupProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  )
};

export default App;
