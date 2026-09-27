import { isNonEmptyLocalizedText } from './localized-text';

export const MIN_INGREDIENT_CLUE_COUNT = 2;
export const MAX_INGREDIENT_CLUE_COUNT = 4;
export const DISPLAY_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export interface ProductCandidate {
  name?: unknown;
  description?: unknown;
  color?: unknown;
  clues?: unknown;
  inGame?: unknown;
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const validateProductCandidate = (
  candidate: ProductCandidate,
  knownIngredientSlugs: ReadonlySet<string>,
): string[] => {
  const errors: string[] = [];

  if (!isNonEmptyLocalizedText(candidate.name)) {
    errors.push('Product is missing localized (en and ru) name fields.');
  }

  if (!isNonEmptyLocalizedText(candidate.description)) {
    errors.push('Product is missing localized (en and ru) description fields.');
  }

  if (
    typeof candidate.color !== 'string' ||
    !DISPLAY_COLOR_PATTERN.test(candidate.color)
  ) {
    errors.push(
      'Product has an invalid display color: expected a hex color like #A779B8.',
    );
  }

  if (
    !isStringArray(candidate.clues) ||
    candidate.clues.length < MIN_INGREDIENT_CLUE_COUNT ||
    candidate.clues.length > MAX_INGREDIENT_CLUE_COUNT
  ) {
    errors.push(
      `Product must carry ${MIN_INGREDIENT_CLUE_COUNT} to ${MAX_INGREDIENT_CLUE_COUNT} Ingredient Clues.`,
    );
  } else {
    const seen = new Set<string>();
    for (const slug of candidate.clues) {
      if (seen.has(slug)) {
        errors.push(
          `Duplicate Ingredient Clue: the same Ingredient (${slug}) appears twice.`,
        );
      }
      seen.add(slug);

      if (!knownIngredientSlugs.has(slug)) {
        errors.push(
          `Ingredient Clue references a missing Ingredient: ${slug}.`,
        );
      }
    }
  }

  if (candidate.inGame !== undefined && typeof candidate.inGame !== 'boolean') {
    errors.push('Product in-game flag must be a boolean.');
  }

  return errors;
};
