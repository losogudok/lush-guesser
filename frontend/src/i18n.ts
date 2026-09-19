import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Welcome Screen
      'app.title': 'LUSH GUESSER',
      'app.subtitle': 'Test your nose. Reveal ingredients. Master the art of scent.',
      'app.start': 'Start Game',
      'nav.play': 'Play',
      'nav.leaderboard': 'Leaderboard',
      'help.title': 'How to Play',

      // Shared footer and info modals
      'footer.terms': 'Terms',
      'footer.privacy': 'Privacy',
      'footer.contact': 'Contact',
      'info.close': 'Close',
      'info.help.title': 'How to Play',
      'info.help.p1': 'Each game session has 10 rounds. In every round, your job is to identify one product from its ingredient clues.',
      'info.help.p2': 'One ingredient is revealed at the start. You can reveal more ingredients, but each reveal lowers the round value by 25 points.',
      'info.help.p3': 'Choose one of the four product options. You only get one guess per round.',
      'info.help.p4': 'A correct guess earns the current round value. A wrong guess earns 0 points for that round.',
      'info.help.p5': 'At the end, submit a display name to place your score on the leaderboard.',
      'info.terms.title': 'Terms',
      'info.terms.p1': 'Lush Scent Guesser is a fan-made quiz game for entertainment and learning.',
      'info.terms.p2': 'Product names and scent references are used only to describe quiz answers. This project is not affiliated with or endorsed by Lush.',
      'info.terms.p3': 'Please submit appropriate display names to the leaderboard.',
      'info.privacy.title': 'Privacy',
      'info.privacy.p1': 'The game does not create accounts and does not ask for passwords or email addresses.',
      'info.privacy.p2': 'When you submit a score, the leaderboard stores your display name, score, and submission time.',
      'info.privacy.p3': 'Language preference is stored in your browser so the app can reopen in the same language.',
      'info.contact.title': 'Contact',
      'info.contact.p1': 'Have a question or want to get in touch?',
      'info.contact.telegram': 'Telegram',
      'info.contact.github': 'GitHub',

      // Game Screen
      'game.round': 'Round {{round}}/10',
      'game.score': 'Total Score: {{score}}',
      
      // Plurals for worth points
      'game.worth_one': 'Current Worth: {{count}} Point',
      'game.worth_other': 'Current Worth: {{count}} Points',

      'game.ingredient': 'Ingredient {{index}}',
      'game.reveal_next': 'Reveal Next',
      'game.reveal_cost': '(Costs 25 pts)',
      'game.locked': 'Locked',
      'game.whats_scent': 'What\'s the Scent?',
      'game.instructions': 'Analyze the ingredients and make your guess before revealing more to maximize your points.',
      'game.correct': 'Correct Scent!',
      'game.incorrect': 'Incorrect Scent',
      'game.gained_points': '+{{points}} Points',
      'game.gained_zero': '+0 Points',
      'game.result_correct': 'Correct Scent!',
      'game.result_incorrect_note': 'You guessed {{guess}}. The correct signature blend was {{correct}}.',
      'game.next_scent': 'Next Scent',
      'game.show_results': 'Show Results',
      'game.quit': 'Quit Game',

      // Game Over Screen
      'gameover.final_score': 'Final Score',
      'gameover.guesses': 'Guesses Correct',
      'gameover.leaderboard_label': 'Save score to global leaderboard:',
      'gameover.name_placeholder': 'Enter name (max 20 chars)',
      'gameover.submit': 'Submit',
      'gameover.saved': '✓ Score saved to leaderboard!',
      'gameover.play_again': 'Play Again',
      'gameover.return_home': 'Return to Home',
      
      // Performance Titles & Subtitles
      'tier.perfumer': 'Master Perfumer',
      'tier.perfumer.desc': 'Your olfactory senses are sharp. You\'ve successfully identified the core notes of our signature blends.',
      'tier.enthusiast': 'Bath Bomb Enthusiast',
      'tier.enthusiast.desc': 'You know your scents! You\'re well on your way to becoming a nose expert.',
      'tier.novice': 'Soap Novice',
      'tier.novice.desc': 'You are just starting to discover the power of ingredients. Lather up and try again!',

      // Leaderboard Screen
      'leaderboard.title': 'Global High Scores',
      'leaderboard.desc': 'The sharpest noses in the community.',
      'leaderboard.offline': 'Leaderboard unavailable. Showing sample scores, not live global rankings.',
      'leaderboard.sample': 'Sample',
      'leaderboard.loading': 'Fetching olfactory ranks...',
      'leaderboard.empty': 'No scores recorded yet. Be the first to enter your name!',
      'leaderboard.rank': 'Rank',
      'leaderboard.name': 'Name',
      'leaderboard.score': 'Score',
      'leaderboard.date': 'Date',

      // Ingredients
      'Patchouli': 'Patchouli',
      'Sweet Orange': 'Sweet Orange',
      'Lemongrass': 'Lemongrass',
      'Pine': 'Pine',
      'Rose': 'Rose',
      'Geranium': 'Geranium',
      'Lemon': 'Lemon',
      'Sicilian Mandarin': 'Sicilian Mandarin',
      'Lavender': 'Lavender',
      'Tonka Bean': 'Tonka Bean',
      'Ylang Ylang': 'Ylang Ylang',
      'Benzoin': 'Benzoin',
      'Mint': 'Mint',
      'Tarragon': 'Tarragon',
      'Sandalwood': 'Sandalwood',
      'Thyme': 'Thyme',
      'Black Pepper': 'Black Pepper',
      'Vanilla': 'Vanilla',
      'Frankincense': 'Frankincense',
      'Blackcurrant': 'Blackcurrant',
      'Bergamot': 'Bergamot',
      'Cypress': 'Cypress',
      'Almond': 'Almond',
      'Pear': 'Pear',
      'Lime': 'Lime',
      'Musk': 'Musk',
      'Oat Milk': 'Oat Milk',
      'Neroli': 'Neroli',
      'Honey': 'Honey',
      'Aloe Vera': 'Aloe Vera',
      'Avocado': 'Avocado',
      'Olibanum': 'Olibanum',
      'Litsea Cubeba': 'Litsea Cubeba',
      'Sea Salt': 'Sea Salt',
      'Grapefruit': 'Grapefruit',
      'Coconut': 'Coconut',
      'Wheatgrass': 'Wheatgrass',
      'Cedar': 'Cedar',
      'Clove': 'Clove',
      'Jasmine': 'Jasmine',
      'Violet': 'Violet',
    }
  },
  ru: {
    translation: {
      // Welcome Screen
      'app.title': 'LUSH GUESSER',
      'app.subtitle': 'Испытайте свой нос. Открывайте ингредиенты. Станьте мастером ароматов.',
      'app.start': 'Начать игру',
      'nav.play': 'Играть',
      'nav.leaderboard': 'Рекорды',
      'help.title': 'Как играть',

      // Shared footer and info modals
      'footer.terms': 'Условия',
      'footer.privacy': 'Приватность',
      'footer.contact': 'Контакты',
      'info.close': 'Закрыть',
      'info.help.title': 'Как играть',
      'info.help.p1': 'В каждой игровой сессии 10 раундов. В каждом раунде нужно узнать один продукт по ингредиентам-подсказкам.',
      'info.help.p2': 'Сначала открыт один ингредиент. Можно открыть больше, но каждое открытие уменьшает ценность раунда на 25 очков.',
      'info.help.p3': 'Выберите один из четырех вариантов продукта. В каждом раунде доступна только одна попытка.',
      'info.help.p4': 'Правильный ответ дает текущую ценность раунда. Неверный ответ дает 0 очков за раунд.',
      'info.help.p5': 'В конце можно отправить отображаемое имя и добавить результат в таблицу рекордов.',
      'info.terms.title': 'Условия',
      'info.terms.p1': 'Lush Scent Guesser — фанатская викторина для развлечения и знакомства с ароматами.',
      'info.terms.p2': 'Названия продуктов и отсылки к ароматам используются только как ответы викторины. Проект не связан с Lush и не одобрен Lush.',
      'info.terms.p3': 'Пожалуйста, используйте уместные отображаемые имена в таблице рекордов.',
      'info.privacy.title': 'Приватность',
      'info.privacy.p1': 'Игра не создает аккаунты и не запрашивает пароли или адреса электронной почты.',
      'info.privacy.p2': 'При отправке результата таблица рекордов сохраняет отображаемое имя, очки и время отправки.',
      'info.privacy.p3': 'Выбранный язык сохраняется в браузере, чтобы приложение открывалось на том же языке.',
      'info.contact.title': 'Контакты',
      'info.contact.p1': 'Есть вопрос или хотите связаться?',
      'info.contact.telegram': 'Telegram',
      'info.contact.github': 'GitHub',

      // Game Screen
      'game.round': 'Раунд {{round}}/10',
      'game.score': 'Всего очков: {{score}}',
      
      // Plurals for worth points in Russian (using i18next plural keys)
      'game.worth_one': 'Ценность: {{count}} очко',
      'game.worth_few': 'Ценность: {{count}} очка',
      'game.worth_many': 'Ценность: {{count}} очков',

      'game.ingredient': 'Ингредиент {{index}}',
      'game.reveal_next': 'Открыть след.',
      'game.reveal_cost': '(25 очков)',
      'game.locked': 'Закрыто',
      'game.whats_scent': 'Что это за аромат?',
      'game.instructions': 'Проанализируйте ингредиенты и угадайте аромат до того, как откроете новые, чтобы заработать максимум очков.',
      'game.correct': 'Правильный аромат!',
      'game.incorrect': 'Неверный аромат',
      'game.gained_points': '+{{points}} очков',
      'game.gained_zero': '+0 очков',
      'game.result_correct': 'Правильно!',
      'game.result_incorrect_note': 'Вы выбрали {{guess}}. Правильный аромат — {{correct}}.',
      'game.next_scent': 'Далее',
      'game.show_results': 'Результаты',
      'game.quit': 'Выйти',

      // Game Over Screen
      'gameover.final_score': 'Итоговый счет',
      'gameover.guesses': 'Правильные ответы',
      'gameover.leaderboard_label': 'Сохранить результат в таблицу лидеров:',
      'gameover.name_placeholder': 'Введите имя (макс. 20 симв.)',
      'gameover.submit': 'Отправить',
      'gameover.saved': '✓ Результат сохранен в таблице!',
      'gameover.play_again': 'Играть снова',
      'gameover.return_home': 'На главную',
      
      // Performance Titles & Subtitles
      'tier.perfumer': 'Мастер-парфюмер',
      'tier.perfumer.desc': 'Ваше обоняние на высоте! Вы успешно определили ключевые ноты наших легендарных ароматов.',
      'tier.enthusiast': 'Любитель бомбочек',
      'tier.enthusiast.desc': 'Вы отлично разбираетесь в ароматах! Вы на верном пути к тому, чтобы стать экспертом.',
      'tier.novice': 'Новичок мыловарения',
      'tier.novice.desc': 'Вы только начинаете открывать для себя силу ингредиентов. Намыльтесь хорошенько и попробуйте еще раз!',

      // Leaderboard Screen
      'leaderboard.title': 'Мировая таблица рекордов',
      'leaderboard.desc': 'Самое острое обоняние в сообществе.',
      'leaderboard.offline': 'Таблица рекордов недоступна. Показаны примерные результаты, а не живой мировой рейтинг.',
      'leaderboard.sample': 'Пример',
      'leaderboard.loading': 'Загрузка таблицы рекордов...',
      'leaderboard.empty': 'Рекордов пока нет. Станьте первым!',
      'leaderboard.rank': 'Ранг',
      'leaderboard.name': 'Имя',
      'leaderboard.score': 'Очки',
      'leaderboard.date': 'Дата',

      // Ingredients
      'Patchouli': 'Пачули',
      'Sweet Orange': 'Сладкий апельсин',
      'Lemongrass': 'Лемонграсс',
      'Pine': 'Сосна',
      'Rose': 'Роза',
      'Geranium': 'Герань',
      'Lemon': 'Лимон',
      'Sicilian Mandarin': 'Сицилийский мандарин',
      'Lavender': 'Лаванда',
      'Tonka Bean': 'Бобы тонка',
      'Ylang Ylang': 'Иланг-иланг',
      'Benzoin': 'Бензоин',
      'Mint': 'Мята',
      'Tarragon': 'Эстрагон',
      'Sandalwood': 'Сандал',
      'Thyme': 'Тимьян',
      'Black Pepper': 'Черный перец',
      'Vanilla': 'Ваниль',
      'Frankincense': 'Ладан',
      'Blackcurrant': 'Черная смородина',
      'Bergamot': 'Бергамот',
      'Cypress': 'Кипарис',
      'Almond': 'Миндаль',
      'Pear': 'Груша',
      'Lime': 'Лайм',
      'Musk': 'Мускус',
      'Oat Milk': 'Овсяное молоко',
      'Neroli': 'Нероли',
      'Honey': 'Мед',
      'Aloe Vera': 'Алоэ вера',
      'Avocado': 'Авокадо',
      'Olibanum': 'Олибанум',
      'Litsea Cubeba': 'Литсея кубеба',
      'Sea Salt': 'Морская соль',
      'Grapefruit': 'Грейпфрут',
      'Coconut': 'Кокос',
      'Wheatgrass': 'Ростковая трава',
      'Cedar': 'Кедр',
      'Clove': 'Гвоздика',
      'Jasmine': 'Жасмин',
      'Violet': 'Фиалка',
    }
  }
};

// Detect browser language and fallback to English
const savedLanguage = localStorage.getItem('lush_locale');
const defaultLanguage = savedLanguage || (navigator.language.startsWith('ru') ? 'ru' : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already escapes values
    }
  });

// Keep localStorage in sync with current language
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lush_locale', lng);
});

export default i18n;
