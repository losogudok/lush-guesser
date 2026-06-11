export interface Product {
  id: string;
  name: {
    en: string;
    ru: string;
  };
  ingredients: string[];
  description: {
    en: string;
    ru: string;
  };
  color: string; // Dynamic overlay success color
}

export const products: Product[] = [
  {
    id: 'karma',
    name: {
      en: 'Karma',
      ru: 'Карма',
    },
    ingredients: ['Patchouli', 'Sweet Orange', 'Lemongrass', 'Pine'],
    description: {
      en: 'A combination of patchouli, sweet orange, and pine, this signature retro scent is a spicy, herbaceous, and sweet citrus explosion that leaves you feeling grounded and inspired.',
      ru: 'Сочетание пачули, сладкого апельсина и сосны — этот культовый ретро-аромат представляет собой пряный, травяной и сладкий цитрусовый взрыв, который дарит ощущение гармонии.',
    },
    color: '#FF6F00',
  },
  {
    id: 'rose-jam',
    name: {
      en: 'Rose Jam',
      ru: 'Розовый джем',
    },
    ingredients: ['Rose', 'Geranium', 'Lemon', 'Sicilian Mandarin'],
    description: {
      en: 'A sweet, jammy, and romantic blend of rose oil, geranium, and fresh lemon. Like walking through a sun-drenched Turkish rose garden in full bloom.',
      ru: 'Сладкая, джемовая и романтичная смесь масла розы, герани и свежего лимона. Словно прогулка по залитому солнцем цветущему саду турецких роз.',
    },
    color: '#E91E63',
  },
  {
    id: 'twilight',
    name: {
      en: 'Twilight',
      ru: 'Сумерки',
    },
    ingredients: ['Lavender', 'Tonka Bean', 'Ylang Ylang', 'Benzoin'],
    description: {
      en: 'A soothing, dreamlike lullaby of French lavender, sweet tonka bean, and sensual ylang ylang. Perfect for wrapping yourself in a warm, comforting blanket of calm before bed.',
      ru: 'Успокаивающая колыбельная из французской лаванды, сладких бобов тонка и чувственного иланг-иланга. Идеально, чтобы укутаться в теплое одеяло покоя перед сном.',
    },
    color: '#3F51B5',
  },
  {
    id: 'dirty',
    name: {
      en: 'Dirty',
      ru: 'Дёрти',
    },
    ingredients: ['Mint', 'Tarragon', 'Sandalwood', 'Thyme'],
    description: {
      en: 'A clean, bracing rush of fresh spearmint, tarragon, thyme, and rich sandalwood. It\'s an invigorating breath of fresh air designed to keep you feeling crisp and revitalized.',
      ru: 'Чистый, бодрящий порыв свежей мяты, эстрагона, тимьяна и благородного сандала. Освежающий глоток воздуха, созданный для ощущения чистоты и бодрости.',
    },
    color: '#00ACC1',
  },
  {
    id: 'lord-of-misrule',
    name: {
      en: 'Lord of Misrule',
      ru: 'Повелитель Хаоса',
    },
    ingredients: ['Black Pepper', 'Patchouli', 'Vanilla', 'Frankincense'],
    description: {
      en: 'A mischievous, festive blend of spicy black pepper, deep patchouli, and sweet, warm vanilla. Mischief managed with a rich, herbal, and sweet aroma.',
      ru: 'Озорная праздничная смесь пряного черного переца, глубоких пачули и сладкой, теплой ванили. Шалость удалась с этим насыщенным травянисто-сладким ароматом.',
    },
    color: '#43A047',
  },
  {
    id: 'the-comforter',
    name: {
      en: 'The Comforter',
      ru: 'Комфортер',
    },
    ingredients: ['Blackcurrant', 'Bergamot', 'Cypress', 'Almond'],
    description: {
      en: 'A reassuring hug of sweet blackcurrant, uplifting bergamot, and cozy cypress wood. Warm, fruity, and nostalgic, it feels just like your favorite childhood blanket.',
      ru: 'Утешающие объятия сладкой черной смородины, бодрящего бергамота и уютного кипариса. Теплый, фруктовый и ностальгический аромат, напоминающий любимый плед из детства.',
    },
    color: '#D81B60',
  },
];

// Map ingredient names to their generated black-and-white illustrations
export const getIngredientImage = (ingredient: string): string => {
  const name = ingredient.toLowerCase().trim();
  
  if (name === 'patchouli') return '/images/ingredients/patchouli.png';
  if (name === 'sweet orange' || name === 'lemon' || name === 'sicilian mandarin' || name === 'blackcurrant' || name === 'bergamot') {
    return '/images/ingredients/sweet_orange.png';
  }
  if (name === 'lemongrass' || name === 'thyme') return '/images/ingredients/lemongrass.png';
  if (name === 'pine' || name === 'cypress') return '/images/ingredients/pine.png';
  if (name === 'rose' || name === 'geranium' || name === 'ylang ylang') return '/images/ingredients/rose.png';
  if (name === 'lavender') return '/images/ingredients/lavender.png';
  if (name === 'mint' || name === 'tarragon') return '/images/ingredients/mint.png';
  if (name === 'black pepper' || name === 'benzoin' || name === 'frankincense') return '/images/ingredients/black_pepper.png';
  if (name === 'sandalwood') return '/images/ingredients/sandalwood.png';
  if (name === 'almond' || name === 'tonka bean' || name === 'vanilla') return '/images/ingredients/almond.png';
  
  // Fallback
  return '/images/ingredients/patchouli.png';
};
