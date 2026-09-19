import React from 'react';
import { ChevronRight } from 'lucide-react';

import type { Product } from '../../data/products';

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface RoundResultProps {
  product: Product;
  currentLang: 'ru' | 'en';
  currentWorth: number;
  guessCorrect: boolean | null;
  selectedOption: string | null;
  isFinalRound: boolean;
  t: Translate;
  getProductName: (id: string) => string;
  onNextRound: () => void;
}

export const RoundResult: React.FC<RoundResultProps> = ({
  product,
  currentLang,
  currentWorth,
  guessCorrect,
  selectedOption,
  isFinalRound,
  t,
  getProductName,
  onNextRound,
}) => (
  <div className="border-2 border-lush-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left bg-white transition-all">
    <div className="flex items-center justify-between mb-4">
      <span
        className={`text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-md border-2 border-lush-black ${
          guessCorrect ? 'bg-lush-green text-lush-black' : 'bg-red-500 text-white'
        }`}
      >
        {guessCorrect ? t('game.correct') : t('game.incorrect')}
      </span>
      <span className="text-xs text-gray-400 font-light">
        {guessCorrect
          ? t('game.gained_points', { points: currentWorth })
          : t('game.gained_zero')}
      </span>
    </div>

    <h3 className="text-2xl font-cabinet text-lush-black uppercase tracking-tight mb-2">
      {product.name[currentLang]}
    </h3>
    <p className="text-gray-600 font-georgia italic text-sm md:text-base leading-relaxed mb-6">
      "{product.description[currentLang]}"
    </p>

    {!guessCorrect && selectedOption && (
      <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs mb-6 font-light">
        {t('game.result_incorrect_note', {
          guess: getProductName(selectedOption),
          correct: product.name[currentLang],
        })}
      </div>
    )}

    <button
      onClick={onNextRound}
      data-testid="next-round"
      className="flex items-center justify-center space-x-2 bg-lush-black text-white hover:bg-neutral-900 border-2 border-lush-black px-6 py-3 font-semibold text-xs tracking-widest uppercase transition-all transform hover:scale-[1.02] active:scale-[0.98] w-full cursor-pointer"
    >
      <span>{isFinalRound ? t('game.show_results') : t('game.next_scent')}</span>
      <ChevronRight size={14} />
    </button>
  </div>
);
