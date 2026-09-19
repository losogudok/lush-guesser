import React, { useState } from 'react';
import { Star, RefreshCw, Home, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FooterLinks from './FooterLinks';
import type { InfoModalType } from './InfoModal';

interface GameOverScreenProps {
  score: number;
  correctAnswers: number;
  totalRounds: number;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  onNavigateToLeaderboard: () => void;
  onOpenInfo: (type: InfoModalType) => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  correctAnswers,
  totalRounds,
  onPlayAgain,
  onReturnHome,
  onNavigateToLeaderboard,
  onOpenInfo,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine Title and Description based on score
  let titleKey = "tier.novice";
  let descKey = "tier.novice.desc";
  
  if (score >= 400) {
    titleKey = "tier.perfumer";
    descKey = "tier.perfumer.desc";
  } else if (score >= 200) {
    titleKey = "tier.enthusiast";
    descKey = "tier.enthusiast.desc";
  }

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), score }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score to global leaderboard');
      }

      setSubmitted(true);
      // Wait a moment and navigate to leaderboard
      setTimeout(() => {
        onNavigateToLeaderboard();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Server connection failed. Could not save score.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-lush-gray-border">
        <div 
          className="text-2xl font-cabinet tracking-tight cursor-pointer text-lush-black"
          onClick={onReturnHome}
        >
          {t('app.title')}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        {/* Star Icon Frame */}
        <div className="border-2 border-lush-black p-4 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white mb-8 inline-flex items-center justify-center">
          <Star className="text-lush-black fill-lush-black" size={32} />
        </div>

        {/* Perfumer Title */}
        <h1 className="text-5xl md:text-7xl font-cabinet tracking-tight text-lush-black mb-4 uppercase leading-none">
          {t(titleKey)}
        </h1>
        
        {/* Subtitle Description */}
        <p className="text-gray-500 font-light text-base md:text-lg mb-10 max-w-md tracking-wide leading-relaxed">
          {t(descKey)}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
          <div className="border-2 border-lush-black p-6 rounded-lg bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{t('gameover.final_score')}</div>
            <div className="text-4xl md:text-5xl font-cabinet text-lush-black">{score}</div>
          </div>
          <div className="border-2 border-lush-black p-6 rounded-lg bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{t('gameover.guesses')}</div>
            <div className="text-4xl md:text-5xl font-cabinet text-lush-black">
              {correctAnswers}<span className="text-2xl text-gray-400">/{totalRounds}</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        <div className="w-full max-w-md mb-10 border-2 border-dashed border-lush-black p-6 rounded-lg bg-lush-gray-bg">
          {submitted ? (
            <div className="text-lush-green font-semibold uppercase tracking-wider text-sm">
              {t('gameover.saved')}
            </div>
          ) : (
            <form onSubmit={handleSubmitScore} className="flex flex-col space-y-3">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-500 text-left">
                {t('gameover.leaderboard_label')}
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={t('gameover.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 20))}
                  maxLength={20}
                  disabled={submitting}
                  className="flex-1 border-2 border-lush-black px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-lush-black disabled:bg-gray-100 font-semibold uppercase text-lush-black"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="bg-lush-black text-white hover:bg-neutral-800 px-6 py-2 text-xs uppercase tracking-widest font-semibold border-2 border-lush-black disabled:bg-gray-400 disabled:border-gray-400 cursor-pointer flex items-center justify-center min-w-[100px]"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    t('gameover.submit')
                  )}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs text-left font-light mt-1">{error}</p>}
            </form>
          )}
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col space-y-4 w-full max-w-xs">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center space-x-2 bg-lush-green hover:bg-[#00c853] text-lush-black border-2 border-lush-black px-6 py-3 font-semibold text-sm tracking-wider uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>{t('gameover.play_again')}</span>
          </button>
          
          <button
            onClick={onReturnHome}
            className="flex items-center justify-center space-x-2 bg-white hover:bg-neutral-50 text-lush-black border-2 border-lush-black px-6 py-3 font-semibold text-sm tracking-wider uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Home size={16} />
            <span>{t('gameover.return_home')}</span>
          </button>
        </div>
      </main>

      <FooterLinks onOpenInfo={onOpenInfo} showBrand />
    </div>
  );
};
export default GameOverScreen;
