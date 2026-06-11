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
      'profile.title': 'Profile',

      // Game Screen
      'game.round': 'Round {{round}}/5',
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
      'leaderboard.offline': 'Showing local cached scores. Build and run NestJS backend to sync live scores.',
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
    }
  },
  ru: {
    translation: {
      // Welcome Screen
      'app.title': 'LUSH УГАДАЙКА',
      'app.subtitle': 'Испытайте свой нос. Открывайте ингредиенты. Станьте мастером ароматов.',
      'app.start': 'Начать игру',
      'nav.play': 'Играть',
      'nav.leaderboard': 'Рекорды',
      'help.title': 'Как играть',
      'profile.title': 'Профиль',

      // Game Screen
      'game.round': 'Раунд {{round}}/5',
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
      'leaderboard.offline': 'Показаны локальные сохраненные результаты. Запустите бэкенд NestJS для синхронизации.',
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
