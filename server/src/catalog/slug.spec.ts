import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates an English product name', () => {
    expect(slugify('Honey I Washed The Kids')).toBe('honey-i-washed-the-kids');
  });

  it('strips characters unsafe for URLs', () => {
    expect(slugify('Death & Decay!')).toBe('death-decay');
  });

  it('collapses whitespace and punctuation runs into one hyphen', () => {
    expect(slugify('Avocado   Co-Wash --')).toBe('avocado-co-wash');
  });

  it('keeps digits and existing hyphens', () => {
    expect(slugify('Sunrise 3000 Edition')).toBe('sunrise-3000-edition');
  });

  it('returns an empty string when nothing slug-friendly remains', () => {
    expect(slugify('???')).toBe('');
    expect(slugify('')).toBe('');
  });
});
