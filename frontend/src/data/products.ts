export interface Product {
  readonly id: string;
  readonly name: {
    readonly en: string;
    readonly ru: string;
  };
  readonly ingredients: readonly string[];
  readonly description: {
    readonly en: string;
    readonly ru: string;
  };
  readonly color: string;
}

export interface ProductCatalog {
  readonly products: readonly Product[];
  getIngredientImage(ingredient: string): string;
  validateAssets(assetExists: (imagePath: string) => boolean): void;
}

const MIN_PRODUCT_COUNT = 12;
const MIN_INGREDIENT_CLUE_COUNT = 2;
const MAX_INGREDIENT_CLUE_COUNT = 4;
const DISPLAY_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const productDefinitions: Product[] = [
  {
    id: 'confetti',
    name: {
      en: 'Confetti',
      ru: 'Confetti',
    },
    ingredients: ['Rose', 'Sandalwood', 'Violet'],
    description: {
      en: 'At an Italian wedding, sugared almonds tell a story in three acts: the innocence of violet leaf, the sensuality of rose as the relationship deepens, and the lasting comfort of sandalwood oil.',
      ru: 'Сводящий с ума цветочный аромат. Нежный абсолют фиалки смешивается с чувственной розой, а дымчатое масло сандалового дерева завершает историю, символизируя вечную любовь и комфорт.',
    },
    color: '#A779B8',
  },
  {
    id: 'dear-john',
    name: {
      en: 'Dear John',
      ru: 'Dear John',
    },
    ingredients: ['Cedar', 'Clove'],
    description: {
      en: "Spritz on this reassuring fragrance, adored by everyone who tries it. Reminiscent of cozy nights in a log cabin, cedarwood and pine create a calming, earthy base. A fresh splash of citrus and a strong coffee note blend with tobacco and smoky vetivert to create a raw, earthy fragrance full of memories.",
      ru: 'Вызывая воспоминания о чтении старых книг и воскресном утреннем кофе, Dear John переносит вас обратно в детство. Как будто вы сидите у камина на коленях своего дедушки или гуляете по лесу с папой - этот древесный, пряный и уютный запах оставляет ощущение безопасности и сентиментальности. Масло дымчатого ветивера расслабляет разум и сглаживает печали. Масло кедрового дерева улучшает концентрацию, а масло цветов гвоздичного дерева успокаивает. Нота кофе завершает это ностальгическое путешествие, и уникальный утешающий аромат словно заключает вас в теплое, дымное объятие.',
    },
    color: '#795548',
  },
  {
    id: 'love',
    name: {
      en: 'Love',
      ru: 'Love',
    },
    ingredients: ['Lemongrass', 'Red Apple', 'Rose', 'Cinnamon'],
    description: {
      en: 'A bright opening of lemongrass leads to red apple, rose and warm cinnamon.',
      ru: 'Яркий лемонграсс сменяется красным яблоком, розой и тёплой корицей.',
    },
    color: '#EC407A',
  },
  {
    id: 'karma',
    name: {
      en: 'Karma',
      ru: 'Karma',
    },
    ingredients: ['Sweet Orange', 'Patchouli', 'Pine', 'Lemongrass'],
    description: {
      en: 'A combination of patchouli, sweet orange, and pine, this signature retro scent is a spicy, herbaceous, and sweet citrus explosion that leaves you feeling grounded and inspired.',
      ru: 'Культовый аромат Lush, сочетающий головокружительные слои апельсина, специй и пачули. Отправляйтесь в Лондон 60-х годов, пока облака возбуждающих пачули смешиваются с жизнеутверждающим бразильским апельсином и очищающей сосной. Уникальный, яркий аромат для свободных духом.',
    },
    color: '#FF6F00',
  },
  {
    id: 'rose-jam',
    name: {
      en: 'Rose Jam',
      ru: 'Rose Jam',
    },
    ingredients: ['Rose', 'Lemon', 'Geranium'],
    description: {
      en: 'A sweet, jammy, and romantic blend of rose oil, geranium, and fresh lemon. It is like walking through a sun-drenched Turkish rose garden in full bloom.',
      ru: 'Прогуляйтесь по бесконечным полям пудрово-розовых лепестков с этим изысканным ароматом, в котором роскошная герань сочетается с розовым маслом из местечка Сенир в Турции.',
    },
    color: '#E91E63',
  },
  {
    id: 'twilight',
    name: {
      en: 'Twilight',
      ru: 'Twilight',
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
      ru: 'Dirty',
    },
    ingredients: ['Mint', 'Tarragon', 'Thyme', 'Lavender'],
    description: {
      en: 'A clean, bracing rush of fresh spearmint, tarragon, thyme, and rich sandalwood. It\'s an invigorating breath of fresh air designed to keep you feeling crisp and revitalized.',
      ru: 'Дёрти — это многослойная композиция из перечной мяты, эстрагона и тимьяна, которая настигает вас, как порыв свежего ветра. Перечная мята — освежающая, энергичная нота, проясняющая сознание и охлаждающая кожу. Сандаловое дерево и лаванда добавляют аромату цветочные и древесные ноты.',
    },
    color: '#00ACC1',
  },
  {
    id: 'lord-of-misrule',
    name: {
      en: 'Lord of Misrule',
      ru: 'Lord of Misrule',
    },
    ingredients: ['Black Pepper', 'Patchouli', 'Vanilla'],
    description: {
      en: 'A mischievous, festive blend of spicy black pepper, deep patchouli, and sweet, warm vanilla. Mischief managed with a rich, herbal, and sweet aroma.',
      ru: 'Масло пачули с острова Суматра смешивается с перечными нотами в безумном карнавале Праздника дураков.',
    },
    color: '#43A047',
  },
  {
    id: 'the-comforter',
    name: {
      en: 'The Comforter',
      ru: 'The Comforter',
    },
    ingredients: ['Blackcurrant', 'Bergamot', 'Cypress'],
    description: {
      en: 'Juicy blackcurrant meets bright bergamot and a woody cypress finish.',
      ru: 'Сочная чёрная смородина сочетается с ярким бергамотом и древесным кипарисом.',
    },
    color: '#D81B60',
  },
  // {
  //   id: 'snow-fairy',
  //   name: {
  //     en: 'Snow Fairy',
  //     ru: 'Снежная фея',
  //   },
  //   ingredients: ['Vanilla', 'Pear', 'Lime', 'Musk'],
  //   description: {
  //     en: 'A bright candy-sweet burst of vanilla, pear, and lime with a soft musky finish. Playful, sparkling, and unmistakably festive.',
  //     ru: 'Яркий конфетный аромат ванили, груши и лайма с мягким мускусным шлейфом. Игривый, сияющий и праздничный.',
  //   },
  //   color: '#FF4FB3',
  // },
  {
    id: 'honey-i-washed-the-kids',
    name: {
      en: 'Honey I Washed The Kids',
      ru: 'Honey I Washed The Kids',
    },
    ingredients: ['Toffee', 'Honey', 'Caramel', 'Bergamot'],
    description: {
      en: 'Golden toffee, honey and caramel are lifted by a touch of bergamot.',
      ru: 'Золотистые ириски, мёд и карамель оттеняет лёгкий бергамот.',
    },
    color: '#F9A825',
  },
  {
    id: 'avocado-co-wash',
    name: {
      en: 'Avocado Co-Wash',
      ru: 'Avocado Co-Wash',
    },
    ingredients: ['Bergamot', 'Olibanum'],
    description: {
      en: 'Bright bergamot meets the warm, resinous scent of olibanum.',
      ru: 'Яркий бергамот сочетается с тёплым смолистым ароматом олибанума.',
    },
    color: '#8BC34A',
  },
  // {
  //   id: 'ocean-salt',
  //   name: {
  //     en: 'Ocean Salt',
  //     ru: 'Морская соль',
  //   },
  //   ingredients: ['Sea Salt', 'Lime', 'Grapefruit', 'Coconut'],
  //   description: {
  //     en: 'A breezy splash of sea salt, lime, grapefruit, and smooth coconut. Crisp, coastal, and sunlit.',
  //     ru: 'Свежий всплеск морской соли, лайма, грейпфрута и мягкого кокоса. Чистый, морской и солнечный.',
  //   },
  //   color: '#26C6DA',
  // },
  {
    id: 'grass',
    name: {
      en: 'Grass',
      ru: 'Grass',
    },
    ingredients: ['Grass', 'Neroli', 'Bergamot', 'Sandalwood'],
    description: {
      en: 'Fresh grass leads into neroli and bergamot, with sandalwood in the background.',
      ru: 'Свежая трава раскрывается нероли и бергамотом на мягкой сандаловой основе.',
    },
    color: '#2E7D32',
  },
  {
    id: 'death-and-decay',
    name: {
      en: 'Death and Decay',
      ru: 'Death and Decay',
    },
    ingredients: ['Jasmine', 'Ylang Ylang', 'Rose', 'Tonka Bean'],
    description: {
      en: 'Intoxicating jasmine and ylang ylang mingle with sweet rose to create a bouquet that first overwhelms, then soothes. Let this floral fragrance carry you to a serene space where beauty and its inevitable decay can be contemplated without fear. It is meditation, acceptance, and optimism expressed in magnificent floral form.',
      ru: 'Пьянящий жасмин и иланг-иланг сочетаются со сладкой розой, образуя букет, который сначала подавляет, а затем успокаивает. Позвольте этому цветочному аромату перенести вас в безмятежное пространство, где красоту и ее неизбежный упадок можно созерцать без страха. Это медитация, принятие и оптимизм, переданные в великолепном цветочном облике.',
    },
    color: '#FF6F00',
  },
  {
    id: 'sticky-dates',
    name: {
      en: 'Sticky Dates',
      ru: 'Sticky Dates',
    },
    description: {
      en: 'Rich caramel is wrapped in warm benzoin and smooth sandalwood.',
      ru: 'Насыщенная карамель сочетается с тёплым бензоином и мягким сандалом.',
    },
    color: '#8D5A3B',
    ingredients: ['Caramel', 'Benzoin', 'Sandalwood'],
  },
  {
    id: 'super-milk',
    name: {
      en: 'Super Milk',
      ru: 'Super Milk',
    },
    description: {
      en: 'Citrusy litsea cubeba softens into creamy vanilla and tonka bean.',
      ru: 'Цитрусовая литсея кубеба смягчается сливочной ванилью и бобами тонка.',
    },
    color: '#F2D7A1',
    ingredients: ['Litsea Cubeba', 'Vanilla', 'Tonka Bean'],
  },
  {
    id: 'let-the-good-times-roll',
    name: {
      en: 'Let The Good Times Roll',
      ru: 'Let The Good Times Roll',
    },
    description: {
      en: 'Buttery popcorn meets caramel sweetness and a touch of cinnamon.',
      ru: 'Маслянистый попкорн сочетается с карамельной сладостью и ноткой корицы.',
    },
    color: '#D9A441',
    ingredients: ['Popcorn', 'Caramel', 'Butter', 'Cinnamon'],
  },
  {
    id: 'big',
    name: {
      en: 'Big',
      ru: 'Big',
    },
    description: {
      en: 'Neroli and orange blossom settle into a soft vanilla base.',
      ru: 'Нероли и цветы апельсина раскрываются на мягкой ванильной основе.',
    },
    color: '#F7B267',
    ingredients: ['Neroli', 'Orange Blossom', 'Vanilla'],
  },
  {
    id: 'sakura',
    name: {
      en: 'Sakura',
      ru: 'Sakura',
    },
    description: {
      en: 'Sunny lemon opens into delicate mimosa and jasmine.',
      ru: 'Солнечный лимон раскрывается нежной мимозой и жасмином.',
    },
    color: '#F5B7C5',
    ingredients: ['Lemon', 'Mimosa', 'Jasmine'],
  },
  {
    id: 'sex-bomb',
    name: {
      en: 'Sex Bomb',
      ru: 'Sex Bomb',
    },
    description: {
      en: 'Jasmine and ylang ylang bloom over aromatic clary sage.',
      ru: 'Жасмин и иланг-иланг раскрываются на ароматной основе шалфея мускатного.',
    },
    color: '#D982B5',
    ingredients: ['Jasmine', 'Ylang Ylang', 'Clary Sage'],
  },
  {
    id: 'chelsea-morning',
    name: {
      en: 'Chelsea Morning',
      ru: 'Chelsea Morning',
    },
    description: {
      en: 'Toffee and lemon melt into vanilla and tonka bean.',
      ru: 'Ириски и лимон переходят в ваниль и бобы тонка.',
    },
    color: '#DDA86C',
    ingredients: ['Toffee', 'Lemon', 'Vanilla', 'Tonka Bean'],
  },
  {
    id: 'vanillary',
    name: {
      en: 'Vanillary',
      ru: 'Vanillary',
    },
    description: {
      en: 'Creamy vanilla is joined by jasmine and tonka bean.',
      ru: 'Сливочную ваниль дополняют жасмин и бобы тонка.',
    },
    color: '#E6C69A',
    ingredients: ['Vanilla', 'Jasmine', 'Tonka Bean'],
  },
  {
    id: 'junk',
    name: {
      en: 'Junk',
      ru: 'Junk',
    },
    description: {
      en: 'Tart blackcurrant and lemon cut through rosemary and sage.',
      ru: 'Терпкая чёрная смородина и лимон сочетаются с розмарином и шалфеем.',
    },
    color: '#754C75',
    ingredients: ['Blackcurrant', 'Rosemary', 'Lemon', 'Sage'],
  },
  {
    id: '4-20-pm',
    name: {
      en: '4:20 PM',
      ru: '4:20 PM',
    },
    description: {
      en: 'Green cannabis meets earthy patchouli, oakmoss and sandalwood.',
      ru: 'Зелёная нота конопли сочетается с землистыми пачули, дубовым мхом и сандалом.',
    },
    color: '#687B52',
    ingredients: ['Cannabis', 'Patchouli', 'Oakmoss', 'Sandalwood'],
  },
  {
    id: '29-high-street',
    name: {
      en: '29 High Street',
      ru: '29 High Street',
    },
    description: {
      en: 'Honey and caramel sweetness mingle with a fresh green accord.',
      ru: 'Сладость мёда и карамели сочетается со свежими зелёными нотами.',
    },
    color: '#D6B45B',
    ingredients: ['Honey', 'Green Notes', 'Caramel'],
  },
];

