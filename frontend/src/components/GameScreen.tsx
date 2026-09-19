import React, { useState } from 'react';
import { products } from '../data/products';
import type { Product } from '../data/products';
import { Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

import { AnswerChoices } from './game/AnswerChoices';
import { IngredientClueCarousel } from './game/IngredientClueCarousel';
import { RoundResult } from './game/RoundResult';
import { GAME_ROUND_COUNT } from '../constants';

const MAX_INGREDIENT_CLUE_COUNT = 4;

interface GameScreenProps {
  onGameFinished: (finalScore: number, correctCount: number) => void;
  onQuit: () => void;
}

const createOptions = (product: Product) => {
  const distractors = products
    .filter((p) => p.id !== product.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((p) => p.id);

  return [product.id, ...distractors].sort(() => 0.5 - Math.random());
};

export const GameScreen: React.FC<GameScreenProps> = ({
  onGameFinished,
  onQuit,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'ru' ? 'ru' : 'en') as 'ru' | 'en';

  // Game Setup States
  const [playlist] = useState<Product[]>(() => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(GAME_ROUND_COUNT, products.length));
  });
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Current Round States
  const [revealedCount, setRevealedCount] = useState(1); // Starts at 1, max 4
  const [options, setOptions] = useState<string[]>(() =>
    playlist[0] ? createOptions(playlist[0]) : [],
  );
  const [guessed, setGuessed] = useState<boolean>(false);
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Holds product ID
  const [shake, setShake] = useState<boolean>(false);

  const currentProduct = playlist[currentRoundIndex] ?? null;

  if (!currentProduct) return null;

  // Calculate current worth based on revealed count
  const currentWorth = 100 - (revealedCount - 1) * 25;
  const activeWorth = guessed && !guessCorrect ? 0 : currentWorth;

  const handleRevealNext = () => {
    const maxRevealCount = Math.min(
      currentProduct.ingredients.length,
      MAX_INGREDIENT_CLUE_COUNT,
    );

    if (revealedCount < maxRevealCount && !guessed) {
      setRevealedCount((prev) => prev + 1);
    }
  };

  const handleGuess = (optionId: string) => {
    if (guessed) return; // Only 1 guess allowed per round
    
    setSelectedOption(optionId);
    setGuessed(true);

    if (optionId === currentProduct.id) {
      setGuessCorrect(true);
      setCorrectCount((prev) => prev + 1);
      setTotalScore((prev) => prev + currentWorth);
      
      // Fire confetti for a correct guess
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00E676', '#EEFF00', '#4CE3E6', '#000000'],
      });
    } else {
      setGuessCorrect(false);
      setShake(true);
      // Remove shake class after animation completes
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex + 1 < playlist.length) {
      const nextRoundIndex = currentRoundIndex + 1;
      setOptions(createOptions(playlist[nextRoundIndex]));
      setRevealedCount(1);
      setGuessed(false);
      setGuessCorrect(null);
      setSelectedOption(null);
      setShake(false);
      setCurrentRoundIndex((prev) => prev + 1);
    } else {
      onGameFinished(totalScore, correctCount);
    }
  };

  // Helper to fetch localized product name by ID
  const getProductName = (id: string) => {
    const prod = products.find((p) => p.id === id);
    return prod ? prod.name[currentLang] : id;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Game Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-lush-gray-border">
        <button 
          onClick={onQuit}
          title={t('game.quit')} 
          className="text-lush-black hover:opacity-70 transition-opacity cursor-pointer flex items-center space-x-1"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
        
        <div className="text-xl font-cabinet tracking-wide text-lush-black">
          {t('game.round', { round: currentRoundIndex + 1 })}
        </div>

        <div className="border-2 border-lush-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white text-lush-black">
          {t('game.score', { score: totalScore })}
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
          revealedCount={revealedCount}
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
              options={options}
              shake={shake}
              getProductName={getProductName}
              onGuess={handleGuess}
            />
          ) : (
            <RoundResult
              product={currentProduct}
              currentLang={currentLang}
              currentWorth={currentWorth}
              guessCorrect={guessCorrect}
              selectedOption={selectedOption}
              isFinalRound={currentRoundIndex + 1 === playlist.length}
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
