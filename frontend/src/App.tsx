import { useState } from 'react';

import WelcomeScreen from './components/WelcomeScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import InfoModal from './components/InfoModal';
import type { InfoModalType } from './components/InfoModal';
import { GAME_ROUND_COUNT } from './constants';

type ScreenState = 'welcome' | 'game' | 'gameover' | 'leaderboard';

function App() {
  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [finalScore, setFinalScore] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  const [infoModal, setInfoModal] = useState<InfoModalType | null>(null);

  const handleStartGame = () => {
    setScreen('game');
  };

  const handleGameFinished = (score: number, correctCount: number) => {
    setFinalScore(score);
    setCorrectAnswers(correctCount);
    setScreen('gameover');
  };

  const handleQuit = () => {
    setScreen('welcome');
    setActiveTab('play');
  };

  const handlePlayAgain = () => {
    setScreen('game');
  };

  const handleReturnHome = () => {
    setScreen('welcome');
    setActiveTab('play');
  };

  const handleNavigateToLeaderboard = () => {
    setScreen('leaderboard');
    setActiveTab('leaderboard');
  };

  const handleHeaderNavigate = (tab: 'play' | 'leaderboard') => {
    setActiveTab(tab);
    if (tab === 'play') {
      setScreen('welcome');
    } else {
      setScreen('leaderboard');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {screen === 'welcome' && (
        <WelcomeScreen
          onStartGame={handleStartGame}
          onNavigate={handleHeaderNavigate}
          activeTab={activeTab}
          onOpenInfo={setInfoModal}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          onGameFinished={handleGameFinished}
          onQuit={handleQuit}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          correctAnswers={correctAnswers}
          totalRounds={GAME_ROUND_COUNT}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
          onNavigateToLeaderboard={handleNavigateToLeaderboard}
          onOpenInfo={setInfoModal}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen
          onNavigate={handleHeaderNavigate}
          activeTab={activeTab}
          onOpenInfo={setInfoModal}
        />
      )}
      <InfoModal type={infoModal} onClose={() => setInfoModal(null)} />
    </div>
  );
}

export default App;
