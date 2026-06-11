import React from 'react';
import { ArrowRight, HelpCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WelcomeScreenProps {
  onStartGame: () => void;
  onNavigate: (tab: 'play' | 'leaderboard') => void;
  activeTab: 'play' | 'leaderboard';
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartGame,
  onNavigate,
  activeTab,
}) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-lush-gray-border">
        <div 
          className="text-2xl font-cabinet tracking-tight cursor-pointer text-lush-black"
          onClick={() => onNavigate('play')}
        >
          {t('app.title')}
        </div>
        
        <nav className="flex items-center space-x-8 font-medium text-sm tracking-wide">
          <button 
            onClick={() => onNavigate('play')}
            className={`pb-1 transition-colors border-b-2 hover:text-lush-black cursor-pointer ${
              activeTab === 'play' ? 'border-lush-black text-lush-black' : 'border-transparent text-gray-500'
            }`}
          >
            {t('nav.play')}
          </button>
          <button 
            onClick={() => onNavigate('leaderboard')}
            className={`pb-1 transition-colors border-b-2 hover:text-lush-black cursor-pointer ${
              activeTab === 'leaderboard' ? 'border-lush-black text-lush-black' : 'border-transparent text-gray-500'
            }`}
          >
            {t('nav.leaderboard')}
          </button>
        </nav>

        <div className="flex items-center space-x-4 text-lush-black">
          {/* Language Toggle Button */}
          <button 
            onClick={toggleLanguage}
            className="hover:bg-neutral-100 border border-lush-black px-2 py-0.5 rounded text-[10px] tracking-widest font-semibold uppercase transition-colors cursor-pointer"
            title={i18n.language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
          >
            {i18n.language === 'en' ? 'RU' : 'EN'}
          </button>

          <button title={t('help.title')} className="hover:opacity-70 transition-opacity cursor-pointer">
            <HelpCircle size={22} strokeWidth={1.5} />
          </button>
          <button title={t('profile.title')} className="hover:opacity-70 transition-opacity cursor-pointer">
            <User size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-cabinet tracking-tighter mb-4 text-lush-black leading-none whitespace-pre-line">
          {t('app.title').replace(' ', '\n')}
        </h1>
        <p className="text-gray-600 text-lg md:text-xl font-light mb-10 max-w-md tracking-wide">
          {t('app.subtitle')}
        </p>
        
        <button
          onClick={onStartGame}
          className="group flex items-center justify-center space-x-3 bg-lush-black text-white hover:bg-neutral-900 px-8 py-4 rounded-full text-sm font-semibold tracking-widest uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md cursor-pointer"
        >
          <span>{t('app.start')}</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </main>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-lush-gray-border text-xs text-gray-500 bg-white">
        <div className="flex space-x-6 mb-4 sm:mb-0">
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Support</a>
        </div>
        <div>
          &copy; 2026 Lush Scent Guesser. Stay Fresh.
        </div>
      </footer>
    </div>
  );
};
export default WelcomeScreen;
