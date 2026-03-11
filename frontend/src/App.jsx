import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';

// Public Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Admin Layout Components
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import SearchPage from './pages/SearchPage';
import DocumentDetail from './pages/DocumentDetail';
import ResearcherDashboard from './pages/ResearcherDashboard';
import InstitutionList from './pages/InstitutionList';
import InstitutionProfile from './pages/InstitutionProfile';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MyLibrary from './pages/MyLibrary';
import AuthorProfile from './pages/AuthorProfile';

// Admin Pages
import ModeratorDashboard from './pages/admin/ModeratorDashboard';
import SysAdminDashboard from './pages/admin/SysAdminDashboard';
import InstitutionDashboard from './pages/admin/InstitutionDashboard';

// Protected Route Wrapper (Generic)
function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const userRole = getUserRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/researcher-dashboard" replace />;
  }
  return children;
}

// Layout wrapper for public pages (includes Navbar and Footer)
function PublicLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public Routes (Wrapped in PublicLayout) ── */}
        <Route path="/" element={<PublicLayout><SearchPage /></PublicLayout>} />
        <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
        <Route path="/document/:id" element={<PublicLayout><DocumentDetail /></PublicLayout>} />
        <Route path="/institutions" element={<PublicLayout><InstitutionList /></PublicLayout>} />
        <Route path="/institution/:id" element={<PublicLayout><InstitutionProfile /></PublicLayout>} />
        <Route path="/analytics" element={<PublicLayout><AnalyticsDashboard /></PublicLayout>} />
        <Route path="/author/:id" element={<PublicLayout><AuthorProfile /></PublicLayout>} />

        {/* Researcher routes still use Public Layout */}
        <Route path="/library" element={
          <ProtectedRoute>
            <PublicLayout><MyLibrary /></PublicLayout>
          </ProtectedRoute>
        } />
        <Route path="/researcher-dashboard" element={
          <ProtectedRoute>
            <PublicLayout><ResearcherDashboard /></PublicLayout>
          </ProtectedRoute>
        } />

        {/* ── Admin Routes (Wrapped in AdminLayout) ── */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* Default redirect for /admin */}
          <Route index element={<Navigate to="/admin/moderator" replace />} />

          <Route path="moderator" element={
            <ProtectedRoute allowedRoles={['moderator', 'sys_admin']}>
              <ModeratorDashboard />
            </ProtectedRoute>
          } />
          <Route path="sysadmin" element={
            <ProtectedRoute allowedRoles={['sys_admin']}>
              <SysAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="institution" element={
            <ProtectedRoute allowedRoles={['inst_admin', 'sys_admin']}>
              <InstitutionDashboard />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
