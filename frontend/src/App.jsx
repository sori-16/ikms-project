/**
 * IKMS Frontend – Application Root
 * Updated: Added Footer, updated routing, light theme
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchPage from './pages/SearchPage';
import DocumentDetail from './pages/DocumentDetail';
import ResearcherDashboard from './pages/ResearcherDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import InstitutionList from './pages/InstitutionList';
import InstitutionProfile from './pages/InstitutionProfile';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MyLibrary from './pages/MyLibrary';
import AuthorProfile from './pages/AuthorProfile';
import InstitutionDashboard from './pages/InstitutionDashboard';
import SysAdminDashboard from './pages/SysAdminDashboard';

// Protected Route
function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const userRole = getUserRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/researcher-dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SearchPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/document/:id" element={<DocumentDetail />} />
            <Route path="/institutions" element={<InstitutionList />} />
            <Route path="/institution/:id" element={<InstitutionProfile />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/library" element={<MyLibrary />} />
            <Route path="/author/:id" element={<AuthorProfile />} />
            <Route path="/institution-dashboard" element={<InstitutionDashboard />} />

            {/* Protected Routes */}
            <Route
              path="/researcher-dashboard"
              element={<ProtectedRoute><ResearcherDashboard /></ProtectedRoute>}
            />
            <Route
              path="/moderator-dashboard"
              element={
                <ProtectedRoute allowedRoles={['moderator', 'sys_admin']}>
                  <ModeratorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sysadmin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['sys_admin']}>
                  <SysAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
