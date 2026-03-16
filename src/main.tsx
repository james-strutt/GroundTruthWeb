import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import App from './App';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import DirectoryListPage from './pages/directories/DirectoryList';
import DirectoryDetailPage from './pages/directories/DirectoryDetail';
import SnapListPage from './pages/snaps/SnapList';
import SnapDetailPage from './pages/snaps/SnapDetail';
import InspectionListPage from './pages/inspections/InspectionList';
import InspectionDetailPage from './pages/inspections/InspectionDetail';
import AppraisalListPage from './pages/appraisals/AppraisalList';
import AppraisalDetailPage from './pages/appraisals/AppraisalDetail';
import MonitorListPage from './pages/monitor/MonitorList';
import MonitorDetailPage from './pages/monitor/MonitorDetail';
import WalkListPage from './pages/walks/WalkList';
import WalkDetailPage from './pages/walks/WalkDetail';
import PropertyListPage from './pages/properties/PropertyList';
import PropertyDetailPage from './pages/properties/PropertyDetail';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated app */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="directories" element={<DirectoryListPage />} />
            <Route path="directories/:id" element={<DirectoryDetailPage />} />
            <Route path="directories/:dirId/properties/:propId" element={<PropertyDetailPage />} />
            <Route path="properties" element={<PropertyListPage />} />
            <Route path="properties/:address" element={<PropertyDetailPage />} />
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
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
