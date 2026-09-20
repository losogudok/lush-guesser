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
    color: '',
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
    color: '',
  },
  {
    id: 'love',
    name: {
      en: 'Love',
      ru: 'Love',
    },
    ingredients: ['Lemongrass', 'Bergamot', 'Ylang Ylang', 'Rose'],
    description: {
      en: "One spritz of this sweet scent and all of a sudden you're in a rom-com of your own making. Flirty rose swirls with crisp lemongrass and bergamot to create a sweet, tart take on a delicious caramel apple scent. Cover yourself in this alluring perfume and get ready to fall head over heels.",
      ru: 'Забудьте о любовных зельях — этот опьяняющий аромат сам станет вашим союзником в привлечении поклонников. Сначала воздух наполняет напористый лемонграсс, сквозь который просвечивает солнечный бергамот. Затем головокружительный иланг-иланг добавляет сладкое послевкусие, которое сводит с ума.',
    },
    color: '',
  },
  {
    id: 'karma',
    name: {
      en: 'Karma',
      ru: 'Karma',
    },
    ingredients: ['Patchouli', 'Sweet Orange', 'Lemongrass', 'Pine'],
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
    ingredients: ['Rose', 'Geranium', 'Lemon'],
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
    ingredients: ['Mint', 'Tarragon', 'Sandalwood', 'Lavender', 'Thyme', 'Neroli'],
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
    ingredients: ['Blackcurrant', 'Cypress'],
    description: {
      en: 'A reassuring hug of sweet blackcurrant and cozy cypress wood. Warm, fruity, and nostalgic, it feels just like your favorite childhood blanket.',
      ru: 'Утешающие объятия сладкой черной смородины и уютного кипариса. Теплый, фруктовый и ностальгический аромат, напоминающий любимый плед из детства.',
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
    id: 'sleepy',
    name: {
      en: 'Sleepy',
      ru: 'Sleepy',
    },
    ingredients: ['Lavender', 'Tonka Bean', 'Ylang Ylang', 'Benzoin'],
    description: {
      en: 'A soft bedtime blend of lavender, sweet tonka, dreamy ylang ylang, and warm benzoin. Calm, cozy, and made for winding down.',
      ru: 'Мягкая вечерняя композиция из лаванды, сладких бобов тонка, мечтательного иланг-иланга и тёплого бензоина. Спокойная и уютная.',
    },
    color: '#7E57C2',
  },
  {
    id: 'honey-i-washed-the-kids',
    name: {
      en: 'Honey I Washed The Kids',
      ru: 'Honey I Washed The Kids',
    },
    ingredients: ['Bergamot', 'Sweet Orange'],
    description: {
      en: 'A golden, comforting blend of honeyed sweetness, citrus brightness, and soothing aloe. Warm, cheerful, and softly creamy.',
      ru: 'Золотистый, уютный аромат медовой сладости, цитрусовой свежести и успокаивающего алоэ. Тёплый, радостный и мягко-кремовый.',
    },
    color: '#F9A825',
  },
  {
    id: 'avocado-co-wash',
    name: {
      en: 'Avocado Co-Wash',
      ru: 'Avocado Co-Wash',
    },
    ingredients: ['Bergamot', 'Olibanum', 'Litsea Cubeba'],
    description: {
      en: 'A creamy citrus cloud of avocado, bergamot, olibanum, and litsea cubeba. Fresh, fizzy, and softly green.',
      ru: 'Кремовое цитрусовое облако из авокадо, бергамота, олибанума и литсеи кубеба. Свежее, искристое и мягко-зелёное.',
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
    ingredients: ['Neroli', 'Sandalwood', 'Bergamot'],
    description: {
      en: 'A green rush of bright neroli, grounded sandalwood, and bergamot. Clean, earthy, and outdoorsy.',
      ru: 'В этом зелёном аромате свежая трава сочетается с яркими нотами нероли, а бергамот дополняет землистые оттенки сандала.',
    },
    color: '#2E7D32',
  },
  {
    id: 'death-and-decay',
    name: {
      en: 'Death and Decay',
      ru: 'Death and Decay',
    },
    ingredients: ['Ylang Ylang', 'Tonka Bean', 'Rose', 'Jasmine'],
    description: {
      en: 'Intoxicating jasmine and ylang ylang mingle with sweet rose to create a bouquet that first overwhelms, then soothes. Let this floral fragrance carry you to a serene space where beauty and its inevitable decay can be contemplated without fear. It is meditation, acceptance, and optimism expressed in magnificent floral form.',
      ru: 'Пьянящий жасмин и иланг-иланг сочетаются со сладкой розой, образуя букет, который сначала подавляет, а затем успокаивает. Позвольте этому цветочному аромату перенести вас в безмятежное пространство, где красоту и ее неизбежный упадок можно созерцать без страха. Это медитация, принятие и оптимизм, переданные в великолепном цветочном облике.',
    },
    color: '#FF6F00',
  },
];

const ingredientImages: Record<string, string> = {
  almond: '/images/ingredients/almond.png',
  benzoin: '/images/ingredients/benzoin.png',
  bergamot: '/images/ingredients/bergamot.png',
  'black pepper': '/images/ingredients/black_pepper.png',
  blackcurrant: '/images/ingredients/blackcurrant.png',
  cedar: '/images/ingredients/cedar.png',
  clove: '/images/ingredients/clove.png',
  cypress: '/images/ingredients/cypress.png',
  frankincense: '/images/ingredients/frankincense.png',
  geranium: '/images/ingredients/geranium.png',
  jasmine: '/images/ingredients/jasmine.png',
  lavender: '/images/ingredients/lavender.png',
  lemon: '/images/ingredients/lemon.png',
  lemongrass: '/images/ingredients/lemongrass.png',
  lime: '/images/ingredients/lime.png',
  'litsea cubeba': '/images/ingredients/litsea_cubeba.png',
  mint: '/images/ingredients/mint.png',
  neroli: '/images/ingredients/neroli.png',
  olibanum: '/images/ingredients/olibanum.png',
  patchouli: '/images/ingredients/patchouli.png',
  pear: '/images/ingredients/pear.png',
  pine: '/images/ingredients/pine.png',
  rose: '/images/ingredients/rose.png',
  sandalwood: '/images/ingredients/sandalwood.png',
  'sea salt': '/images/ingredients/sea_salt.png',
  'sicilian mandarin': '/images/ingredients/sicilian_mandarin.png',
  'sweet orange': '/images/ingredients/sweet_orange.png',
  tarragon: '/images/ingredients/tarragon.png',
  thyme: '/images/ingredients/thyme.png',
  'tonka bean': '/images/ingredients/tonka_bean.png',
  vanilla: '/images/ingredients/vanilla.png',
  violet: '/images/ingredients/violet.png',
  'ylang ylang': '/images/ingredients/ylang_ylang.png',
};

export const getIngredientImage = (ingredient: string): string => {
  const name = ingredient.toLowerCase().trim();
  return ingredientImages[name] ?? '/images/ingredients/default.png';
};

export const hasIngredientImage = (ingredient: string): boolean =>
  ingredient.toLowerCase().trim() in ingredientImages;