const ingredientImages: Readonly<Record<string, string>> = {
  'red apple': '/images/ingredients/red_apple.png',
  'cinnamon': '/images/ingredients/cinnamon.png',
  'lemon': '/images/ingredients/lemon.png',
  'grass': '/images/ingredients/grass.png',
  'neroli': '/images/ingredients/neroli.png',
  'toffee': '/images/ingredients/toffee.png',
  'honey': '/images/ingredients/honey.png',
  'caramel': '/images/ingredients/caramel.png',
  'popcorn': '/images/ingredients/popcorn.png',
  'butter': '/images/ingredients/butter.png',
  'orange blossom': '/images/ingredients/neroli.png',
  'mimosa': '/images/ingredients/mimosa.png',
  'clary sage': '/images/ingredients/clary_sage.png',
  'rosemary': '/images/ingredients/rosemary.png',
  'sage': '/images/ingredients/clary_sage.png',
  'cannabis': '/images/ingredients/cannabis.png',
  'oakmoss': '/images/ingredients/oakmoss.png',
  'green notes': '/images/ingredients/green_notes.png',
  almond: '/images/ingredients/almond.png',
  benzoin: '/images/ingredients/benzoin.png',
  bergamot: '/images/ingredients/bergamot.png',
  'black pepper': '/images/ingredients/black_pepper.png',
  blackcurrant: '/images/ingredients/blackcurrant.png',
  cedar: '/images/ingredients/cedar.png',
  clove: '/images/ingredients/clove.png',
  cypress: '/images/ingredients/cypress.png',
  geranium: '/images/ingredients/geranium.png',
  jasmine: '/images/ingredients/jasmine.png',
  lavender: '/images/ingredients/lavender.png',
  lemongrass: '/images/ingredients/lemongrass.png',
  'litsea cubeba': '/images/ingredients/litsea_cubeba.png',
  mint: '/images/ingredients/mint.png',
  olibanum: '/images/ingredients/olibanum.png',
  patchouli: '/images/ingredients/patchouli.png',
  pine: '/images/ingredients/pine.png',
  rose: '/images/ingredients/rose.png',
  sandalwood: '/images/ingredients/sandalwood.png',
  'sea salt': '/images/ingredients/sea_salt.png',
  'sweet orange': '/images/ingredients/sweet_orange.png',
  tarragon: '/images/ingredients/tarragon.png',
  thyme: '/images/ingredients/thyme.png',
  'tonka bean': '/images/ingredients/tonka_bean.png',
  vanilla: '/images/ingredients/vanilla.png',
  violet: '/images/ingredients/violet.png',
  'ylang ylang': '/images/ingredients/ylang_ylang.png',
};

