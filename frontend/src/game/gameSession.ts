import type { Product } from '../data/products';

export const GAME_SESSION_ROUND_COUNT = 10;

const ANSWER_CHOICE_COUNT = 4;
const INITIAL_POINT_VALUE = 100;
const REVEAL_POINT_COST = 25;

export type RandomSource = () => number;

export interface GameRound {
  readonly product: Product;
  readonly answerChoices: readonly string[];
}

export interface GameSession {
  readonly rounds: readonly GameRound[];
  readonly currentRoundIndex: number;
  readonly revealedIngredientClueCount: number;
  readonly currentPointValue: number;
  readonly pointsEarned: number | null;
  readonly score: number;
  readonly correctAnswerCount: number;
  readonly guessCorrect: boolean | null;
  readonly selectedProductId: string | null;
  readonly status: 'playing' | 'finished';
}

const shuffle = <T>(values: readonly T[], random: RandomSource): T[] => {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const createAnswerChoices = (
  product: Product,
  products: readonly Product[],
  random: RandomSource,
): readonly string[] => {
  const distractors = shuffle(
    products.filter((candidate) => candidate.id !== product.id),
    random,
  )
    .slice(0, ANSWER_CHOICE_COUNT - 1)
    .map((candidate) => candidate.id);

  return shuffle([product.id, ...distractors], random);
};

export const createGameSession = (
  products: readonly Product[],
  random: RandomSource,
): GameSession => {
  const playlist = shuffle(products, random).slice(
    0,
    GAME_SESSION_ROUND_COUNT,
  );
  const rounds = playlist.map((product) => ({
    product,
    answerChoices: createAnswerChoices(product, products, random),
  }));

  return {
    rounds,
    currentRoundIndex: 0,
    revealedIngredientClueCount: 1,
    currentPointValue: INITIAL_POINT_VALUE,
    pointsEarned: null,
    score: 0,
    correctAnswerCount: 0,
    guessCorrect: null,
    selectedProductId: null,
    status: 'playing',
  };
};

export const revealNextIngredientClue = (
  session: GameSession,
): GameSession => {
  const currentRound = session.rounds[session.currentRoundIndex];
  if (
    session.status === 'finished' ||
    session.guessCorrect !== null ||
    !currentRound ||
    session.revealedIngredientClueCount >= currentRound.product.ingredients.length
  ) {
    return session;
  }

  return {
    ...session,
    revealedIngredientClueCount: session.revealedIngredientClueCount + 1,
    currentPointValue: session.currentPointValue - REVEAL_POINT_COST,
  };
};

export const submitGuess = (
  session: GameSession,
  productId: string,
): GameSession => {
  const currentRound = session.rounds[session.currentRoundIndex];
  if (
    session.status === 'finished' ||
    session.guessCorrect !== null ||
    !currentRound
  ) {
    return session;
  }

  const guessCorrect = productId === currentRound.product.id;
  const pointsEarned = guessCorrect ? session.currentPointValue : 0;

  return {
    ...session,
    pointsEarned,
    score: session.score + pointsEarned,
    correctAnswerCount:
      session.correctAnswerCount + (guessCorrect ? 1 : 0),
    guessCorrect,
    selectedProductId: productId,
  };
};

export const isFinalRound = (session: GameSession): boolean =>
  session.currentRoundIndex === session.rounds.length - 1;

export const advanceRound = (session: GameSession): GameSession => {
  if (session.status === 'finished' || session.guessCorrect === null) {
    return session;
  }

  if (isFinalRound(session)) {
    return { ...session, status: 'finished' };
  }

  return {
    ...session,
    currentRoundIndex: session.currentRoundIndex + 1,
    revealedIngredientClueCount: 1,
    currentPointValue: INITIAL_POINT_VALUE,
    pointsEarned: null,
    guessCorrect: null,
    selectedProductId: null,
  };
};
