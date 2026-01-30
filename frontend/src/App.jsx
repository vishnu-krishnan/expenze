import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import MonthPlan from './pages/MonthPlan';
import Categories from './pages/Categories';
import Templates from './pages/Templates';
import SmsImport from './pages/SmsImport';
import Layout from './components/Layout';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

// Home redirect based on role
function Home() {
  const { user } = useAuth();
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <PrivateRoute><Dashboard /></PrivateRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Home - redirects based on role */}
          <Route path="/" element={<Home />} />

          {/* User Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/month" element={<PrivateRoute><MonthPlan /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><SmsImport /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/regular" element={<PrivateRoute><Templates /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute adminOnly={true}><Admin /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute adminOnly={true}><AdminSettings /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