const normalizeIngredientName = (ingredient: string) =>
  ingredient.toLowerCase().trim();

const getMappedIngredientImage = (ingredient: string): string | undefined =>
  ingredientImages[normalizeIngredientName(ingredient)];

const collectDefinitionErrors = (): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (productDefinitions.length < MIN_PRODUCT_COUNT) {
    errors.push(
      `Expected at least ${MIN_PRODUCT_COUNT} Products, found ${productDefinitions.length}.`,
    );
  }

  for (const product of productDefinitions) {
    if (ids.has(product.id)) {
      errors.push(`Duplicate Product id: ${product.id}.`);
    }
    ids.add(product.id);

    if (!product.name.en.trim() || !product.name.ru.trim()) {
      errors.push(`${product.id} is missing localized Product names.`);
    }

    if (!product.description.en.trim() || !product.description.ru.trim()) {
      errors.push(`${product.id} is missing localized Product descriptions.`);
    }

    if (
      product.ingredients.length < MIN_INGREDIENT_CLUE_COUNT ||
      product.ingredients.length > MAX_INGREDIENT_CLUE_COUNT
    ) {
      errors.push(
        `${product.id} must have ${MIN_INGREDIENT_CLUE_COUNT} to ${MAX_INGREDIENT_CLUE_COUNT} Ingredient Clues.`,
      );
    }

    for (const ingredient of product.ingredients) {
      if (!getMappedIngredientImage(ingredient)) {
        errors.push(
          `${product.id} has an unknown Ingredient Clue image: ${ingredient}.`,
        );
      }
    }

    if (!DISPLAY_COLOR_PATTERN.test(product.color)) {
      errors.push(`${product.id} has an invalid display color: ${product.color}.`);
    }
  }

  return errors;
};

const throwValidationErrors = (errors: readonly string[]) => {
  if (errors.length > 0) {
    throw new Error(`Product catalog validation failed:\n${errors.join('\n')}`);
  }
};

const createProductCatalog = (): ProductCatalog => {
  throwValidationErrors(collectDefinitionErrors());

  const getIngredientImage = (ingredient: string): string => {
    const imagePath = getMappedIngredientImage(ingredient);
    if (!imagePath) {
      throw new Error(`Unknown Ingredient Clue image: ${ingredient}`);
    }
    return imagePath;
  };

  return {
    products: productDefinitions,
    getIngredientImage,
    validateAssets: (assetExists) => {
      const errors: string[] = [];

      for (const product of productDefinitions) {
        for (const ingredient of product.ingredients) {
          const imagePath = getIngredientImage(ingredient);
          if (!assetExists(imagePath)) {
            errors.push(
              `${product.id} Ingredient Clue image is missing: ${ingredient} -> ${imagePath}`,
            );
          }
        }
      }

      throwValidationErrors(errors);
    },
  };
};

export const productCatalog = createProductCatalog();
