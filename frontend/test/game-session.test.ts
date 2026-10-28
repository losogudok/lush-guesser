import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product } from '../src/data/products';
import {
  advanceRound,
  createGameSession,
  isFinalRound,
  revealNextIngredientClue,
  submitGuess,
} from '../src/game/gameSession';

const createProducts = (count: number): Product[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `product-${index + 1}`,
    name: { en: `Product ${index + 1}`, ru: `Продукт ${index + 1}` },
    ingredients: ['First', 'Second', 'Third', 'Fourth'],
    description: { en: 'Description', ru: 'Описание' },
    color: '#000000',
  }));

const sequenceRandom = (...values: number[]) => {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
};

test('creates a deterministic ten-Round playlist with unique Products and answer choices', () => {
  const products = createProducts(12);
  const first = createGameSession(products, sequenceRandom(0.1, 0.4, 0.8));
  const second = createGameSession(products, sequenceRandom(0.1, 0.4, 0.8));

  assert.deepEqual(first, second);
  assert.equal(first.rounds.length, 10);
  assert.equal(new Set(first.rounds.map((round) => round.product.id)).size, 10);

  for (const round of first.rounds) {
    assert.equal(round.answerChoices.length, 4);
    assert.equal(new Set(round.answerChoices).size, 4);
    assert.ok(round.answerChoices.includes(round.product.id));
  }
});

test('reveals Ingredient Clues up to the Product limit with decreasing point value', () => {
  const initial = createGameSession(createProducts(12), sequenceRandom(0.2));
  const secondClue = revealNextIngredientClue(initial);
  const thirdClue = revealNextIngredientClue(secondClue);
  const fourthClue = revealNextIngredientClue(thirdClue);

  assert.equal(initial.revealedIngredientClueCount, 1);
  assert.equal(initial.currentPointValue, 100);
  assert.equal(secondClue.revealedIngredientClueCount, 2);
  assert.equal(secondClue.currentPointValue, 75);
  assert.equal(thirdClue.revealedIngredientClueCount, 3);
  assert.equal(thirdClue.currentPointValue, 50);
  assert.equal(fourthClue.revealedIngredientClueCount, 4);
  assert.equal(fourthClue.currentPointValue, 25);
  assert.strictEqual(revealNextIngredientClue(fourthClue), fourthClue);
});

test('scores one correct or incorrect guess per Round', () => {
  const initial = createGameSession(createProducts(12), sequenceRandom(0.2));
  const currentProduct = initial.rounds[0].product;
  const incorrectId = initial.rounds[0].answerChoices.find(
    (productId) => productId !== currentProduct.id,
  );
  assert.ok(incorrectId);

  const correct = submitGuess(
    revealNextIngredientClue(initial),
    currentProduct.id,
  );
  assert.equal(correct.guessCorrect, true);
  assert.equal(correct.selectedProductId, currentProduct.id);
  assert.equal(correct.pointsEarned, 75);
  assert.equal(correct.score, 75);
  assert.equal(correct.correctAnswerCount, 1);
  assert.strictEqual(submitGuess(correct, incorrectId), correct);
  assert.strictEqual(revealNextIngredientClue(correct), correct);

  const incorrect = submitGuess(initial, incorrectId);
  assert.equal(incorrect.guessCorrect, false);
  assert.equal(incorrect.selectedProductId, incorrectId);
  assert.equal(incorrect.pointsEarned, 0);
  assert.equal(incorrect.score, 0);
  assert.equal(incorrect.correctAnswerCount, 0);
});

test('resets each Round and finishes with the final score and correct-answer count', () => {
  let session = createGameSession(createProducts(12), sequenceRandom(0.3));
  let expectedScore = 0;
  let expectedCorrectAnswers = 0;

  assert.strictEqual(advanceRound(session), session);

  for (let roundIndex = 0; roundIndex < 10; roundIndex += 1) {
    if (roundIndex % 3 === 0) {
      session = revealNextIngredientClue(session);
    }

    const round = session.rounds[roundIndex];
    const guessCorrect = roundIndex % 2 === 0;
    const productId = guessCorrect
      ? round.product.id
      : round.answerChoices.find((choice) => choice !== round.product.id);
    assert.ok(productId);

    session = submitGuess(session, productId);
    expectedScore += session.pointsEarned ?? 0;
    expectedCorrectAnswers += guessCorrect ? 1 : 0;
    assert.equal(isFinalRound(session), roundIndex === 9);

    session = advanceRound(session);
    if (roundIndex < 9) {
      assert.equal(session.status, 'playing');
      assert.equal(session.currentRoundIndex, roundIndex + 1);
      assert.equal(session.revealedIngredientClueCount, 1);
      assert.equal(session.currentPointValue, 100);
      assert.equal(session.pointsEarned, null);
      assert.equal(session.guessCorrect, null);
      assert.equal(session.selectedProductId, null);
    }
  }

  assert.equal(session.status, 'finished');
  assert.equal(session.score, expectedScore);
  assert.equal(session.score, 450);
  assert.equal(session.correctAnswerCount, expectedCorrectAnswers);
  assert.equal(session.correctAnswerCount, 5);
  assert.strictEqual(advanceRound(session), session);
});
