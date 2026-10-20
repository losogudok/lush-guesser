import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { InfoModalType } from './InfoModal';

interface HeaderProps {
  onNavigate: (tab: 'play' | 'leaderboard') => void;
  activeTab: 'play' | 'leaderboard';
  onOpenInfo: (type: InfoModalType) => void;
}

export const Header = ({ onNavigate, activeTab, onOpenInfo }: HeaderProps) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-lush-gray-border">
      <div
        className="cursor-pointer rotate-y-180"
        onClick={() => onNavigate('play')}
      >
        <picture>
          <source srcSet="/logo.webp" media="(prefers-color-scheme: dark)" />
          <img src="/logo.webp" alt="Lush Guesser Logo" className="h-12 w-12" />
        </picture>
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

        <button
          title={t('help.title')}
          className="hover:opacity-70 transition-opacity cursor-pointer"
          onClick={() => onOpenInfo('help')}
        >
          <HelpCircle size={22} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
};

export default Header;
