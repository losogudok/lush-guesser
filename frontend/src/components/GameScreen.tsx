import React, { useState, useEffect } from 'react';
import { products, getIngredientImage } from '../data/products';
import type { Product } from '../data/products';
import { Star, HelpCircle, X, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

interface GameScreenProps {
  onGameFinished: (finalScore: number, correctCount: number) => void;
  onQuit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onGameFinished,
  onQuit,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language === 'ru' ? 'ru' : 'en') as 'ru' | 'en';

  // Game Setup States
  const [playlist, setPlaylist] = useState<Product[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Current Round States
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [revealedCount, setRevealedCount] = useState(1); // Starts at 1, max 4
  const [options, setOptions] = useState<string[]>([]); // Holds product IDs
  const [guessed, setGuessed] = useState<boolean>(false);
  const [guessCorrect, setGuessCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Holds product ID
  const [shake, setShake] = useState<boolean>(false);

  // Initialize Playlist of 5 random non-repeating products
  useEffect(() => {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(5, products.length));
    setPlaylist(selected);
    setCurrentRoundIndex(0);
    setTotalScore(0);
    setCorrectCount(0);
  }, []);

  // Load Round Product
  useEffect(() => {
    if (playlist.length > 0 && currentRoundIndex < playlist.length) {
      const product = playlist[currentRoundIndex];
      setCurrentProduct(product);
      setRevealedCount(1);
      setGuessed(false);
      setGuessCorrect(null);
      setSelectedOption(null);
      setShake(false);

      // Generate 4 multiple choice options (1 correct, 3 random distractors)
      const distractors = products
        .filter((p) => p.id !== product.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((p) => p.id);
      
      const combined = [product.id, ...distractors].sort(() => 0.5 - Math.random());
      setOptions(combined);
    }
  }, [playlist, currentRoundIndex]);

  if (!currentProduct) return null;

  // Calculate current worth based on revealed count
  const currentWorth = 100 - (revealedCount - 1) * 25;
  const activeWorth = guessed && !guessCorrect ? 0 : currentWorth;

  const handleRevealNext = () => {
    if (revealedCount < 4 && !guessed) {
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
      <div className="flex justify-center py-4 bg-white">
        <div className="flex items-center space-x-2 bg-lush-yellow border-2 border-lush-black px-6 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-md font-semibold text-xs tracking-wider uppercase text-lush-black">
          <Star size={14} className="fill-lush-black text-lush-black" />
          <span>
            {t('game.worth', { count: activeWorth })}
          </span>
        </div>
      </div>

      {/* Gameplay Core */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col items-center">
        {/* Ingredient Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-12">
          {Array.from({ length: 4 }).map((_, index) => {
            const isRevealed = index < revealedCount;
            const isNextToReveal = index === revealedCount;
            const ingredientName = currentProduct.ingredients[index];

            return (
              <div key={index} className="aspect-square relative w-full perspective-1000">
                {isRevealed ? (
                  /* Revealed Card */
                  <div className="w-full h-full border-2 border-lush-black rounded-xl p-3 bg-lush-gray-bg flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                    <div className="w-full h-[65%] rounded-lg overflow-hidden border border-lush-gray-border bg-white flex items-center justify-center">
                      <img
                        src={getIngredientImage(ingredientName)}
                        alt={ingredientName}
                        className="w-full h-full object-cover grayscale contrast-[1.1]"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-tight">
                        {t('game.ingredient', { index: index + 1 })}
                      </span>
                      <span className="font-cabinet text-xs md:text-sm text-lush-black uppercase leading-tight mt-0.5 truncate">
                        {t(ingredientName)}
                      </span>
                    </div>
                  </div>
                ) : isNextToReveal && !guessed ? (
                  /* Reveal Next Active Button Card */
                  <button
                    onClick={handleRevealNext}
                    className="w-full h-full border-2 border-dashed border-lush-black rounded-xl bg-white hover:bg-neutral-50 flex flex-col items-center justify-center p-4 transition-all duration-200 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <div className="bg-neutral-100 p-2.5 rounded-full mb-3 text-gray-400 border border-lush-gray-border">
                      <HelpCircle size={20} strokeWidth={1.5} />
                    </div>
                    <div className="bg-lush-cyan text-lush-black border border-lush-black text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-md hover:scale-105 active:scale-95 transition-transform">
                      {t('game.reveal_next')}
                    </div>
                    <span className="text-[8px] text-gray-400 uppercase tracking-widest font-semibold mt-1">
                      {t('game.reveal_cost')}
                    </span>
                  </button>
                ) : (
                  /* Locked Card Placeholders */
                  <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl bg-white flex flex-col items-center justify-center p-4 text-gray-300">
                    <HelpCircle size={24} strokeWidth={1.2} />
                    <span className="text-[8px] uppercase tracking-widest font-semibold mt-2">{t('game.locked')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
            /* Choice Selection Buttons */
            <div className="grid grid-cols-2 gap-4">
              {options.map((optionId) => (
                <button
                  key={optionId}
                  onClick={() => handleGuess(optionId)}
                  className={`bg-white border-2 border-lush-black px-6 py-4 rounded-xl font-cabinet text-sm md:text-base text-lush-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-center leading-snug transition-all ${
                    shake ? 'animate-shake' : ''
                  }`}
                >
                  {getProductName(optionId)}
                </button>
              ))}
            </div>
          ) : (
            /* Result and Scent details block */
            <div className="border-2 border-lush-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left bg-white transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-md border-2 border-lush-black ${
                  guessCorrect ? 'bg-lush-green text-lush-black' : 'bg-red-500 text-white'
                }`}>
                  {guessCorrect ? t('game.correct') : t('game.incorrect')}
                </span>
                <span className="text-xs text-gray-400 font-light">
                  {guessCorrect 
                    ? t('game.gained_points', { points: currentWorth }) 
                    : t('game.gained_zero')}
                </span>
              </div>

              <h3 className="text-2xl font-cabinet text-lush-black uppercase tracking-tight mb-2">
                {currentProduct.name[currentLang]}
              </h3>
              <p className="text-gray-600 font-georgia italic text-sm md:text-base leading-relaxed mb-6">
                "{currentProduct.description[currentLang]}"
              </p>

              {/* Distractor reveal helper */}
              {!guessCorrect && selectedOption && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs mb-6 font-light">
                  {t('game.result_incorrect_note', { 
                    guess: getProductName(selectedOption), 
                    correct: currentProduct.name[currentLang] 
                  })}
                </div>
              )}

              <button
                onClick={handleNextRound}
                className="flex items-center justify-center space-x-2 bg-lush-black text-white hover:bg-neutral-900 border-2 border-lush-black px-6 py-3 font-semibold text-xs tracking-widest uppercase transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full cursor-pointer"
              >
                <span>{currentRoundIndex + 1 === playlist.length ? t('game.show_results') : t('game.next_scent')}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default GameScreen;
