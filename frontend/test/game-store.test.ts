import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product } from '../src/data/products';
import { createGameStore } from '../src/game/gameStore';

const products: Product[] = Array.from({ length: 12 }, (_, index) => ({
  id: `product-${index + 1}`,
  name: { en: `Product ${index + 1}`, ru: `Продукт ${index + 1}` },
  ingredients: ['First', 'Second', 'Third', 'Fourth'],
  description: { en: 'Description', ru: 'Описание' },
  color: '#000000',
}));

test('captured actions use the latest Game Session and expose the completed result', () => {
  const store = createGameStore(() => 0.3);
  const { start, revealNextClue, guess, nextRound } = store.getState();
  start(products);

  // Actions captured before starting must keep reading current state.
  revealNextClue();
  for (let roundIndex = 0; roundIndex < 10; roundIndex += 1) {
    const session = store.getState().session!;
    const productId = session.rounds[session.currentRoundIndex].product.id;
    assert.equal(guess(productId), true);
    assert.equal(guess(productId), null);
    nextRound();
    // A second click cannot skip the next unanswered Round.
    nextRound();
  }

  const completed = store.getState().session!;
  assert.equal(completed.status, 'finished');
  assert.equal(completed.currentRoundIndex, 9);
  assert.equal(completed.score, 975);
  assert.equal(completed.correctAnswerCount, 10);
  assert.equal(guess(completed.rounds[9].product.id), null);
  revealNextClue();
  nextRound();
  assert.strictEqual(store.getState().session, completed);
});

test('quit discards a Game Session and replay starts with fresh progress', () => {
  const store = createGameStore(() => 0.3);
  const { start, revealNextClue, guess, nextRound, reset } = store.getState();
  start(products);
  revealNextClue();
  const firstProductId = store.getState().session!.rounds[0].product.id;
  assert.equal(guess(firstProductId), true);
  nextRound();
  const abandoned = store.getState().session;

  reset();
  assert.equal(store.getState().session, null);
  assert.equal(guess(firstProductId), null);
  revealNextClue();
  nextRound();
  assert.equal(store.getState().session, null);

  start(products);
  const restarted = store.getState().session!;
  assert.notStrictEqual(restarted, abandoned);
  assert.equal(restarted.currentRoundIndex, 0);
  assert.equal(restarted.revealedIngredientClueCount, 1);
  assert.equal(restarted.currentPointValue, 100);
  assert.equal(restarted.score, 0);
  assert.equal(restarted.correctAnswerCount, 0);
  assert.equal(restarted.selectedProductId, null);

  for (let roundIndex = 0; roundIndex < 10; roundIndex += 1) {
    const session = store.getState().session!;
    assert.equal(guess(session.rounds[session.currentRoundIndex].product.id), true);
    nextRound();
  }
  assert.equal(store.getState().session!.status, 'finished');
  start(products);
  assert.equal(store.getState().session!.status, 'playing');
  assert.equal(store.getState().session!.score, 0);
  assert.equal(store.getState().session!.currentRoundIndex, 0);
});

test('stores are isolated and do not generate a Game Session before start', () => {
  let randomCalls = 0;
  const first = createGameStore(() => {
    randomCalls += 1;
    return 0.3;
  });
  const second = createGameStore(() => 0.3);
  assert.equal(randomCalls, 0);
  assert.equal(first.getState().session, null);
  assert.equal(second.getState().session, null);

  first.getState().start(products);
  assert.ok(randomCalls > 0);
  assert.equal(second.getState().session, null);
  second.getState().start(products);
  first.getState().revealNextClue();
  assert.equal(second.getState().session!.revealedIngredientClueCount, 1);
  first.getState().reset();
  assert.equal(second.getState().session!.status, 'playing');
});
