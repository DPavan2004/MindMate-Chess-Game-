import React, { useState } from 'react';
import ChessGame from './components/ChessGame';
import GhostChessGame from './components/GhostChessGame';
import QuantumChessGame from './components/QuantumChessGame';
import HomePage from './components/HomePage';
import { GameMode } from './types';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [currentMode, setCurrentMode] = useState<GameMode | null>(null);

  return (
    <ThemeProvider>
      {currentMode === null ? (
        <HomePage onSelectMode={setCurrentMode} />
      ) : currentMode === 'ghost' ? (
        <GhostChessGame mode={currentMode} onBack={() => setCurrentMode(null)} />
      ) : currentMode === 'quantum' ? (
        <QuantumChessGame mode={currentMode} onBack={() => setCurrentMode(null)} />
      ) : (
        <ChessGame mode={currentMode} onBack={() => setCurrentMode(null)} />
      )}
    </ThemeProvider>
  );
}

export default App