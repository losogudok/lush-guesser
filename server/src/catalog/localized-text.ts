/** Text localized into the two game languages. */
export interface LocalizedText {
  en: string;
  ru: string;
}

export const isNonEmptyLocalizedText = (
  value: unknown,
): value is LocalizedText =>
  typeof value === 'object' &&
  value !== null &&
  isNonEmptyString((value as LocalizedText).en) &&
  isNonEmptyString((value as LocalizedText).ru);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
