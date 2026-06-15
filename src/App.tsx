import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { CinemaProvider } from './contexts/CinemaContext';
import { Toaster } from 'react-hot-toast';
import PageTransition from './components/PageTransition';
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
import { ShowtimesPage } from './features/booking/ShowtimesPage';
import { TheatersPage } from './features/booking/TheatersPage';
import { OffersPage } from './features/booking/OffersPage';
import CashierPage from './features/cashier/CashierPage';
import ServicesPage from './features/public/ServicesPage';
import HelpPage from './features/public/HelpPage';
import ShiftNotificationListener from './components/ShiftNotificationListener';
import ChatBot from './components/ChatBot';

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Route root - check token và redirect */}
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />

        <Route path="/register" element={<PageTransition><RegisterForm /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginForm /></PageTransition>} />
        <Route path="/auth/google-callback" element={<PageTransition><GoogleCallback /></PageTransition>} />

        {/* Protected Routes */}
        <Route path="/role-selection" element={<ProtectedRoute><PageTransition><RoleSelectionPage /></PageTransition></ProtectedRoute>} />
        <Route path="/home" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/showtimes" element={<PageTransition><ShowtimesPage /></PageTransition>} />
        <Route path="/theaters" element={<PageTransition><TheatersPage /></PageTransition>} />
        <Route path="/offers" element={<PageTransition><OffersPage /></PageTransition>} />
        <Route path="/cashier" element={<ProtectedRoute requiredRole="Cashier"><PageTransition><CashierPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/:tab" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="/movie-manager" element={<ProtectedRoute requiredRole="MovieManager"><PageTransition><MovieManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/theater-manager" element={<ProtectedRoute requiredRole="TheaterManager"><PageTransition><TheaterManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/facilities-manager" element={<ProtectedRoute requiredRole="FacilitiesManager"><PageTransition><FacilitiesManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute requiredRole="Admin"><PageTransition><ScheduleManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/movie/:movieId" element={<PageTransition><MovieDetailPage /></PageTransition>} />
        <Route path="/booking/:scheduleId" element={<PageTransition><BookingPage /></PageTransition>} />
        <Route path="/booking/success" element={<PageTransition><BookingSuccessPage /></PageTransition>} />
        <Route path="/booking/failed" element={<PageTransition><BookingFailedPage /></PageTransition>} />
        <Route path="/account" element={<ProtectedRoute><PageTransition><AccountPage /></PageTransition></ProtectedRoute>} />
        <Route path="/services" element={<PageTransition><ServicesPage /></PageTransition>} />
        <Route path="/help" element={<PageTransition><HelpPage /></PageTransition>} />

        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <CinemaProvider>
        <Toaster position="top-right" />
        <Router>
          <ShiftNotificationListener />
          <AppRoutes />
          <ChatBot />
        </Router>
      </CinemaProvider>
    </ThemeProvider>
  );
}

export default App;
