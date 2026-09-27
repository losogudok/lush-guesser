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
        en: "One spritz of this sweet scent and all of a sudden you're in a rom-com of your own making. Flirty rose swirls with crisp lemongrass and bergamot to create a sweet, tart take on a delicious caramel apple scent. Cover yourself in this alluring perfume and get ready to fall head over heels.",
        ru: 'Забудьте о любовных зельях — этот опьяняющий аромат сам станет вашим союзником в привлечении поклонников. Сначала воздух наполняет напористый лемонграсс, сквозь который просвечивает солнечный бергамот. Затем головокружительный иланг-иланг добавляет сладкое послевкусие, которое сводит с ума.',
      },
      color: '#EC407A',
      inGame: true,
      clues: ['lemongrass', 'bergamot', 'ylang-ylang', 'rose'],
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
      clues: ['patchouli', 'sweet-orange', 'lemongrass', 'pine'],
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
      clues: ['rose', 'geranium'],
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
      clues: ['mint', 'tarragon', 'sandalwood', 'lavender'],
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
        en: 'A reassuring hug of sweet blackcurrant and cozy cypress wood. Warm, fruity, and nostalgic, it feels just like your favorite childhood blanket.',
        ru: 'Утешающие объятия сладкой черной смородины и уютного кипариса. Теплый, фруктовый и ностальгический аромат, напоминающий любимый плед из детства.',
      },
      color: '#D81B60',
      inGame: true,
      clues: ['blackcurrant', 'cypress'],
    },
    {
      slug: 'sleepy',
      name: {
        en: 'Sleepy',
        ru: 'Sleepy',
      },
      description: {
        en: 'A soft bedtime blend of lavender, sweet tonka, dreamy ylang ylang, and warm benzoin. Calm, cozy, and made for winding down.',
        ru: 'Мягкая вечерняя композиция из лаванды, сладких бобов тонка, мечтательного иланг-иланга и тёплого бензоина. Спокойная и уютная.',
      },
      color: '#7E57C2',
      inGame: true,
      clues: ['lavender', 'tonka-bean', 'ylang-ylang', 'benzoin'],
    },
    {
      slug: 'honey-i-washed-the-kids',
      name: {
        en: 'Honey I Washed The Kids',
        ru: 'Honey I Washed The Kids',
      },
      description: {
        en: 'A golden, comforting blend of honeyed sweetness, citrus brightness, and soothing aloe. Warm, cheerful, and softly creamy.',
        ru: 'Золотистый, уютный аромат медовой сладости, цитрусовой свежести и успокаивающего алоэ. Тёплый, радостный и мягко-кремовый.',
      },
      color: '#F9A825',
      inGame: true,
      clues: ['bergamot', 'sweet-orange'],
    },
    {
      slug: 'avocado-co-wash',
      name: {
        en: 'Avocado Co-Wash',
        ru: 'Avocado Co-Wash',
      },
      description: {
        en: 'A creamy citrus cloud of avocado, bergamot, olibanum, and litsea cubeba. Fresh, fizzy, and softly green.',
        ru: 'Кремовое цитрусовое облако из авокадо, бергамота, олибанума и литсеи кубеба. Свежее, искристое и мягко-зелёное.',
      },
      color: '#8BC34A',
      inGame: true,
      clues: ['bergamot', 'olibanum', 'litsea-cubeba'],
    },
    {
      slug: 'grass',
      name: {
        en: 'Grass',
        ru: 'Grass',
      },
      description: {
        en: 'A green rush of bright neroli, grounded sandalwood, and bergamot. Clean, earthy, and outdoorsy.',
        ru: 'В этом зелёном аромате свежая трава сочетается с яркими нотами нероли, а бергамот дополняет землистые оттенки сандала.',
      },
      color: '#2E7D32',
      inGame: true,
      clues: ['sandalwood', 'bergamot'],
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
      clues: ['ylang-ylang', 'tonka-bean', 'rose', 'jasmine'],
    },
  ],
  ingredients: [
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
