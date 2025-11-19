import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { NotificationManager } from "@/components/NotificationManager";
import Auth from "./pages/Auth";
import Pending from "./pages/Pending";
import Library from "./pages/Library";
import Favorites from "./pages/Favorites";
import PlaylistDetail from "./pages/PlaylistDetail";
import NowPlaying from "./pages/NowPlaying";
import Users from "./pages/admin/Users";
import Upload from "./pages/admin/Upload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PlayerProvider>
            <NotificationManager />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route
                path="/pending"
                element={
                  <ProtectedRoute>
                    <Pending />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["admin", "listener"]}>
                    <Layout>
                      <Library />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/now-playing"
                element={
                  <ProtectedRoute allowedRoles={["admin", "listener"]}>
                    <NowPlaying />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/playlist/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin", "listener"]}>
                    <Layout>
                      <PlaylistDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/favorites"
                element={
                  <ProtectedRoute allowedRoles={["admin", "listener"]}>
                    <Layout>
                      <Favorites />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/upload"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Layout>
                      <Upload />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </PlayerProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
