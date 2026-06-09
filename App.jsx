import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Services from './pages/Services';
import PublicJobs from './pages/PublicJobs';
import ForgotPassword from './pages/ForgotPassword';

// Worker Pages
import WorkerDashboard from './pages/worker/Dashboard';
import BrowseJobs from './pages/worker/BrowseJobs';
import JobDetail from './pages/worker/JobDetail';
import MyApplications from './pages/worker/MyApplications';
import WorkerProfile from './pages/worker/Profile';
import WorkerMyProfile from './pages/worker/MyProfile';

// Employer Pages
import EmployerDashboard from './pages/employer/Dashboard';
import PostJob from './pages/employer/PostJob';
import ManageJobs from './pages/employer/ManageJobs';
import JobApplications from './pages/employer/JobApplications';
import EmployerProfile from './pages/employer/Profile';
import EmployerMyProfile from './pages/employer/MyProfile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminJobs from './pages/admin/Jobs';
import AdminApplications from './pages/admin/Applications';

// ==========================================
// FIX #1: Move getDashboardRoute BEFORE it's used
// ==========================================
const getDashboardRoute = (userType) => {
  switch (userType) {
    case 'worker':
      return '/worker/dashboard';
    case 'employer':
      return '/employer/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/jobs" element={<PublicJobs />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={getDashboardRoute(user.userType)} /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to={getDashboardRoute(user.userType)} /> : <Register />} 
        />

        {/* Worker Routes */}
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/jobs"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <BrowseJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <JobDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/applications"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/profile"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/my-profile"
          element={
            <ProtectedRoute allowedRoles={['worker']}>
              <WorkerMyProfile />
            </ProtectedRoute>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/post-job"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <ManageJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/applications/:jobId"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <JobApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/profile"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/my-profile"
          element={
            <ProtectedRoute allowedRoles={['employer']}>
              <EmployerMyProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminApplications />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
