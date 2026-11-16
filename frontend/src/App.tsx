import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import InfoModal from './components/InfoModal';
import { GAME_SESSION_ROUND_COUNT } from './game/gameSession';
import { useGameStore } from './game/useGameStore';
import { useUiStore } from './ui/useUiStore';

function App() {
  const screen = useUiStore((state) => state.screen);
  const finishedSession = useGameStore((state) =>
    state.session?.status === 'finished' ? state.session : null,
  );

  return (
    <div className="min-h-screen bg-white">
      {screen === 'welcome' && <WelcomeScreen />}

      {screen === 'game' && !finishedSession && <GameScreen />}

      {screen === 'game' && finishedSession && (
        <GameOverScreen
          score={finishedSession.score}
          correctAnswers={finishedSession.correctAnswerCount}
          totalRounds={GAME_SESSION_ROUND_COUNT}
        />
      )}

      {screen === 'leaderboard' && <LeaderboardScreen />}
      <InfoModal />
    </div>
  );
}

export default App;
