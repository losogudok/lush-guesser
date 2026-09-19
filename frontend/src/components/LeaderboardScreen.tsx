import React, { useEffect, useState } from 'react';
import { HelpCircle, Loader2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FooterLinks from './FooterLinks';
import type { InfoModalType } from './InfoModal';

interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  createdAt: string;
  sample?: boolean;
}

interface LeaderboardScreenProps {
  onNavigate: (tab: 'play' | 'leaderboard') => void;
  activeTab: 'play' | 'leaderboard';
  onOpenInfo: (type: InfoModalType) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onNavigate,
  activeTab,
  onOpenInfo,
}) => {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/leaderboard?limit=20');
        if (!response.ok) {
          throw new Error('Failed to load high scores');
        }
        const data = (await response.json()) as LeaderboardEntry[];
        setEntries(data);
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Error connecting to database',
        );
        // Fallback mock scores to keep the UI beautiful
        setEntries([
          { id: 1, name: 'Karma Queen', score: 450, createdAt: new Date().toISOString(), sample: true },
          { id: 2, name: 'Bath Bomb Bobby', score: 375, createdAt: new Date().toISOString(), sample: true },
          { id: 3, name: 'Lavender Larry', score: 300, createdAt: new Date().toISOString(), sample: true },
          { id: 4, name: 'Rose Petal', score: 250, createdAt: new Date().toISOString(), sample: true },
          { id: 5, name: 'Minty Mike', score: 175, createdAt: new Date().toISOString(), sample: true },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
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

          <button
            title={t('help.title')}
            className="hover:opacity-70 transition-opacity cursor-pointer"
            onClick={() => onOpenInfo('help')}
          >
            <HelpCircle size={22} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-neutral-100 rounded-full mb-4">
            <Trophy className="text-lush-black" size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-cabinet tracking-tight text-lush-black">
            {t('leaderboard.title')}
          </h1>
          <p className="text-gray-500 text-sm tracking-wide mt-2">
            {t('leaderboard.desc')}
          </p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-center text-sm mb-6 font-light">
            {t('leaderboard.offline')}
          </div>
        )}

        <div className="border-2 border-lush-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-lush-black" size={40} />
              <span className="text-sm font-medium text-gray-500 tracking-widest uppercase">{t('leaderboard.loading')}</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-light">
              {t('leaderboard.empty')}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-lush-black text-white text-xs uppercase tracking-widest font-semibold border-b border-lush-black">
                  <th className="px-6 py-4 text-center w-20">{t('leaderboard.rank')}</th>
                  <th className="px-6 py-4">{t('leaderboard.name')}</th>
                  <th className="px-6 py-4 text-right pr-12">{t('leaderboard.score')}</th>
                  <th className="px-6 py-4 text-right">{t('leaderboard.date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lush-gray-border">
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  let rankStyle = "text-gray-600 font-medium";
                  let rowStyle = "hover:bg-neutral-50 transition-colors";
                  
                  if (rank === 1) {
                    rankStyle = "text-yellow-600 font-bold text-lg";
                    rowStyle = "bg-yellow-50/30 hover:bg-yellow-50/50 transition-colors";
                  } else if (rank === 2) {
                    rankStyle = "text-gray-500 font-bold";
                  } else if (rank === 3) {
                    rankStyle = "text-amber-700 font-bold";
                  }

                  return (
                    <tr key={entry.id} className={rowStyle}>
                      <td className={`px-6 py-4 text-center ${rankStyle}`}>
                        {rank}
                      </td>
                      <td className="px-6 py-4 font-semibold text-lush-black text-sm md:text-base">
                        {entry.name}
                        {entry.sample && (
                          <span className="ml-2 rounded border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-yellow-800">
                            {t('leaderboard.sample')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-cabinet text-right pr-12 text-sm md:text-base text-lush-black">
                        {entry.score}
                      </td>
                      <td className="px-6 py-4 text-right text-xs md:text-sm text-gray-500 font-light">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <FooterLinks onOpenInfo={onOpenInfo} showBrand />
    </div>
  );
};
export default LeaderboardScreen;
