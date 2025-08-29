import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState, Suspense, lazy } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

// Import minimal components directly for faster initial load
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Login } from './pages/Login';

// Lazy load heavy components to reduce initial bundle
const SlotMachine = lazy(() => import('./components/SlotMachine'));
const EventHero = lazy(() => import('./components/EventHero').then(module => ({ default: module.EventHero })));
const AdminLayout = lazy(() => import('./components/AdminLayout'));

// Only lazy load heavy/less common pages
const EventRegistration = lazy(() => import('./pages/EventRegistration').then(module => ({ default: module.EventRegistration })));
const RegistrationSuccess = lazy(() => import('./pages/RegistrationSuccess').then(module => ({ default: module.RegistrationSuccess })));
const CheckRegistration = lazy(() => import('./pages/CheckRegistration').then(module => ({ default: module.CheckRegistration })));
const Winners = lazy(() => import('./pages/Winners').then(module => ({ default: module.Winners })));
const Participants = lazy(() => import('./pages/Participants').then(module => ({ default: module.Participants })));

// Lazy load admin pages - these are heavy and only needed by admins
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const EventManagement = lazy(() => import('./pages/admin/EventManagement'));
const ParticipantManagement = lazy(() => import('./pages/admin/ParticipantManagement'));
const PrizeManagement = lazy(() => import('./pages/admin/PrizeManagement'));
const PrizeDrawing = lazy(() => import('./pages/admin/PrizeDrawing'));
const DrawWinners = lazy(() => import('./pages/admin/DrawWinners').then(module => ({ default: module.DrawWinners })));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const FullscreenDrawing = lazy(() => import('./pages/admin/FullscreenDrawing'));
const AdminEventDetail = lazy(() => import('./pages/admin/EventDetail').then(module => ({ default: module.AdminEventDetail })));

function AppRoutes() {
  const { isLoading, isRedirecting } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Add timeout protection for stuck loading states
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('Loading timeout reached - possible infinite loading detected');
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Show loading state but with timeout protection
  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="large" 
          text="Memuat aplikasi..." 
          variant="modern"
          fullScreen={true}
        />
      </div>
    );
  }

  // Show error state if loading timed out
  if (loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Terjadi Masalah Loading
          </h2>
          <p className="text-gray-600 mb-6">
            Aplikasi membutuhkan waktu terlalu lama untuk dimuat. 
            Ini mungkin disebabkan oleh masalah koneksi atau server.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    );
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="medium" 
          text="Mengalihkan..." 
          variant="pulse"
          fullScreen={true}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Show Navbar for public routes (not admin or login) */}
        {!isAdminRoute && location.pathname !== '/login' && <Navbar />}
        <main className="flex-grow">
          <Suspense 
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner 
                  size="large" 
                  text="Memuat halaman..." 
                  variant="modern"
                  fullScreen={true}
                />
              </div>
            }
          >
            <Routes>
              {/* Public Routes - Dapat diakses siapa saja */}
              <Route path="/" element={<Events />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/register" element={<EventRegistration />} />
              <Route path="/events/:id/registration-success" element={<RegistrationSuccess />} />
              <Route path="/events/:id/check-registration" element={<CheckRegistration />} />
              <Route path="/events/:id/winners" element={<Winners />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/login" element={<Login />} />
              
              {/* Admin Routes - Harus login */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events" 
                element={
                  <ProtectedRoute>
                    <EventManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId" 
                element={
                  <ProtectedRoute>
                    <AdminEventDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/participants" 
                element={
                  <ProtectedRoute>
                    <ParticipantManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/prizes" 
                element={
                  <ProtectedRoute>
                    <PrizeManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/audit-logs" 
                element={
                  <ProtectedRoute>
                    <AuditLogs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/profile" 
                element={
                  <ProtectedRoute>
                    <AdminProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/admins" 
                element={
                  <ProtectedRoute>
                    <AdminManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/draw" 
                element={
                  <ProtectedRoute>
                    <DrawWinners />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/fullscreen-draw" 
                element={
                  <ProtectedRoute>
                    <FullscreenDrawing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/prize-drawing" 
                element={
                  <ProtectedRoute>
                    <PrizeDrawing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/draw" 
                element={
                  <ProtectedRoute>
                    <PrizeDrawing />
                  </ProtectedRoute>
                } 
              />
              {/* Rute baru untuk manajemen peserta dan hadiah per event */}
              <Route 
                path="/admin/events/:eventId/participants" 
                element={
                  <ProtectedRoute>
                    <ParticipantManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/prizes" 
                element={
                  <ProtectedRoute>
                    <PrizeManagement />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Suspense>
        </main>
        
        {/* Footer - only show on non-admin routes */}
        {!isAdminRoute && <Footer />}
      </div>
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID!}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
