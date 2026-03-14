import React, { useState, useEffect } from 'react';
import { AuthState, User as UserType } from '../types';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle, Leaf, Sparkles, X, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthProps {
  onLogin: (state: AuthState) => void;
  onToggle: () => void;
  onEmailPasswordLogin: (email: string, password: string) => Promise<AuthState>;
  onEmailPasswordSignup: (name: string, email: string, password: string) => Promise<AuthState>;
  onGoogleLogin: () => Promise<AuthState>;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AuthLayout: React.FC<{ children: React.ReactNode, title: string, subtitle: string }> = ({ children, title, subtitle }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full lg:w-[52%] flex flex-col justify-center items-center px-6 sm:px-8 lg:px-16 xl:px-24 py-12 lg:py-16 bg-white dark:bg-slate-950 shadow-xl dark:shadow-none lg:shadow-none">
        <div className="w-full max-w-[400px] animate-page-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-[#00796B] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-500/25 dark:shadow-teal-900/40">
              <Leaf size={22} fill="white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-white">{t('brand.name')}</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{t('brand.tagline')}</p>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-2.5xl sm:text-3xl font-bold text-[#212121] dark:text-white mb-1.5 tracking-tight">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#00796B]/90 via-[#00695C]/80 to-slate-900/90" />
        <div className="relative z-10 p-12 xl:p-16 text-white max-w-md">
          <div className="mb-6 w-12 h-1 bg-teal-300 rounded-full" />
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-3">{t('brand.name')}</h2>
          <p className="text-sm font-semibold text-teal-200 uppercase tracking-widest mb-6">{t('brand.tagline')}</p>
          <p className="text-base xl:text-lg text-white/95 leading-relaxed">
            {t(
              'auth.hero_copy',
              'Turn your excess food into meals, not waste. Track inventory, donate to NGOs, and save the planet—one bite at a time.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Login: React.FC<AuthProps> = ({ onLogin, onToggle, onEmailPasswordLogin, onGoogleLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const state = await onEmailPasswordLogin(email, password);
      onLogin(state);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const authState = await onGoogleLogin();
      onLogin(authState);
    } catch (err: any) {
      setError(err.message || "Google Login failed");
    }
    setGoogleLoading(false);
  };

  return (
    <AuthLayout title={t('auth.login_title')} subtitle={t('auth.login_subtitle')}>
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium flex items-center gap-3 border border-red-100 dark:border-red-900/40">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
            <button
                type="button"
                onClick={handleGoogleLoginClick}
                disabled={googleLoading || loading}
                className="w-full bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-500 transition-all flex items-center justify-center gap-3 active:scale-[0.99] min-h-[48px]"
            >
                {googleLoading ? <Loader2 className="animate-spin text-[#00796B]" size={20} /> : <><GoogleIcon /><span>{t('auth.google_login')}</span></>}
            </button>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">Or with email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.email_label')}</label>
                <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="name@example.com" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.password_label')}</label>
                <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="••••••••" required />
                </div>
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/25 hover:bg-[#00695C] hover:shadow-teal-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[48px]">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>{t('auth.login_button')} <ArrowRight size={18} /></>}
            </button>
            </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{t('auth.no_account')} <button type="button" onClick={onToggle} className="text-[#00796B] font-semibold hover:underline focus:outline-none focus:underline">{t('auth.signup_link')}</button></p>
        
        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-2.5 font-medium flex items-center justify-center gap-1.5"><Sparkles size={12} className="text-amber-500" /> {t('auth.demo_shortcut')}</p>
          <button type="button" onClick={() => { setEmail('demo@ecotable.dev'); setPassword('password123'); }} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"><span>demo@ecotable.dev</span><span className="w-1 h-1 bg-slate-400 rounded-full" /><span>password123</span></button>
        </div>

    </AuthLayout>
  );
};

export const Signup: React.FC<AuthProps> = ({ onLogin, onToggle, onEmailPasswordSignup, onGoogleLogin }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const state = await onEmailPasswordSignup(name, email, password);
      onLogin(state);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignupClick = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const authState = await onGoogleLogin();
      onLogin(authState);
    } catch (err: any) {
      setError(err.message || "Google Signup failed");
    }
    setGoogleLoading(false);
  };

  return (
    <AuthLayout title={t('auth.signup_title')} subtitle={t('auth.signup_subtitle')}>
         {error && (
          <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium flex items-center gap-3 border border-red-100 dark:border-red-900/40">
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
             <button type="button" onClick={handleGoogleSignupClick} disabled={googleLoading || loading} className="w-full bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-500 transition-all flex items-center justify-center gap-3 active:scale-[0.99] min-h-[48px]">
                {googleLoading ? <Loader2 className="animate-spin text-[#00796B]" size={20} /> : <><GoogleIcon /><span>Sign up with Google</span></>}
            </button>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">Or with email</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.full_name_label')}</label>
                <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Jane Doe" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.email_label')}</label>
                <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="chef@example.com" required />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('auth.password_label')}</label>
                <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="••••••••" required />
                </div>
            </div>
            <button type="submit" disabled={loading || googleLoading} className="w-full bg-[#00796B] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/25 hover:bg-[#00695C] hover:shadow-teal-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[48px]">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>{t('auth.signup_button')} <CheckCircle size={18} /></>}
            </button>
            </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{t('auth.have_account')} <button type="button" onClick={onToggle} className="text-[#00796B] font-semibold hover:underline focus:outline-none focus:underline">{t('auth.login_link')}</button></p>
    </AuthLayout>
  );
};