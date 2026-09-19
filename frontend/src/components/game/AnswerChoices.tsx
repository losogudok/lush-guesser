import React from 'react';

interface AnswerChoicesProps {
  options: string[];
  shake: boolean;
  getProductName: (id: string) => string;
  onGuess: (optionId: string) => void;
}

export const AnswerChoices: React.FC<AnswerChoicesProps> = ({
  options,
  shake,
  getProductName,
  onGuess,
}) => (
  <div className="grid grid-cols-2 gap-4">
    {options.map((optionId) => (
      <button
        key={optionId}
        data-testid="answer-option"
        onClick={() => onGuess(optionId)}
        className={`bg-white border-2 border-lush-black px-6 py-4 rounded-xl font-cabinet text-sm md:text-base text-lush-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 active:translate-x-0.5 active:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-center leading-snug transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {getProductName(optionId)}
      </button>
    ))}
  </div>
);
