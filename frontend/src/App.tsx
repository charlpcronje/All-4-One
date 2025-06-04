import { Route, Routes, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Dashboard Pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));

// Orchestrator Pages
const ApiListPage = lazy(() => import('./pages/orchestrator/ApiListPage'));
const ApiEditorPage = lazy(() => import('./pages/orchestrator/ApiEditorPage'));
const ApiImportPage = lazy(() => import('./pages/orchestrator/ApiImportPage'));

// Loading Fallback
function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}

// Protected Route Helper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // This would be replaced with actual auth check logic
  const isAuthenticated = true; // For development, assuming logged in
  
  // In a real app, redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/auth/login';
    return <LoadingFallback />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          
          {/* Orchestrator Routes */}
          <Route path="orchestrator" element={<Navigate to="/orchestrator/apis" replace />} />
          <Route path="orchestrator/apis" element={<Suspense fallback={<LoadingFallback />}><ApiListPage /></Suspense>} />
          <Route path="orchestrator/apis/import" element={<Suspense fallback={<LoadingFallback />}><ApiImportPage /></Suspense>} />
          <Route path="orchestrator/apis/:apiId" element={<Suspense fallback={<LoadingFallback />}><ApiEditorPage /></Suspense>} />
          <Route path="plugins" element={<div className="p-6"><h1 className="text-2xl font-bold">Plugins</h1><p className="mt-4 text-muted-foreground">This page will contain the plugin management interface.</p></div>} />
          <Route path="logs" element={<div className="p-6"><h1 className="text-2xl font-bold">Logs</h1><p className="mt-4 text-muted-foreground">This page will contain the log viewer and filtering interface.</p></div>} />
          <Route path="scheduler" element={<div className="p-6"><h1 className="text-2xl font-bold">Scheduler</h1><p className="mt-4 text-muted-foreground">This page will contain the request scheduling interface.</p></div>} />
          <Route path="users" element={<div className="p-6"><h1 className="text-2xl font-bold">Users</h1><p className="mt-4 text-muted-foreground">This page will contain the user management interface.</p></div>} />
          <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="mt-4 text-muted-foreground">This page will contain the system settings interface.</p></div>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
