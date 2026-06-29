import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './components/PublicLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { BookingPage } from './pages/Booking';
import { ContactPage } from './pages/Contact';
import { LoginPage } from './pages/Login';
import { AdminBookingsPage } from './pages/AdminBookings';
import { AdminDriversPage } from './pages/AdminDrivers';
import { AdminSettingsPage } from './pages/AdminSettings';
import { AdminNotificationsPage } from './pages/AdminNotifications';
import { AdminContentPage } from './pages/AdminContent';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<BookingPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/bookings" replace />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="drivers" element={<AdminDriversPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="content" element={<AdminContentPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
