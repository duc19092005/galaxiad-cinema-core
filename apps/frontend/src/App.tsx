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
import AllMoviesPage from './features/public/AllMoviesPage';
import FacilitiesManagerPage from './features/facilities/FacilitiesManagerPage';
import MovieManagerPage from './features/movie/MovieManagerPage';
import NotFound from './features/misc/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ScheduleManagerPage from './features/schedule/ScheduleManagerPage';
import TheaterManagerPage from './features/theater/TheaterManagerPage';
import AdminPage from './features/admin/AdminPage';
import MovieDetailPage from './features/booking/MovieDetailPage';
import SimilarMoviesPage from './features/booking/SimilarMoviesPage';
import BookingPage from './features/booking/BookingPage';
import BookingSuccessPage from './features/booking/BookingSuccessPage';
import BookingFailedPage from './features/booking/BookingFailedPage';
import AccountPage from './features/booking/AccountPage';
import { ShowtimesPage } from './features/booking/ShowtimesPage';
import { TheatersPage } from './features/booking/TheatersPage';
import { OffersPage } from './features/booking/OffersPage';
import CashierPage from './features/cashier/CashierPage';
import CashierSalesPage from './features/cashier/CashierSalesPage';
import StaffPortalPage from './features/staff/StaffPortalPage';
import SocialBookingPage from './features/socialBooking/SocialBookingPage';
import ServicesPage from './features/public/ServicesPage';
import HelpPage from './features/public/HelpPage';
import CareerDetailPage from './features/public/CareerDetailPage';
import PrivacyPolicyPage from './features/public/PrivacyPolicyPage';
import TermsOfServicePage from './features/public/TermsOfServicePage';
import AboutUsPage from './features/public/AboutUsPage';
import CareersPage from './features/public/CareersPage';
import CookiePolicyPage from './features/public/CookiePolicyPage';
import SafetyRulesPage from './features/public/SafetyRulesPage';
import LegalPage from './features/public/LegalPage';
import ContactUsPage from './features/public/ContactUsPage';
import ShiftNotificationListener from './components/ShiftNotificationListener';
import ChatBot from './components/ChatBot';
import ScrollToTop from './components/ScrollToTop';
import ScrollRestore from './components/ScrollRestore';

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
        <Route path="/movies" element={<PageTransition><AllMoviesPage /></PageTransition>} />
        <Route path="/showtimes" element={<PageTransition><ShowtimesPage /></PageTransition>} />
        <Route path="/theaters" element={<PageTransition><TheatersPage /></PageTransition>} />
        <Route path="/offers" element={<PageTransition><OffersPage /></PageTransition>} />
        <Route path="/cashier" element={<ProtectedRoute requiredRole="Cashier"><PageTransition><CashierPage /></PageTransition></ProtectedRoute>} />
        <Route path="/cashier/sales" element={<ProtectedRoute requiredRole="Cashier"><PageTransition><CashierSalesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute requiredRole="Cashier"><PageTransition><StaffPortalPage /></PageTransition></ProtectedRoute>} />
        <Route path="/staff/:tab" element={<ProtectedRoute requiredRole="Cashier"><PageTransition><StaffPortalPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/:tab" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="/movie-manager" element={<ProtectedRoute requiredRole="MovieManager"><PageTransition><MovieManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/theater-manager" element={<ProtectedRoute requiredRole="TheaterManager"><PageTransition><TheaterManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/theater-manager/:tab" element={<ProtectedRoute requiredRole="TheaterManager"><PageTransition><TheaterManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/facilities-manager" element={<ProtectedRoute requiredRole="FacilitiesManager"><PageTransition><FacilitiesManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute requiredRole="Admin"><PageTransition><ScheduleManagerPage /></PageTransition></ProtectedRoute>} />
        <Route path="/movie/:movieId" element={<PageTransition><MovieDetailPage /></PageTransition>} />
        <Route path="/movie/:movieId/similar" element={<PageTransition><SimilarMoviesPage /></PageTransition>} />
        <Route path="/booking/:scheduleId" element={<PageTransition><BookingPage /></PageTransition>} />
        <Route path="/booking/success" element={<PageTransition><BookingSuccessPage /></PageTransition>} />
        <Route path="/booking/failed" element={<PageTransition><BookingFailedPage /></PageTransition>} />
        <Route path="/group-booking/:groupCode" element={<PageTransition><SocialBookingPage /></PageTransition>} />
        <Route path="/account" element={<ProtectedRoute><PageTransition><AccountPage /></PageTransition></ProtectedRoute>} />
        <Route path="/services" element={<PageTransition><ServicesPage /></PageTransition>} />
        <Route path="/help" element={<PageTransition><HelpPage /></PageTransition>} />
<Route path="/privacy-policy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfServicePage /></PageTransition>} />
        <Route path="/about-us" element={<PageTransition><AboutUsPage /></PageTransition>} />
        <Route path="/careers" element={<PageTransition><CareersPage /></PageTransition>} />
        <Route path="/careers/:jobId" element={<PageTransition><CareerDetailPage /></PageTransition>} />
        <Route path="/cookie-policy" element={<PageTransition><CookiePolicyPage /></PageTransition>} />
        <Route path="/safety-rules" element={<PageTransition><SafetyRulesPage /></PageTransition>} />
        <Route path="/legal" element={<PageTransition><LegalPage /></PageTransition>} />
        <Route path="/contact-us" element={<PageTransition><ContactUsPage /></PageTransition>} />
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
          <ScrollToTop />
          <ScrollRestore />
          <AppRoutes />
          <ChatBot />
        </Router>
      </CinemaProvider>
    </ThemeProvider>
  );
}

export default App;
