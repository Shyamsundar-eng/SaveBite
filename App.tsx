
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ChefHat, Heart, MapPin, LogOut, Leaf, Moon, Sun, User as UserIcon } from 'lucide-react';
import { FoodItem, UserStats, Recipe, FoodCategory, AuthState, ThemeContextType, Theme, User, DonationHistoryItem } from './types';
import { FirebaseAuthService } from './services/firebaseAuth';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Recipes from './components/Recipes';
import Donation from './components/Donation';
import NGOMap from './components/NGOMap';
import Analytics from './components/Analytics';
import Badges from './components/Badges';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import { Login, Signup } from './components/Auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

// --- Theme Context ---
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// --- MOCK DATA: For Demo User Only ---
const MOCK_INVENTORY: FoodItem[] = [
  { id: "m1", name: "Ground Beef Patty", category: FoodCategory.MEAT, quantity: 1, unit: "pcs", expiryDate: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active', condition: 'Expired' },
  { id: "m2", name: "Tomato Slice", category: FoodCategory.PRODUCE, quantity: 4, unit: "pcs", expiryDate: new Date(Date.now() + 1 * 86400000).toISOString(), status: 'active', condition: 'Ripe' },
  { id: "m3", name: "Sesame Seed Buns", category: FoodCategory.BAKERY, quantity: 2, unit: "pcs", expiryDate: new Date(Date.now() + 3 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m4", name: "Cheddar Cheese", category: FoodCategory.DAIRY, quantity: 1, unit: "pack", expiryDate: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'active', condition: 'Good' },
  { id: "m5", name: "Iceberg Lettuce", category: FoodCategory.PRODUCE, quantity: 1, unit: "head", expiryDate: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'active', condition: 'Fresh' },
  { id: "m6", name: "Mayonnaise Jar", category: FoodCategory.OTHER, quantity: 1, unit: "jar", expiryDate: new Date(Date.now() + 60 * 86400000).toISOString(), status: 'active', condition: 'Good' }
];

const MOCK_STATS: UserStats = {
  mealsSaved: 145,
  co2Saved: 320.5,
  moneySaved: 4500,
  donationsCompleted: 24,
  streakDays: 12,
  level: 8,
  xp: 8450,
  earnedBadges: ['b1', 'b2', 'b3', 'b4'],
  history: [
    { id: 'h1', foodName: 'Bulk Potato Sacks (10kg)', date: 'Jan 15, 2:00 PM', ngoName: 'City Care Food Bank', status: 'completed', points: 500 },
    { id: 'h2', foodName: 'Organic Tomato Crate', date: 'Jan 22, 10:30 AM', ngoName: 'Helping Hands Shelter', status: 'completed', points: 350 }
  ]
};

// --- INITIAL STATES: For Genuie New Users ---
const EMPTY_STATS: UserStats = {
    mealsSaved: 0,
    co2Saved: 0,
    moneySaved: 0,
    donationsCompleted: 0,
    streakDays: 0,
    level: 1,
    xp: 0,
    earnedBadges: [],
    history: []
};

// Sidebar Component
const Sidebar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navItems = [
    { path: '/', icon: Home, label: t('common.dashboard', 'Dashboard') },
    { path: '/inventory', icon: Package, label: t('common.inventory', 'Inventory') },
    { path: '/recipes', icon: ChefHat, label: t('common.recipes') },
    { path: '/donate', icon: Heart, label: t('common.donate') },
    { path: '/ngos', icon: MapPin, label: t('common.find_ngos') },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen bg-white dark:bg-slate-900 border-r border-[#EEEEEE] dark:border-slate-800 fixed left-0 top-0 z-50 transition-colors duration-300">
      <div className="p-6 flex items-center gap-3 mb-6 group cursor-pointer" onClick={() => window.location.hash = '#/'}>
        <div className="w-10 h-10 bg-[#00796B] rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-teal-100 dark:shadow-teal-900/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"><Leaf size={20} fill="white" /></div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-[#212121] dark:text-slate-100 leading-none group-hover:text-[#00796B] transition-colors">{t('brand.name')}</h1>
          <p className="text-[9px] text-[#757575] dark:text-slate-400 font-bold uppercase tracking-tighter mt-1 group-hover:translate-x-0.5 transition-transform">{t('brand.tagline')}</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02] hover:-translate-y-0.5 active:scale-95 ${isActive ? 'bg-[#00796B]/10 text-[#00796B] font-semibold shadow-sm' : 'text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md'}`}>
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-300 ${isActive ? 'text-[#00796B] scale-110' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200 group-hover:scale-110'}`} />
              <span className={`transition-colors duration-300 ${isActive ? 'text-[#00796B]' : 'text-[#757575] dark:text-slate-400 group-hover:text-[#212121] dark:group-hover:text-slate-200'}`} >{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#EEEEEE] dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-center mb-1">
          <LanguageSwitcher />
        </div>
        <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#757575] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all w-full mb-2 group">
          {theme === 'light' ? <Moon size={22} className="group-hover:rotate-[360deg] transition-transform duration-700" /> : <Sun size={22} className="group-hover:rotate-[360deg] transition-transform duration-700" />}
          <span className="group-hover:text-[#212121] dark:group-hover:text-white transition-colors">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95 group">
          <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="Profile" className="w-10 h-10 rounded-full bg-slate-200 shadow-sm group-hover:ring-2 group-hover:ring-[#00796B] transition-all" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#212121] dark:text-white truncate group-hover:text-[#00796B] transition-colors">{user?.name}</p>
            <p className="text-xs text-[#757575] dark:text-slate-400 truncate">View Profile</p>
          </div>
          <UserIcon size={16} className="text-slate-400 group-hover:text-[#00796B] transition-colors" />
        </NavLink>
      </div>
    </aside>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = [
    { path: '/', icon: Home, label: t('common.dashboard') },
    { path: '/inventory', icon: Package, label: t('common.inventory') },
    { path: '/recipes', icon: ChefHat, label: t('common.recipes') },
    { path: '/donate', icon: Heart, label: t('common.donate') },
    { path: '/ngos', icon: MapPin, label: t('common.find_ngos') },
    { path: '/profile', icon: UserIcon, label: t('common.profile', 'Profile') },
  ];

  return (
    <nav aria-label="Bottom navigation" className="md:hidden fixed bottom-0 left-0 right-0 h-[80px] bg-white dark:bg-slate-900 border-t border-[rgba(33,33,33,0.04)] dark:border-slate-800 z-[100] flex justify-around items-center pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink key={item.path} to={item.path} aria-label={item.label} className="flex flex-col items-center justify-center w-[60px] relative group active:scale-90 transition-all">
            {isActive && <div className="absolute -top-3 w-[32px] h-[3px] bg-[#00796B] rounded-b-[2px] shadow-[0_2px_8px_#00796B80] animate-in slide-in-from-top-1"></div>}
            <div className={`transition-all duration-300 ${isActive ? 'scale-125' : 'group-hover:scale-110'}`}><item.icon size={24} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#00796B' : undefined} className={!isActive ? 'text-[#757575] dark:text-slate-500 group-hover:text-[#212121] dark:group-hover:text-white' : ''} /></div>
            <span className={`text-[10px] font-medium mt-[4px] leading-none transition-all duration-300 ${isActive ? 'text-[#00796B] font-bold' : 'text-[#757575] dark:text-slate-500 group-hover:text-[#212121] dark:group-hover:text-white'}`}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

const AppContent = ({ auth, stats, inventory, recipes, handleLogout, handleAddItem, handleUpdateStatus, handleDeleteItem, handleEditItem, handleCookRecipe, handleUpdateRecipes, handleDonateComplete, handleUpdateStats }: any) => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { if (mainRef.current) mainRef.current.scrollTo(0, 0); }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-slate-950 font-sans text-[#212121] dark:text-slate-100 flex transition-colors duration-300">
      <Sidebar user={auth.user} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-[240px] h-screen overflow-hidden">
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-[90px] md:pb-0 scroll-smooth">
          <div className="w-full max-w-[1200px] mx-auto md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard user={auth.user} stats={stats} inventory={inventory} />} />
              <Route path="/inventory" element={<Inventory items={inventory} onAddItem={handleAddItem} onUpdateStatus={handleUpdateStatus} onDeleteItem={handleDeleteItem} onEditItem={handleEditItem} />} />
              <Route path="/recipes" element={<Recipes inventory={inventory} recipes={recipes} onUpdateRecipes={handleUpdateRecipes} onCookRecipe={handleCookRecipe} />} />
              <Route path="/donate" element={<Donation inventory={inventory} stats={stats} onDonateComplete={handleDonateComplete} />} />
              <Route path="/ngos" element={<NGOMap />} />
              <Route path="/analytics" element={<Analytics stats={stats} />} />
              <Route path="/badges" element={<Badges stats={stats} />} />
              <Route path="/leaderboard" element={<Leaderboard user={auth.user} stats={stats} />} />
              <Route path="/profile" element={<Profile user={auth.user} stats={stats} onLogout={handleLogout} onUpdateStats={handleUpdateStats} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  const [auth, setAuth] = useState<AuthState>(FirebaseAuthService.init());
  const [isLoginView, setIsLoginView] = useState(true);
  const [inventory, setInventory] = useState<FoodItem[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    const unsubscribe = FirebaseAuthService.subscribe((state) => {
      setAuth(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle initialization of profile specific data
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
        const key = `savebite_data_${auth.user.id}`;
        const storedData = localStorage.getItem(key);
        
        if (storedData) {
             try {
                 const parsed = JSON.parse(storedData);
                 setInventory(parsed.inventory || []);
                 setStats(parsed.stats || EMPTY_STATS);
             } catch (e) {
                 setInventory([]);
                 setStats(EMPTY_STATS);
             }
        } else {
             // NO DATA FOUND: First time login for this user
             if (auth.user.email === 'demo@ecotable.dev') {
                // MOCK DATA for Demo User
                setInventory(MOCK_INVENTORY);
                setStats(MOCK_STATS);
             } else {
                // GENUINE DATA (EMPTY) for real new users
                setInventory([]);
                setStats(EMPTY_STATS);
             }
        }
        setIsDataInitialized(true);
    } else {
        // If not authenticated, ensure states are reset
        setInventory([]);
        setStats(EMPTY_STATS);
        setIsDataInitialized(false);
    }
  }, [auth.isAuthenticated, auth.user?.id, auth.user?.email]);

  // Persist data on changes
  useEffect(() => {
    if (isDataInitialized && auth.isAuthenticated && auth.user?.id) {
        const key = `savebite_data_${auth.user.id}`;
        localStorage.setItem(key, JSON.stringify({ inventory, stats }));
    }
  }, [inventory, stats, auth.isAuthenticated, auth.user?.id, isDataInitialized]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleLogin = (state: AuthState) => setAuth(state);
  const handleLogout = () => {
    FirebaseAuthService.logout().then(setAuth);
    // Force a clean state reset
    setInventory([]);
    setStats(EMPTY_STATS);
    setGeneratedRecipes([]);
    setIsDataInitialized(false);
    // Simple redirect to home
    window.location.hash = '#/';
  };

  const handleAddItem = (item: FoodItem) => setInventory(prev => [item, ...prev]);
  const handleDeleteItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  const handleEditItem = (updatedItem: FoodItem) => setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  
  const handleUpdateStatus = (id: string, status: 'donated' | 'wasted' | 'consumed') => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    if (status === 'donated') {
      setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, donationsCompleted: (prev.donationsCompleted || 0) + 1, co2Saved: parseFloat((prev.co2Saved + 0.5).toFixed(1)), moneySaved: prev.moneySaved + 5, xp: prev.xp + 50 }));
    }
  };

  const handleCookRecipe = (recipe: Recipe) => {
    setInventory(prev => prev.map(item => {
      const isUsed = recipe.ingredients.some(ing => ing.toLowerCase().includes(item.name.toLowerCase()));
      return isUsed && item.status === 'active' ? { ...item, status: 'consumed' } : item;
    }));
    setStats(prev => ({ ...prev, mealsSaved: prev.mealsSaved + 1, co2Saved: parseFloat((prev.co2Saved + 0.8).toFixed(1)), moneySaved: prev.moneySaved + 10, xp: prev.xp + 100 }));
  };

  const handleDonateComplete = (itemIds: string[], amount: number) => {
    setInventory(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status: 'donated' } : item));
    setStats(prev => ({ 
      ...prev, 
      mealsSaved: prev.mealsSaved + itemIds.length, 
      donationsCompleted: (prev.donationsCompleted || 0) + 1, 
      moneySaved: prev.moneySaved + amount, 
      co2Saved: parseFloat((prev.co2Saved + (itemIds.length * 0.5)).toFixed(1)), 
      xp: prev.xp + (itemIds.length * 50) 
    }));
  };

  const handleUpdateStats = (newStats: UserStats) => setStats(newStats);

  if (!auth.isAuthenticated) {
    return isLoginView ? (
      <Login
        onLogin={handleLogin}
        onToggle={() => setIsLoginView(false)}
        onEmailPasswordLogin={(email, password) => FirebaseAuthService.login(email, password)}
        onEmailPasswordSignup={(name, email, password) => FirebaseAuthService.signup(name, email, password)}
        onGoogleLogin={() => FirebaseAuthService.loginWithGoogle()}
      />
    ) : (
      <Signup
        onLogin={handleLogin}
        onToggle={() => setIsLoginView(true)}
        onEmailPasswordLogin={(email, password) => FirebaseAuthService.login(email, password)}
        onEmailPasswordSignup={(name, email, password) => FirebaseAuthService.signup(name, email, password)}
        onGoogleLogin={() => FirebaseAuthService.loginWithGoogle()}
      />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <AppContent auth={auth} stats={stats} inventory={inventory} recipes={generatedRecipes} handleLogout={handleLogout} handleAddItem={handleAddItem} handleDeleteItem={handleDeleteItem} handleUpdateStatus={handleUpdateStatus} handleEditItem={handleEditItem} handleCookRecipe={handleCookRecipe} handleUpdateRecipes={setGeneratedRecipes} handleDonateComplete={handleDonateComplete} handleUpdateStats={handleUpdateStats} />
      </HashRouter>
    </ThemeContext.Provider>
  );
}
