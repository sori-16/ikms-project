// Created by: Soreti (Team Leader) - Demo Implementation
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from './utils/auth';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import SearchPage from './pages/SearchPage';
import DocumentDetail from './pages/DocumentDetail';
import ResearcherDashboard from './pages/ResearcherDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/researcher-dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<SearchPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/document/:id" element={<DocumentDetail />} />

          {/* Protected Routes */}
          <Route
            path="/researcher-dashboard"
            element={
              <ProtectedRoute>
                <ResearcherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moderator-dashboard"
            element={
              <ProtectedRoute allowedRoles={['moderator', 'sys_admin']}>
                <ModeratorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
