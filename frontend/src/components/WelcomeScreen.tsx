import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FooterLinks from './FooterLinks';
import Header from './Header';
import type { InfoModalType } from './InfoModal';

interface WelcomeScreenProps {
  onStartGame: () => void;
  onNavigate: (tab: 'play' | 'leaderboard') => void;
  activeTab: 'play' | 'leaderboard';
  onOpenInfo: (type: InfoModalType) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartGame,
  onNavigate,
  activeTab,
  onOpenInfo,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header onNavigate={onNavigate} activeTab={activeTab} onOpenInfo={onOpenInfo} />

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

      <FooterLinks onOpenInfo={onOpenInfo} />
    </div>
  );
};
export default WelcomeScreen;
