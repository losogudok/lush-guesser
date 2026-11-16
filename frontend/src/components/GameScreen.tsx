import React, { useState } from 'react';
import { productCatalog } from '../data/products';
import { Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

import { AnswerChoices } from './game/AnswerChoices';
import { IngredientClueCarousel } from './game/IngredientClueCarousel';
import { RoundResult } from './game/RoundResult';
import { isFinalRound } from '../game/gameSession';
import { useGameStore } from '../game/useGameStore';
import { useNavigation } from '../ui/useNavigation';

export const GameScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigation();
  const currentLang: 'ru' | 'en' = i18n.language === 'ru' ? 'ru' : 'en';

  const session = useGameStore((state) => state.session);
  const revealNextClue = useGameStore((state) => state.revealNextClue);
  const guess = useGameStore((state) => state.guess);
  const nextRound = useGameStore((state) => state.nextRound);
  const [shake, setShake] = useState<boolean>(false);

  if (!session) return null;

  const currentRound = session.rounds[session.currentRoundIndex] ?? null;
  const guessed = session.guessCorrect !== null;
  const activeWorth = session.pointsEarned ?? session.currentPointValue;

  const handleRevealNext = () => {
    revealNextClue();
  };

  const handleGuess = (optionId: string) => {
    const guessCorrect = guess(optionId);
    if (guessCorrect === null) return;

    if (guessCorrect) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00E676', '#EEFF00', '#4CE3E6', '#000000'],
      });
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleNextRound = () => {
    nextRound();
    setShake(false);
  };

  if (!currentRound) return null;
  const currentProduct = currentRound.product;
  const getProductName = (id: string) => {
    const product = productCatalog.products.find((candidate) => candidate.id === id);
    return product ? product.name[currentLang] : id;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Game Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-lush-gray-border">
        <button 
          onClick={() => navigate('welcome')}
          title={t('game.quit')} 
          className="text-lush-black hover:opacity-70 transition-opacity cursor-pointer flex items-center space-x-1"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
        
        <div className="text-xl font-cabinet tracking-wide text-lush-black">
          {t('game.round', { round: session.currentRoundIndex + 1 })}
        </div>

        <div className="border-2 border-lush-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white text-lush-black">
          {t('game.score', { score: session.score })}
        </div>
      </header>

      {/* Worth Indicator Banner */}
      <div className="flex justify-center pbs-16 bg-white">
        <div className="flex items-center space-x-2 bg-lush-yellow border-2 border-lush-black px-6 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-md font-semibold text-xs tracking-wider uppercase text-lush-black">
          <Star size={14} className="fill-lush-black text-lush-black" />
          <span>
            {t('game.worth', { count: activeWorth })}
          </span>
        </div>
      </div>

      {/* Gameplay Core */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col items-center">
        <IngredientClueCarousel
          key={currentProduct.id}
          product={currentProduct}
          revealedCount={session.revealedIngredientClueCount}
          guessed={guessed}
          t={t}
          onRevealNext={handleRevealNext}
        />

        {/* Prompt Title */}
        {!guessed ? (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-cabinet tracking-tight text-lush-black uppercase mb-2">
              {t('game.whats_scent')}
            </h2>
            <p className="text-gray-500 font-light text-xs tracking-wider max-w-md mx-auto leading-relaxed">
              {t('game.instructions')}
            </p>
          </div>
        ) : null}

        {/* Guessing Choices or Product Reveal Overlay */}
        <div className="w-full max-w-xl">
          {!guessed ? (
            <AnswerChoices
              options={currentRound.answerChoices}
              shake={shake}
              getProductName={getProductName}
              onGuess={handleGuess}
            />
          ) : (
            <RoundResult
              product={currentProduct}
              currentLang={currentLang}
              pointsEarned={session.pointsEarned ?? 0}
              guessCorrect={session.guessCorrect}
              selectedOption={session.selectedProductId}
              isFinalRound={isFinalRound(session)}
              t={t}
              getProductName={getProductName}
              onNextRound={handleNextRound}
            />
          )}
        </div>
      </main>
    </div>
  );
};
export default GameScreen;
