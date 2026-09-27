import {
  DISPLAY_COLOR_PATTERN,
  MAX_INGREDIENT_CLUE_COUNT,
  MIN_INGREDIENT_CLUE_COUNT,
  validateProductCandidate,
} from './catalog-validation';

const validCandidate = {
  name: { en: 'Confetti', ru: 'Confetti' },
  description: {
    en: 'A floral burst of violet, rose, and sandalwood.',
    ru: 'Сводящий с ума цветочный аромат.',
  },
  color: '#A779B8',
  clues: ['rose', 'sandalwood', 'violet'],
};

const knownIngredientSlugs = new Set(['rose', 'sandalwood', 'violet']);

describe('validateProductCandidate', () => {
  it('accepts a valid Product', () => {
    expect(
      validateProductCandidate(validCandidate, knownIngredientSlugs),
    ).toEqual([]);
  });

  it('accepts the minimum number of Ingredient Clues', () => {
    expect(
      validateProductCandidate(
        { ...validCandidate, clues: ['rose', 'sandalwood'] },
        knownIngredientSlugs,
      ),
    ).toEqual([]);
  });

  it('rejects a Product with one Ingredient Clue', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, clues: ['rose'] },
      knownIngredientSlugs,
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(
      new RegExp(`${MIN_INGREDIENT_CLUE_COUNT}|${MAX_INGREDIENT_CLUE_COUNT}`),
    );
  });

  it('rejects a Product with five Ingredient Clues', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, clues: ['rose', 'rose', 'rose', 'rose', 'rose'] },
      knownIngredientSlugs,
    );

    expect(errors).toHaveLength(1);
  });

  it('rejects a Product missing the en name field', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, name: { en: '', ru: 'Confetti' } },
      knownIngredientSlugs,
    );

    expect(errors.some((error) => error.includes('name'))).toBe(true);
  });

  it('rejects a Product missing the ru name field', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, name: { ru: 'Confetti' } },
      knownIngredientSlugs,
    );

    expect(errors.some((error) => error.includes('name'))).toBe(true);
  });

  it('rejects a Product missing the en description field', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, description: { en: '', ru: 'Описание.' } },
      knownIngredientSlugs,
    );

    expect(errors.some((error) => error.includes('description'))).toBe(true);
  });

  it('rejects a Product with an invalid display color', () => {
    for (const color of ['red', '#G779B8', 'A779B8', '#A779B', '#A779B8FF']) {
      const errors = validateProductCandidate(
        { ...validCandidate, color },
        knownIngredientSlugs,
      );

      expect(errors.some((error) => error.includes('color'))).toBe(true);
    }
  });

  it('accepts a lowercase hex display color', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, color: '#a779b8' },
      knownIngredientSlugs,
    );

    expect(errors).toEqual([]);
  });

  it('rejects an Ingredient Clue referencing a missing Ingredient', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, clues: ['rose', 'unicorn-tears'] },
      knownIngredientSlugs,
    );

    expect(errors.some((error) => error.includes('unicorn-tears'))).toBe(true);
  });

  it('rejects the same Ingredient appearing twice as a clue', () => {
    const errors = validateProductCandidate(
      { ...validCandidate, clues: ['rose', 'rose'] },
      knownIngredientSlugs,
    );

    expect(errors.some((error) => /duplicate/i.test(error))).toBe(true);
  });

  it('reports several problems at once', () => {
    const errors = validateProductCandidate(
      {
        name: { en: '', ru: '' },
        description: { en: '', ru: '' },
        color: 'red',
        clues: ['rose'],
      },
      knownIngredientSlugs,
    );

    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('DISPLAY_COLOR_PATTERN', () => {
  it.each(['#000000', '#FFFFFF', '#a779b8', '#A779B8'])(
    'accepts %s',
    (color) => {
      expect(DISPLAY_COLOR_PATTERN.test(color)).toBe(true);
    },
  );

  it.each(['#fff', 'ffffff', '#FFFFFF00', 'red', '#GGGGGG'])(
    'rejects %s',
    (color) => {
      expect(DISPLAY_COLOR_PATTERN.test(color)).toBe(false);
    },
  );
});
