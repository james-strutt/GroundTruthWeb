import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import { queryClient } from './lib/queryClient';
import { initialiseSentry } from './lib/sentry';
import { initialisePostHog } from './lib/posthog';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { OfflineBanner } from './components/shared/OfflineBanner';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { SkeletonMap } from './components/shared/SkeletonMap';

initialiseSentry();
initialisePostHog();

/* ── Lazy-loaded pages ──────────────────────── */

const App = lazy(() => import('./App'));
const LoginPage = lazy(() => import('./pages/Login'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const TermsPage = lazy(() => import('./pages/Terms'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const DirectoryListPage = lazy(() => import('./pages/directories/DirectoryList'));
const DirectoryDetailPage = lazy(() => import('./pages/directories/DirectoryDetail'));
const SnapListPage = lazy(() => import('./pages/snaps/SnapList'));
const SnapDetailPage = lazy(() => import('./pages/snaps/SnapDetail'));
const InspectionListPage = lazy(() => import('./pages/inspections/InspectionList'));
const InspectionDetailPage = lazy(() => import('./pages/inspections/InspectionDetail'));
const AppraisalListPage = lazy(() => import('./pages/appraisals/AppraisalList'));
const AppraisalDetailPage = lazy(() => import('./pages/appraisals/AppraisalDetail'));
const MonitorListPage = lazy(() => import('./pages/monitor/MonitorList'));
const MonitorDetailPage = lazy(() => import('./pages/monitor/MonitorDetail'));
const WalkListPage = lazy(() => import('./pages/walks/WalkList'));
const WalkDetailPage = lazy(() => import('./pages/walks/WalkDetail'));
const PropertyListPage = lazy(() => import('./pages/properties/PropertyList'));
const PropertyDetailPage = lazy(() => import('./pages/properties/PropertyDetail'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--page-bg)' }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <ErrorBoundary>
                <OfflineBanner />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<App />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/pricing" element={<PricingPage />} />

                    {/* Authenticated app */}
                    <Route
                      path="/app"
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Suspense fallback={<SkeletonMap />}><DashboardPage /></Suspense>} />
                      <Route path="directories" element={<DirectoryListPage />} />
                      <Route path="directories/:id" element={<DirectoryDetailPage />} />
                      <Route path="directories/:dirId/properties/:propId" element={<PropertyDetailPage />} />
                      <Route path="properties" element={<PropertyListPage />} />
                      <Route path="properties/:id" element={<PropertyDetailPage />} />
                      <Route path="snaps" element={<SnapListPage />} />
                      <Route path="snaps/:id" element={<SnapDetailPage />} />
                      <Route path="inspections" element={<InspectionListPage />} />
                      <Route path="inspections/:id" element={<InspectionDetailPage />} />
                      <Route path="appraisals" element={<AppraisalListPage />} />
                      <Route path="appraisals/:id" element={<AppraisalDetailPage />} />
                      <Route path="monitor" element={<MonitorListPage />} />
                      <Route path="monitor/:id" element={<MonitorDetailPage />} />
                      <Route path="walks" element={<WalkListPage />} />
                      <Route path="walks/:id" element={<WalkDetailPage />} />
                      <Route path="chat" element={<ChatPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </ToastProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>,
);
