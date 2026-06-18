import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldAlert, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-black font-sans select-none">
      {/* --- Background Layers --- */}
      <div
        className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')",
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/90 to-red-950/30"></div>

      {/* --- Spotlight Effect --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/20 blur-[120px] rounded-full animate-pulse-slow"></div>

      {/* --- Main Content --- */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-lg">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          {/* Cuộn phim quay chậm */}
          <Film className="w-32 h-32 text-red-700/50 animate-[spin_4s_linear_infinite] absolute top-0 left-0 blur-sm" />

          {/* Icon chính sắc nét */}
          <div className="relative z-10 p-4 bg-black/60 rounded-full border-2 border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.5)] backdrop-blur-md">
            <ShieldAlert className="w-20 h-20 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* Big 401 Text */}
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-300 to-red-600 drop-shadow-[0_5px_15px_rgba(220,38,38,0.8)] tracking-tighter">
          401
        </h1>

        {/* Headline */}
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white uppercase tracking-widest">
          {t('unauthorized.title', 'Access Denied')}
        </h2>

        {/* Description */}
        <p className="mt-4 text-gray-400 text-lg font-medium">
          {t('unauthorized.description', "You don't have permission to view this scene.")}
        </p>
        <p className="text-gray-500 text-sm">
          {t('unauthorized.errorCode', '(Error Code: UNAUTHORIZED_ACCESS)')}
        </p>

        {/* Back to Login Button */}
        <Link
          to="/login"
          className="group relative mt-10 inline-flex items-center gap-3 px-8 py-4 bg-red-700 text-white font-bold uppercase tracking-widest rounded-xl overflow-hidden transition-all hover:bg-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] active:scale-95 ring-1 ring-white/20"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />
          <LogIn className="w-5 h-5 relative z-10" />
          <span className="relative z-10">{t('unauthorized.backButton', 'Back to Login')}</span>
        </Link>
      </div>

      {/* Footer decoration */}
      <div className="absolute bottom-4 text-gray-600 text-xs uppercase tracking-[0.3em] font-bold opacity-50">
        {t('unauthorized.footer', 'Cinema Paradiso System')}
      </div>
    </div>
  );
};

export default Unauthorized;
