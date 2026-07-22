import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Film, Calendar, MapPin, Ticket, User } from 'lucide-react';
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
import AdminAiPage from './features/admin/AdminAiPage';
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
      <Routes location={location}>
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
        <Route path="/admin/ai" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminAiPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/ai/:module" element={<ProtectedRoute requiredRole="Admin"><PageTransition><AdminAiPage /></PageTransition></ProtectedRoute>} />
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
  );
}

function BottomNavBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const storedUserStr = localStorage.getItem('user_info');
  const user = storedUserStr ? JSON.parse(storedUserStr) : null;

  // Only show bottom nav on public client pages (exclude admin, movie-manager, cashier, staff, etc.)
  const hidePaths = ['/admin', '/movie-manager', '/theater-manager', '/facilities-manager', '/cashier', '/staff', '/login', '/register'];
  const shouldHide = hidePaths.some(p => location.pathname.startsWith(p));

  if (shouldHide) return null;

  const bottomNavItems = [
    { icon: Film, label: t('home.moviesNav', 'Movies'), path: '/home' },
    { icon: Calendar, label: t('home.showtimesNav', 'Showtimes'), path: '/showtimes' },
    { icon: MapPin, label: t('home.theatersNav', 'Theaters'), path: '/theaters' },
    { icon: Ticket, label: t('home.offersNav', 'Offers'), path: '/offers' },
    { icon: User, label: user ? t('header.myProfile', 'Profile') : t('header.login', 'Sign In'), path: user ? '/account' : '/login' },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#111114]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl flex justify-around items-center px-2 py-1.5"
      style={{
        boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
        paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          body {
            padding-bottom: 76px !important;
          }
        }
      `}} />
      {bottomNavItems.map((item, index) => {
        const active = location.pathname === item.path || (item.path === '/home' && location.pathname === '/');
        const Icon = item.icon;
        return (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center relative py-1 flex-1 bg-transparent border-none cursor-pointer"
            style={{ height: 50 }}
          >
            {/* Circular Background Bubble */}
            {active && (
              <div
                className="absolute"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff8a00, #ffb77f)',
                  boxShadow: '0 4px 14px rgba(255, 138, 0, 0.4)',
                  top: -12,
                  zIndex: 0
                }}
              />
            )}

            {/* Icon Wrapper */}
            <div
              className="z-10 flex items-center justify-center"
              style={{
                color: active ? '#111114' : 'rgba(255, 255, 255, 0.6)',
                transform: active ? 'translateY(-16px) scale(1.08)' : 'none',
              }}
            >
              <Icon size={20} />
            </div>

            {/* Label */}
            <span
              className="text-[10px] font-sans font-semibold mt-1 tracking-tight"
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                display: active ? 'none' : 'block'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
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
          <BottomNavBar />
          <ChatBot />
        </Router>
      </CinemaProvider>
    </ThemeProvider>
  );
}

export default App;
