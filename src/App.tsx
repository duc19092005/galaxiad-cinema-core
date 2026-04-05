import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CinemaProvider } from './contexts/CinemaContext';
import { Toaster } from 'react-hot-toast';
import RegisterForm from './features/auth/RegisterForm';
import LoginForm from './features/auth/LoginForm';
import GoogleCallback from './features/auth/GoogleCallback';
import RoleSelectionPage from './features/auth/RoleSelectionPage';
import HomePage from './features/public/HomePage';
import FacilitiesManagerPage from './features/facilities/FacilitiesManagerPage';
import MovieManagerPage from './features/movie/MovieManagerPage';
import NotFound from './features/misc/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ScheduleManagerPage from './features/schedule/ScheduleManagerPage';
import TheaterManagerPage from './features/theater/TheaterManagerPage';
import AdminPage from './features/admin/AdminPage';
import MovieDetailPage from './features/booking/MovieDetailPage';
import BookingPage from './features/booking/BookingPage';
import BookingSuccessPage from './features/booking/BookingSuccessPage';
import BookingFailedPage from './features/booking/BookingFailedPage';
import AccountPage from './features/booking/AccountPage';

function App() {
  return (
    <ThemeProvider>
      <CinemaProvider>
        <Toaster position="top-right" />
        <Router>
        <Routes>
          {/* Route root - check token và redirect */}
          <Route path="/" element={<HomePage />} />

          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />

          {/* Protected Routes */}
          <Route path="/role-selection" element={<ProtectedRoute><RoleSelectionPage /></ProtectedRoute>} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/cashier" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="Admin"><AdminPage /></ProtectedRoute>} />
          <Route path="/movie-manager" element={<ProtectedRoute requiredRole="MovieManager"><MovieManagerPage /></ProtectedRoute>} />
          <Route path="/theater-manager" element={<ProtectedRoute requiredRole="TheaterManager"><TheaterManagerPage /></ProtectedRoute>} />
          <Route path="/facilities-manager" element={<ProtectedRoute requiredRole="FacilitiesManager"><FacilitiesManagerPage /></ProtectedRoute>} />
          <Route path="/movie/:movieId" element={<MovieDetailPage />} />
          <Route path="/booking/:scheduleId" element={<BookingPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/booking/failed" element={<BookingFailedPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/schedule" element={<ScheduleManagerPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </CinemaProvider>
    </ThemeProvider>
  );
}

export default App;
