import React, { useState, useEffect, useMemo } from 'react';
import { UserStats, FoodItem, User } from '../types';
import { Leaf, IndianRupee, Share2, Utensils, Bell, ArrowUp, Plus, Camera, Heart, BookOpen, MapPin, BarChart3, ChevronRight, HeartHandshake, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../App';
import { ALL_BADGES } from './Badges';
import { MOCK_LEADERBOARD_DATA } from './Leaderboard';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  inventory: FoodItem[];
}

const MOTIVATIONAL_QUOTES = [
  "Every meal saved is a win for the planet. 🌍",
  "Small steps lead to big environmental changes. 🌱",
  "Food rescue: The easiest way to fight climate change. 🥗",
  "Your table, zero waste, infinite impact. ✨",
  "Love food, hate waste. 💚",
  "Sustainability starts in your kitchen. 🏠",
  "Reduce, reuse, and rescue. 🔄",
  "Waste-free living looks great on you! 😎",
  "You are making a real difference today. 🌟",
  "Nature thanks you for every bite saved. 🌲"
];

const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
      
      if (progress < duration) {
        const timeRatio = progress / duration;
        const easedProgress = easeOutCubic(timeRatio);
        setCount(easedProgress * value);
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <span>{prefix}{count.toFixed(decimals)}{suffix}</span>;
};

