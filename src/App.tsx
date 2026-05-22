import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import PatientDashboard from '@/pages/PatientDashboard';
import AdminPanel from '@/pages/AdminPanel';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DoctorListPage from '@/pages/DoctorListPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Portal - Full Page Without Layout */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* All Other Routes - With Layout Wrapper */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
          <Route path="/doctors" element={<Layout><DoctorListPage /></Layout>} />
          <Route path="/book" element={<Navigate to="/dashboard?tab=book" replace />} />
          <Route path="/dashboard" element={
            <Layout>
              <ProtectedRoute allowedRoles={['patient', 'admin']}>
                <PatientDashboard />
              </ProtectedRoute>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
