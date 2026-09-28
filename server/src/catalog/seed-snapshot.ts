import type { LocalizedText } from './localized-text';

/**
 * Seed snapshot generated from the original frontend catalog
 * (frontend/src/data/products.ts), kept as the seed input for the
 * one-time catalog import. A spec guards this snapshot against drift
 * from the frontend fallback snapshot.
 */
export interface SeedIngredient {
  slug: string;
  name: LocalizedText;
  imagePath: string | null;
}

export interface SeedProduct {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  color: string;
  inGame: boolean;
  /** Ingredient Clues as Ingredient slugs in reveal order. */
  clues: string[];
}

export interface CatalogSeedSnapshot {
  ingredients: SeedIngredient[];
  products: SeedProduct[];
}

export const catalogSeedSnapshot: CatalogSeedSnapshot = {
  products: [
    {
      slug: 'confetti',
      name: {
        en: 'Confetti',
        ru: 'Confetti',
      },
      description: {
        en: 'At an Italian wedding, sugared almonds tell a story in three acts: the innocence of violet leaf, the sensuality of rose as the relationship deepens, and the lasting comfort of sandalwood oil.',
        ru: 'Сводящий с ума цветочный аромат. Нежный абсолют фиалки смешивается с чувственной розой, а дымчатое масло сандалового дерева завершает историю, символизируя вечную любовь и комфорт.',
      },
      color: '#A779B8',
      inGame: true,
      clues: ['rose', 'sandalwood', 'violet'],
    },
    {
      slug: 'dear-john',
      name: {
        en: 'Dear John',
        ru: 'Dear John',
      },
      description: {
        en: 'Spritz on this reassuring fragrance, adored by everyone who tries it. Reminiscent of cozy nights in a log cabin, cedarwood and pine create a calming, earthy base. A fresh splash of citrus and a strong coffee note blend with tobacco and smoky vetivert to create a raw, earthy fragrance full of memories.',
        ru: 'Вызывая воспоминания о чтении старых книг и воскресном утреннем кофе, Dear John переносит вас обратно в детство. Как будто вы сидите у камина на коленях своего дедушки или гуляете по лесу с папой - этот древесный, пряный и уютный запах оставляет ощущение безопасности и сентиментальности. Масло дымчатого ветивера расслабляет разум и сглаживает печали. Масло кедрового дерева улучшает концентрацию, а масло цветов гвоздичного дерева успокаивает. Нота кофе завершает это ностальгическое путешествие, и уникальный утешающий аромат словно заключает вас в теплое, дымное объятие.',
      },
      color: '#795548',
      inGame: true,
      clues: ['cedar', 'clove'],
    },
    {
      slug: 'love',
      name: {
        en: 'Love',
        ru: 'Love',
      },
      description: {
        en: 'A bright opening of lemongrass leads to red apple, rose and warm cinnamon.',
        ru: 'Яркий лемонграсс сменяется красным яблоком, розой и тёплой корицей.',
      },
      color: '#EC407A',
      inGame: true,
      clues: ['lemongrass', 'red-apple', 'rose', 'cinnamon'],
    },
    {
      slug: 'karma',
      name: {
        en: 'Karma',
        ru: 'Karma',
      },
      description: {
        en: 'A combination of patchouli, sweet orange, and pine, this signature retro scent is a spicy, herbaceous, and sweet citrus explosion that leaves you feeling grounded and inspired.',
        ru: 'Культовый аромат Lush, сочетающий головокружительные слои апельсина, специй и пачули. Отправляйтесь в Лондон 60-х годов, пока облака возбуждающих пачули смешиваются с жизнеутверждающим бразильским апельсином и очищающей сосной. Уникальный, яркий аромат для свободных духом.',
      },
      color: '#FF6F00',
      inGame: true,
      clues: ['sweet-orange', 'patchouli', 'pine', 'lemongrass'],
    },
    {
      slug: 'rose-jam',
      name: {
        en: 'Rose Jam',
        ru: 'Rose Jam',
      },
      description: {
        en: 'A sweet, jammy, and romantic blend of rose oil, geranium, and fresh lemon. It is like walking through a sun-drenched Turkish rose garden in full bloom.',
        ru: 'Прогуляйтесь по бесконечным полям пудрово-розовых лепестков с этим изысканным ароматом, в котором роскошная герань сочетается с розовым маслом из местечка Сенир в Турции.',
      },
      color: '#E91E63',
      inGame: true,
      clues: ['rose', 'lemon', 'geranium'],
    },
    {
      slug: 'twilight',
      name: {
        en: 'Twilight',
        ru: 'Twilight',
      },
      description: {
        en: 'A soothing, dreamlike lullaby of French lavender, sweet tonka bean, and sensual ylang ylang. Perfect for wrapping yourself in a warm, comforting blanket of calm before bed.',
        ru: 'Успокаивающая колыбельная из французской лаванды, сладких бобов тонка и чувственного иланг-иланга. Идеально, чтобы укутаться в теплое одеяло покоя перед сном.',
      },
      color: '#3F51B5',
      inGame: true,
      clues: ['lavender', 'tonka-bean', 'ylang-ylang', 'benzoin'],
    },
    {
      slug: 'dirty',
      name: {
        en: 'Dirty',
        ru: 'Dirty',
      },
      description: {
        en: "A clean, bracing rush of fresh spearmint, tarragon, thyme, and rich sandalwood. It's an invigorating breath of fresh air designed to keep you feeling crisp and revitalized.",
        ru: 'Дёрти — это многослойная композиция из перечной мяты, эстрагона и тимьяна, которая настигает вас, как порыв свежего ветра. Перечная мята — освежающая, энергичная нота, проясняющая сознание и охлаждающая кожу. Сандаловое дерево и лаванда добавляют аромату цветочные и древесные ноты.',
      },
      color: '#00ACC1',
      inGame: true,
      clues: ['mint', 'tarragon', 'thyme', 'lavender'],
    },
    {
      slug: 'lord-of-misrule',
      name: {
        en: 'Lord of Misrule',
        ru: 'Lord of Misrule',
      },
      description: {
        en: 'A mischievous, festive blend of spicy black pepper, deep patchouli, and sweet, warm vanilla. Mischief managed with a rich, herbal, and sweet aroma.',
        ru: 'Масло пачули с острова Суматра смешивается с перечными нотами в безумном карнавале Праздника дураков.',
      },
      color: '#43A047',
      inGame: true,
      clues: ['black-pepper', 'patchouli', 'vanilla'],
    },
    {
      slug: 'the-comforter',
      name: {
        en: 'The Comforter',
        ru: 'The Comforter',
      },
      description: {
        en: 'Juicy blackcurrant meets bright bergamot and a woody cypress finish.',
        ru: 'Сочная чёрная смородина сочетается с ярким бергамотом и древесным кипарисом.',
      },
      color: '#D81B60',
      inGame: true,
      clues: ['blackcurrant', 'bergamot', 'cypress'],
    },
    {
      slug: 'honey-i-washed-the-kids',
      name: {
        en: 'Honey I Washed The Kids',
        ru: 'Honey I Washed The Kids',
      },
      description: {
        en: 'Golden toffee, honey and caramel are lifted by a touch of bergamot.',
        ru: 'Золотистые ириски, мёд и карамель оттеняет лёгкий бергамот.',
      },
      color: '#F9A825',
      inGame: true,
      clues: ['toffee', 'honey', 'caramel', 'bergamot'],
    },
    {
      slug: 'avocado-co-wash',
      name: {
        en: 'Avocado Co-Wash',
        ru: 'Avocado Co-Wash',
      },
      description: {
        en: 'Bright bergamot meets the warm, resinous scent of olibanum.',
        ru: 'Яркий бергамот сочетается с тёплым смолистым ароматом олибанума.',
      },
      color: '#8BC34A',
      inGame: true,
      clues: ['bergamot', 'olibanum'],
    },
    {
      slug: 'grass',
      name: {
        en: 'Grass',
        ru: 'Grass',
      },
      description: {
        en: 'Fresh grass leads into neroli and bergamot, with sandalwood in the background.',
        ru: 'Свежая трава раскрывается нероли и бергамотом на мягкой сандаловой основе.',
      },
      color: '#2E7D32',
      inGame: true,
      clues: ['grass', 'neroli', 'bergamot', 'sandalwood'],
    },
    {
      slug: 'death-and-decay',
      name: {
        en: 'Death and Decay',
        ru: 'Death and Decay',
      },
      description: {
        en: 'Intoxicating jasmine and ylang ylang mingle with sweet rose to create a bouquet that first overwhelms, then soothes. Let this floral fragrance carry you to a serene space where beauty and its inevitable decay can be contemplated without fear. It is meditation, acceptance, and optimism expressed in magnificent floral form.',
        ru: 'Пьянящий жасмин и иланг-иланг сочетаются со сладкой розой, образуя букет, который сначала подавляет, а затем успокаивает. Позвольте этому цветочному аромату перенести вас в безмятежное пространство, где красоту и ее неизбежный упадок можно созерцать без страха. Это медитация, принятие и оптимизм, переданные в великолепном цветочном облике.',
      },
      color: '#FF6F00',
      inGame: true,
      clues: ['jasmine', 'ylang-ylang', 'rose', 'tonka-bean'],
    },
    {
      slug: 'sticky-dates',
      name: {
        en: 'Sticky Dates',
        ru: 'Sticky Dates',
      },
      description: {
        en: 'Rich caramel is wrapped in warm benzoin and smooth sandalwood.',
        ru: 'Насыщенная карамель сочетается с тёплым бензоином и мягким сандалом.',
      },
      color: '#8D5A3B',
      inGame: true,
      clues: ['caramel', 'benzoin', 'sandalwood'],
    },
    {
      slug: 'super-milk',
      name: {
        en: 'Super Milk',
        ru: 'Super Milk',
      },
      description: {
        en: 'Citrusy litsea cubeba softens into creamy vanilla and tonka bean.',
        ru: 'Цитрусовая литсея кубеба смягчается сливочной ванилью и бобами тонка.',
      },
      color: '#F2D7A1',
      inGame: true,
      clues: ['litsea-cubeba', 'vanilla', 'tonka-bean'],
    },
    {
      slug: 'let-the-good-times-roll',
      name: {
        en: 'Let The Good Times Roll',
        ru: 'Let The Good Times Roll',
      },
      description: {
        en: 'Buttery popcorn meets caramel sweetness and a touch of cinnamon.',
        ru: 'Маслянистый попкорн сочетается с карамельной сладостью и ноткой корицы.',
      },
      color: '#D9A441',
      inGame: true,
      clues: ['popcorn', 'caramel', 'butter', 'cinnamon'],
    },
    {
      slug: 'big',
      name: {
        en: 'Big',
        ru: 'Big',
      },
      description: {
        en: 'Neroli and orange blossom settle into a soft vanilla base.',
        ru: 'Нероли и цветы апельсина раскрываются на мягкой ванильной основе.',
      },
      color: '#F7B267',
      inGame: true,
      clues: ['neroli', 'orange-blossom', 'vanilla'],
    },
    {
      slug: 'sakura',
      name: {
        en: 'Sakura',
        ru: 'Sakura',
      },
      description: {
        en: 'Sunny lemon opens into delicate mimosa and jasmine.',
        ru: 'Солнечный лимон раскрывается нежной мимозой и жасмином.',
      },
      color: '#F5B7C5',
      inGame: true,
      clues: ['lemon', 'mimosa', 'jasmine'],
    },
    {
      slug: 'sex-bomb',
      name: {
        en: 'Sex Bomb',
        ru: 'Sex Bomb',
      },
      description: {
        en: 'Jasmine and ylang ylang bloom over aromatic clary sage.',
        ru: 'Жасмин и иланг-иланг раскрываются на ароматной основе шалфея мускатного.',
      },
      color: '#D982B5',
      inGame: true,
      clues: ['jasmine', 'ylang-ylang', 'clary-sage'],
    },
    {
      slug: 'chelsea-morning',
      name: {
        en: 'Chelsea Morning',
        ru: 'Chelsea Morning',
      },
      description: {
        en: 'Toffee and lemon melt into vanilla and tonka bean.',
        ru: 'Ириски и лимон переходят в ваниль и бобы тонка.',
      },
      color: '#DDA86C',
      inGame: true,
      clues: ['toffee', 'lemon', 'vanilla', 'tonka-bean'],
    },
    {
      slug: 'vanillary',
      name: {
        en: 'Vanillary',
        ru: 'Vanillary',
      },
      description: {
        en: 'Creamy vanilla is joined by jasmine and tonka bean.',
        ru: 'Сливочную ваниль дополняют жасмин и бобы тонка.',
      },
      color: '#E6C69A',
      inGame: true,
      clues: ['vanilla', 'jasmine', 'tonka-bean'],
    },
    {
      slug: 'junk',
      name: {
        en: 'Junk',
        ru: 'Junk',
      },
      description: {
        en: 'Tart blackcurrant and lemon cut through rosemary and sage.',
        ru: 'Терпкая чёрная смородина и лимон сочетаются с розмарином и шалфеем.',
      },
      color: '#754C75',
      inGame: true,
      clues: ['blackcurrant', 'rosemary', 'lemon', 'sage'],
    },
    {
      slug: '4-20-pm',
      name: {
        en: '4:20 PM',
        ru: '4:20 PM',
      },
      description: {
        en: 'Green cannabis meets earthy patchouli, oakmoss and sandalwood.',
        ru: 'Зелёная нота конопли сочетается с землистыми пачули, дубовым мхом и сандалом.',
      },
      color: '#687B52',
      inGame: true,
      clues: ['cannabis', 'patchouli', 'oakmoss', 'sandalwood'],
    },
    {
      slug: '29-high-street',
      name: {
        en: '29 High Street',
        ru: '29 High Street',
      },
      description: {
        en: 'Honey and caramel sweetness mingle with a fresh green accord.',
        ru: 'Сладость мёда и карамели сочетается со свежими зелёными нотами.',
      },
      color: '#D6B45B',
      inGame: true,
      clues: ['honey', 'green-notes', 'caramel'],
    },
  ],
  ingredients: [
    {
      slug: 'red-apple',
      name: {
        en: 'Red Apple',
        ru: 'Красное яблоко',
      },
      imagePath: '/images/ingredients/red_apple.png',
    },
    {
      slug: 'cinnamon',
      name: {
        en: 'Cinnamon',
        ru: 'Корица',
      },
      imagePath: '/images/ingredients/cinnamon.png',
    },
    {
      slug: 'lemon',
      name: {
        en: 'Lemon',
        ru: 'Лимон',
      },
      imagePath: '/images/ingredients/lemon.png',
    },
    {
      slug: 'grass',
      name: {
        en: 'Grass',
        ru: 'Трава',
      },
      imagePath: '/images/ingredients/grass.png',
    },
    {
      slug: 'neroli',
      name: {
        en: 'Neroli',
        ru: 'Нероли',
      },
      imagePath: '/images/ingredients/neroli.png',
    },
    {
      slug: 'toffee',
      name: {
        en: 'Toffee',
        ru: 'Ириски',
      },
      imagePath: '/images/ingredients/toffee.png',
    },
    {
      slug: 'honey',
      name: {
        en: 'Honey',
        ru: 'Мёд',
      },
      imagePath: '/images/ingredients/honey.png',
    },
    {
      slug: 'caramel',
      name: {
        en: 'Caramel',
        ru: 'Карамель',
      },
      imagePath: '/images/ingredients/caramel.png',
    },
    {
      slug: 'popcorn',
      name: {
        en: 'Popcorn',
        ru: 'Попкорн',
      },
      imagePath: '/images/ingredients/popcorn.png',
    },
    {
      slug: 'butter',
      name: {
        en: 'Butter',
        ru: 'Сливочное масло',
      },
      imagePath: '/images/ingredients/butter.png',
    },
    {
      slug: 'orange-blossom',
      name: {
        en: 'Orange Blossom',
        ru: 'Цветы апельсина',
      },
      imagePath: '/images/ingredients/neroli.png',
    },
    {
      slug: 'mimosa',
      name: {
        en: 'Mimosa',
        ru: 'Мимоза',
      },
      imagePath: '/images/ingredients/mimosa.png',
    },
    {
      slug: 'clary-sage',
      name: {
        en: 'Clary Sage',
        ru: 'Шалфей мускатный',
      },
      imagePath: '/images/ingredients/clary_sage.png',
    },
    {
      slug: 'rosemary',
      name: {
        en: 'Rosemary',
        ru: 'Розмарин',
      },
      imagePath: '/images/ingredients/rosemary.png',
    },
    {
      slug: 'sage',
      name: {
        en: 'Sage',
        ru: 'Шалфей',
      },
      imagePath: '/images/ingredients/clary_sage.png',
    },
    {
      slug: 'cannabis',
      name: {
        en: 'Cannabis',
        ru: 'Конопля',
      },
      imagePath: '/images/ingredients/cannabis.png',
    },
    {
      slug: 'oakmoss',
      name: {
        en: 'Oakmoss',
        ru: 'Дубовый мох',
      },
      imagePath: '/images/ingredients/oakmoss.png',
    },
    {
      slug: 'green-notes',
      name: {
        en: 'Green Notes',
        ru: 'Зелёные ноты',
      },
      imagePath: '/images/ingredients/green_notes.png',
    },
    {
      slug: 'rose',
      name: {
        en: 'Rose',
        ru: 'Rose',
      },
      imagePath: '/images/ingredients/rose.png',
    },
    {
      slug: 'sandalwood',
      name: {
        en: 'Sandalwood',
        ru: 'Sandalwood',
      },
      imagePath: '/images/ingredients/sandalwood.png',
    },
    {
      slug: 'violet',
      name: {
        en: 'Violet',
        ru: 'Violet',
      },
      imagePath: '/images/ingredients/violet.png',
    },
    {
      slug: 'cedar',
      name: {
        en: 'Cedar',
        ru: 'Cedar',
      },
      imagePath: '/images/ingredients/cedar.png',
    },
    {
      slug: 'clove',
      name: {
        en: 'Clove',
        ru: 'Clove',
      },
      imagePath: '/images/ingredients/clove.png',
    },
    {
      slug: 'lemongrass',
      name: {
        en: 'Lemongrass',
        ru: 'Lemongrass',
      },
      imagePath: '/images/ingredients/lemongrass.png',
    },
    {
      slug: 'bergamot',
      name: {
        en: 'Bergamot',
        ru: 'Bergamot',
      },
      imagePath: '/images/ingredients/bergamot.png',
    },
    {
      slug: 'ylang-ylang',
      name: {
        en: 'Ylang Ylang',
        ru: 'Ylang Ylang',
      },
      imagePath: '/images/ingredients/ylang_ylang.png',
    },
    {
      slug: 'patchouli',
      name: {
        en: 'Patchouli',
        ru: 'Patchouli',
      },
      imagePath: '/images/ingredients/patchouli.png',
    },
    {
      slug: 'sweet-orange',
      name: {
        en: 'Sweet Orange',
        ru: 'Sweet Orange',
      },
      imagePath: '/images/ingredients/sweet_orange.png',
    },
    {
      slug: 'pine',
      name: {
        en: 'Pine',
        ru: 'Pine',
      },
      imagePath: '/images/ingredients/pine.png',
    },
    {
      slug: 'geranium',
      name: {
        en: 'Geranium',
        ru: 'Geranium',
      },
      imagePath: '/images/ingredients/geranium.png',
    },
    {
      slug: 'lavender',
      name: {
        en: 'Lavender',
        ru: 'Lavender',
      },
      imagePath: '/images/ingredients/lavender.png',
    },
    {
      slug: 'tonka-bean',
      name: {
        en: 'Tonka Bean',
        ru: 'Tonka Bean',
      },
      imagePath: '/images/ingredients/tonka_bean.png',
    },
    {
      slug: 'benzoin',
      name: {
        en: 'Benzoin',
        ru: 'Benzoin',
      },
      imagePath: '/images/ingredients/benzoin.png',
    },
    {
      slug: 'mint',
      name: {
        en: 'Mint',
        ru: 'Mint',
      },
      imagePath: '/images/ingredients/mint.png',
    },
    {
      slug: 'tarragon',
      name: {
        en: 'Tarragon',
        ru: 'Tarragon',
      },
      imagePath: '/images/ingredients/tarragon.png',
    },
    {
      slug: 'black-pepper',
      name: {
        en: 'Black Pepper',
        ru: 'Black Pepper',
      },
      imagePath: '/images/ingredients/black_pepper.png',
    },
    {
      slug: 'vanilla',
      name: {
        en: 'Vanilla',
        ru: 'Vanilla',
      },
      imagePath: '/images/ingredients/vanilla.png',
    },
    {
      slug: 'blackcurrant',
      name: {
        en: 'Blackcurrant',
        ru: 'Blackcurrant',
      },
      imagePath: '/images/ingredients/blackcurrant.png',
    },
    {
      slug: 'cypress',
      name: {
        en: 'Cypress',
        ru: 'Cypress',
      },
      imagePath: '/images/ingredients/cypress.png',
    },
    {
      slug: 'olibanum',
      name: {
        en: 'Olibanum',
        ru: 'Olibanum',
      },
      imagePath: '/images/ingredients/olibanum.png',
    },
    {
      slug: 'litsea-cubeba',
      name: {
        en: 'Litsea Cubeba',
        ru: 'Litsea Cubeba',
      },
      imagePath: '/images/ingredients/litsea_cubeba.png',
    },
    {
      slug: 'jasmine',
      name: {
        en: 'Jasmine',
        ru: 'Jasmine',
      },
      imagePath: '/images/ingredients/jasmine.png',
    },
    {
      slug: 'almond',
      name: {
        en: 'Almond',
        ru: 'Almond',
      },
      imagePath: '/images/ingredients/almond.png',
    },
    {
      slug: 'sea-salt',
      name: {
        en: 'Sea Salt',
        ru: 'Sea Salt',
      },
      imagePath: '/images/ingredients/sea_salt.png',
    },
    {
      slug: 'thyme',
      name: {
        en: 'Thyme',
        ru: 'Thyme',
      },
      imagePath: '/images/ingredients/thyme.png',
    },
  ],
};