// Internal Confetti Component
const ConfettiRain = () => (
  <div className="fixed inset-0 pointer-events-none z-[3000] overflow-hidden">
    {[...Array(60)].map((_, i) => (
      <div 
        key={i}
        className="absolute w-2 h-2 rounded-full animate-confetti-dashboard"
        style={{
          left: `${Math.random() * 100}%`,
          top: `-5%`,
          backgroundColor: ['#00796B', '#F57C00', '#D32F2F', '#FFD700', '#EC4899'][i % 5],
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1.5 + Math.random() * 2.5}s`
        }}
      />
    ))}
    <style>{`
      @keyframes confetti-dashboard {
        0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 1; }
        25% { transform: translateY(25vh) rotate(90deg) translateX(15px); }
        50% { transform: translateY(50vh) rotate(180deg) translateX(-15px); }
        75% { transform: translateY(75vh) rotate(270deg) translateX(10px); }
        100% { transform: translateY(110vh) rotate(360deg) translateX(0); opacity: 0; }
      }
      .animate-confetti-dashboard { animation-name: confetti-dashboard; animation-timing-function: ease-in; animation-fill-mode: forwards; }
    `}</style>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user, stats, inventory }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // States for interactive feedback and motivation
  const [appreciationMsg, setAppreciationMsg] = useState<string | null>(null);
  const [msgStyles, setMsgStyles] = useState({ 
    text: 'text-[#00796B]', 
    bg: 'bg-teal-50 dark:bg-teal-900/30', 
    border: 'border-teal-100 dark:border-teal-800',
    headerText: 'text-[#00796B] dark:text-teal-400' // Quote color
  });
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Motivational Quote State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteFade, setQuoteFade] = useState(true);

  // Interval for motivational quotes (Every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setQuoteFade(true);
      }, 500); // Small delay for transition
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const expiringItems = inventory
    .filter(item => item.status === 'active')
    .map(item => {
        const days = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        return { ...item, daysLeft: days };
    })
    .filter(item => item.daysLeft <= 4)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);
    
  const earnedBadgeObjects = ALL_BADGES.filter(b => stats.earnedBadges.includes(b.id));

  const leaderboardWidgetData = useMemo(() => {
    const currentUserEntry = {
        id: 'current-user',
        name: user?.name || 'You',
        meals: stats.mealsSaved,
        xp: stats.xp,
        avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`,
        isCurrentUser: true,
        rank: 0
    };
    const all = [...MOCK_LEADERBOARD_DATA, currentUserEntry].sort((a, b) => b.xp - a.xp);
    const ranked = all.map((u, i) => ({ ...u, rank: i + 1 }));
    return ranked.slice(0, 3);
  }, [user, stats]);

  const handleQuickAction = (path: string, state?: any) => {
      navigate(path, { state });
  };

  const handleStatClick = (label: string) => {
    const messages: Record<string, string> = {
      'Meals Saved': "Incredible! You're nourishing the community . 🥗",
      'CO₂ Prevented': "Planet Hero! Your efforts are helping our Earth breathe easier. 🌍",
      'Money Saved': "Smart Choice! Every Rupee saved is a victory for your wallet and the world. 💰",
      'Donations Made': "Heart of Gold! Your generosity is changing lives every single day. ❤️"
    };

    const styles: Record<string, any> = {
      'Meals Saved': { text: 'text-[#00796B]', bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-100 dark:border-teal-800', headerText: 'text-[#00796B]' },
      'CO₂ Prevented': { text: 'text-[#43A047]', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-100 dark:border-green-800', headerText: 'text-[#43A047]' },
      'Money Saved': { text: 'text-[#EF6C00]', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-100 dark:border-orange-800', headerText: 'text-[#EF6C00]' },
      'Donations Made': { text: 'text-[#D81B60]', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800', headerText: 'text-[#D81B60]' }
    };

    setAppreciationMsg(messages[label]);
    setMsgStyles(styles[label]);
    setShowConfetti(true);

    setTimeout(() => {
      setAppreciationMsg(null);
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-page-in relative">
      {showConfetti && <ConfettiRain />}

      {/* Header Summary Section */}
      <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1 min-w-[260px]">
            <h2 className="font-bold text-3xl md:text-4xl text-[#212121] dark:text-white leading-tight mb-2 tracking-tight">
                {t('common.welcome_back')}<br /><span className="text-[#00796B] dark:text-teal-400">{user?.name?.split(' ')[0] || 'Chef'}</span> 👋
            </h2>
            
            <div className={`flex items-center gap-3 font-semibold transition-all duration-500 ${quoteFade ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} ${msgStyles.headerText} text-[15px] md:text-[18px] leading-snug`}>
               <Sparkles size={20} fill="currentColor" className="animate-pulse shrink-0" />
               <span>{MOTIVATIONAL_QUOTES[quoteIndex]}</span>
            </div>
            
            <div className={`min-h-[40px] mt-3 transition-all duration-500 overflow-hidden ${appreciationMsg ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none h-0 mt-0'}`}>
               <div className={`inline-flex items-center gap-2 ${msgStyles.bg} ${msgStyles.text} px-4 py-2 rounded-xl text-xs font-semibold border ${msgStyles.border}`}>
                  <Sparkles size={14} className="animate-pulse shrink-0" />
                  {appreciationMsg}
               </div>
            </div>
          </div>
          <button 
            onClick={() => handleQuickAction('/inventory')}
            className="bg-[#00796B] hover:bg-[#00695C] text-white font-bold text-[15px] px-5 py-3 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/30 active:scale-[0.98] hover:-translate-y-0.5 transition-all min-h-[48px] whitespace-nowrap flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" /> {t('common.add_food')}
          </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { icon: Utensils, label: t('stats.meals_saved'), value: stats.mealsSaved, color: 'bg-[#00796B]', prefix: '', suffix: '', decimals: 0 },
          { icon: Leaf, label: t('stats.co2_prevented'), value: stats.co2Saved, color: 'bg-[#43A047]', prefix: '', suffix: ' kg', decimals: 1 },
          { icon: IndianRupee, label: t('stats.money_saved'), value: stats.moneySaved, color: 'bg-[#EF6C00]', prefix: '₹', suffix: '', decimals: 0 },
          { icon: HeartHandshake, label: t('stats.donations_made'), value: stats.donationsCompleted, color: 'bg-[#D81B60]', prefix: '', suffix: '', decimals: 0 }
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => handleStatClick(stat.label)}
            className="card-hover text-left bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between min-h-[112px] group overflow-hidden relative active:scale-[0.99]"
          >
            <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                <stat.icon size={22} color="white" />
            </div>
            <div className="mt-3">
                <div className="font-bold text-xl text-[#212121] dark:text-white">
                    <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-bold text-lg text-[#212121] dark:text-white mb-3">{t('common.quick_actions', 'Quick Actions')}</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {[
                { icon: Plus, color: '#00796B', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200/80 dark:border-teal-800', title: t('common.add_item'), path: '/inventory', state: { action: 'add' } },
                { icon: Camera, color: '#0288D1', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200/80 dark:border-sky-800', title: t('common.scan_food'), path: '/inventory', state: { action: 'scan' } },
                { icon: Heart, color: '#D32F2F', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200/80 dark:border-red-800', title: t('common.donate'), path: '/donate' },
                { icon: BookOpen, color: '#E65100', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200/80 dark:border-orange-800', title: t('common.recipes'), path: '/recipes' },
                { icon: MapPin, color: '#7B1FA2', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200/80 dark:border-purple-800', title: t('common.find_ngos'), path: '/ngos' },
                { icon: BarChart3, color: '#455A64', bg: 'bg-slate-100 dark:bg-slate-800/80', border: 'border-slate-200 dark:border-slate-700', title: t('common.analytics'), path: '/analytics' }
            ].map((action, i) => (
                <button 
                    key={i}
                    onClick={() => handleQuickAction(action.path, action.state)}
                    className={`card-hover ${action.bg} ${action.border} relative h-[100px] md:h-[108px] rounded-xl flex flex-col items-center justify-center p-2 border active:scale-[0.98] group`}
                >
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-200">
                        <action.icon size={22} strokeWidth={2.5} style={{ color: action.color }} />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-tight text-center">
                        {action.title}
                    </span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24 md:pb-4">
          <div>
            <div className="flex justify-between items-baseline mb-3">
                <h3 className="font-bold text-lg text-[#212121] dark:text-white">{t('common.expiring_soon')}</h3>
                <button onClick={() => navigate('/inventory')} className="text-[#00796B] text-sm font-semibold hover:underline active:scale-95 transition-transform">{t('common.view_all')}</button>
            </div>
            <div className="flex flex-col gap-2">
                {expiringItems.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                        <p className="font-medium text-slate-600 dark:text-slate-300">{t('common.no_expiring_items')}</p>
                    </div>
                ) : (
                    expiringItems.map(item => {
                        const isExpired = item.daysLeft < 0;
                        return (
                            <button
                                key={item.id}
                                className="card-hover w-full text-left bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 active:scale-[0.99]" 
                                onClick={() => navigate('/inventory')}
                            >
                                <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl ${isExpired ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                                    {isExpired ? '⚠️' : '🕒'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[15px] text-[#212121] dark:text-slate-100 truncate">{item.name}</div>
                                    <span className={`${isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'} text-xs font-medium`}>
                                        {isExpired ? t('common.expired') : t('common.expires_in_days', { count: item.daysLeft })}
                                    </span>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 shrink-0" />
                            </button>
                        );
                    })
                )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-lg text-[#212121] dark:text-white mb-3">{t('common.community_leaderboard')}</h3>
                <div className="flex flex-col gap-2">
                    {leaderboardWidgetData.map((leader, i) => (
                        <div key={i} className={`flex items-center p-3 rounded-xl transition-colors ${leader.isCurrentUser ? 'bg-[#00796B]/10 dark:bg-[#00796B]/15 border border-[#00796B]/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'}`}>
                            <span className="w-6 font-bold text-sm text-slate-500 dark:text-slate-400 text-center shrink-0">{leader.rank}</span>
                            <img src={leader.avatar} alt={leader.name} className="w-9 h-9 rounded-full mx-3 bg-slate-200 dark:bg-slate-700 object-cover shrink-0 ring-2 ring-white dark:ring-slate-800" />
                            <div className="flex-1 font-semibold text-sm text-[#212121] dark:text-white truncate">{leader.name} {leader.isCurrentUser && <span className="text-[#00796B]">({t('common.you')})</span>}</div>
                            <span className="font-bold text-sm text-[#00796B] shrink-0">{leader.xp.toLocaleString()} XP</span>
                        </div>
                    ))}
                    <button onClick={() => navigate('/leaderboard')} className="text-sm font-semibold text-[#00796B] mt-1 flex items-center justify-center gap-1 hover:underline active:scale-95">{t('common.full_community_ranking')} <ChevronRight size={14} /></button>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
