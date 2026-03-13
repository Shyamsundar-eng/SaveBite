import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('hi')
    ? 'hi'
    : i18n.language.startsWith('mr')
    ? 'mr'
    : 'en';

  const handleChange = (lng: 'en' | 'hi' | 'mr') => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('savebite_lang', lng);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-1 text-xs font-semibold">
      <button
        type="button"
        onClick={() => handleChange('en')}
        className={`px-2 py-0.5 rounded-full ${current === 'en' ? 'bg-white dark:bg-slate-900 text-[#00796B]' : 'text-slate-500'}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleChange('hi')}
        className={`px-2 py-0.5 rounded-full ${current === 'hi' ? 'bg-white dark:bg-slate-900 text-[#00796B]' : 'text-slate-500'}`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => handleChange('mr')}
        className={`px-2 py-0.5 rounded-full ${current === 'mr' ? 'bg-white dark:bg-slate-900 text-[#00796B]' : 'text-slate-500'}`}
      >
        मराठी
      </button>
    </div>
  );
};

export default LanguageSwitcher;

