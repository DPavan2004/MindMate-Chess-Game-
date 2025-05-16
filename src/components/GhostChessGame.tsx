import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Ghost, Home, Eye } from 'lucide-react';
import { GameMode, GameState, GameSettings } from '../types';
import GameSettingsPanel from './GameSettings';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

interface GhostChessGameProps {
  mode: GameMode;
  onBack: () => void;
}

export default function GhostChessGame({ mode, onBack }: GhostChessGameProps) {
  const { theme } = useTheme();
  const [game, setGame] = useState(new Chess());
  const [visiblePieces, setVisiblePieces] = useState<Set<string>>(new Set());
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    aiDifficulty: 5,
    timeControl: 10,
    showHints: false,
    ghostRevealPowerups: 3,
  });
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 600 });
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [lastCapture, setLastCapture] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (settings.timeControl > 0) {
      setTimeLeft({
        white: settings.timeControl * 60,
        black: settings.timeControl * 60,
      });
    }
  }, [settings.timeControl]);

  useEffect(() => {
    if (settings.timeControl > 0 && !isGameOver) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const currentTime = prev[currentPlayer === 'w' ? 'white' : 'black'];
          if (currentTime <= 0) {
            clearInterval(timerRef.current!);
            setIsGameOver(true);
            return prev;
          }
          return {
            ...prev,
            [currentPlayer === 'w' ? 'white' : 'black']: Math.max(0, currentTime - 1)
          };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentPlayer, settings.timeControl, isGameOver]);

  const updateVisiblePieces = useCallback(() => {
    const newVisiblePieces = new Set<string>();
    const board = game.board();

    // Add pieces in attack range
    board.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece && piece.color === currentPlayer) {
          const square = String.fromCharCode(97 + j) + (8 - i);
          newVisiblePieces.add(square);

          // Add squares that this piece can attack
          const moves = game.moves({ square, verbose: true });
          moves.forEach(move => {
            if (game.get(move.to)) {
              newVisiblePieces.add(move.to);
            }
          });
        }
      });
    });

    // Keep last captured piece visible briefly
    if (lastCapture) {
      newVisiblePieces.add(lastCapture);
      setTimeout(() => setLastCapture(null), 1000);
    }

    setVisiblePieces(newVisiblePieces);
  }, [game, currentPlayer, lastCapture]);

  useEffect(() => {
    updateVisiblePieces();
  }, [updateVisiblePieces]);

  const customPieces = () => {
    const pieces: { [square: string]: JSX.Element } = {};
    const board = game.board();

    board.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const square = String.fromCharCode(97 + j) + (8 - i);
          if (!visiblePieces.has(square) && !isRevealing) {
            pieces[square] = (
              <div className="w-full h-full flex items-center justify-center">
                <Ghost className="w-3/4 h-3/4 text-gray-400 dark:text-gray-600" />
              </div>
            );
          }
        }
      });
    });

    return pieces;
  };

  function onSquareClick(square: string) {
    if (isGameOver) return;
    
    const piece = game.get(square);
    
    if (selectedSquare) {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const isLegalMove = moves.some(move => move.to === square);

      if (isLegalMove) {
        const move = game.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          if (move.captured) {
            setLastCapture(square);
          }
          setGame(new Chess(game.fen()));
          setCurrentPlayer(game.turn());
          updateVisiblePieces();
          
          if (game.isGameOver()) {
            setIsGameOver(true);
          } else if (mode === 'ai' && !game.isGameOver()) {
            setTimeout(makeAIMove, 300);
          }
        }
      }
      setSelectedSquare(null);
    } else if (piece && piece.color === currentPlayer) {
      setSelectedSquare(square);
    }
  }

  const makeAIMove = useCallback(() => {
    if (mode !== 'ai' || game.isGameOver() || isGameOver) return;

    const possibleMoves = game.moves();
    if (possibleMoves.length > 0) {
      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      game.move(move);
      setGame(new Chess(game.fen()));
      setCurrentPlayer(game.turn());
      updateVisiblePieces();
      
      if (game.isGameOver()) {
        setIsGameOver(true);
      }
    }
  }, [game, mode, isGameOver, updateVisiblePieces]);

  const handleGhostReveal = () => {
    if (settings.ghostRevealPowerups > 0) {
      setIsRevealing(true);
      setSettings(prev => ({
        ...prev,
        ghostRevealPowerups: prev.ghostRevealPowerups - 1
      }));
      setTimeout(() => setIsRevealing(false), 2000);
    }
  };

  const customDarkSquareStyle = {
    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#4a5568',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M0 0h20L0 20z"/%3E%3C/g%3E%3C/svg%3E")',
  };

  const customLightSquareStyle = {
    backgroundColor: theme === 'dark' ? '#2a2a3e' : '#edf2f7',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M20 0v20H0z"/%3E%3C/g%3E%3C/svg%3E")',
  };

  const boardWrapper = {
    borderRadius: '16px',
    boxShadow: theme === 'dark'
      ? '0 0 40px rgba(66, 153, 225, 0.1), 0 0 20px rgba(66, 153, 225, 0.1), 0 0 10px rgba(66, 153, 225, 0.1)'
      : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: theme === 'dark'
      ? '3px solid rgba(66, 153, 225, 0.2)'
      : '3px solid rgba(66, 153, 225, 0.4)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <Home size={20} className="mr-2" /> Menu
              </button>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                Ghost Chess
              </h1>
            </div>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="relative">
                <div className="w-full aspect-square" style={boardWrapper}>
                  <Chessboard
                    position={game.fen()}
                    onSquareClick={onSquareClick}
                    customDarkSquareStyle={customDarkSquareStyle}
                    customLightSquareStyle={customLightSquareStyle}
                    customPieces={customPieces}
                    boardOrientation="white"
                    animationDuration={200}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handleGhostReveal}
                  disabled={settings.ghostRevealPowerups === 0}
                  className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Eye size={20} className="mr-2" />
                  Reveal Board ({settings.ghostRevealPowerups} left)
                </button>
              </div>

              {isGameOver && (
                <div className="mt-6 p-6 bg-purple-900/50 backdrop-blur-lg rounded-2xl text-center">
                  <h2 className="text-3xl font-bold text-purple-400 mb-3">Game Over!</h2>
                  <p className="text-xl text-gray-300">{getGameStatus()}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GameSettingsPanel 
                settings={settings} 
                onSettingsChange={setSettings}
                onShowHint={() => {}}
              />

              {settings.timeControl > 0 && (
                <div className="p-6 rounded-2xl bg-purple-900/30 backdrop-blur-md">
                  <h2 className="text-2xl font-bold mb-4 text-purple-400">Time Control</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl ${
                      currentPlayer === 'w'
                        ? 'bg-purple-600'
                        : 'bg-gray-700'
                    }`}>
                      <div className="text-sm font-medium mb-1">White</div>
                      <div className="text-2xl font-mono font-bold">
                        {Math.floor(timeLeft.white / 60)}:
                        {(timeLeft.white % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${
                      currentPlayer === 'b'
                        ? 'bg-purple-600'
                        : 'bg-gray-700'
                    }`}>
                      <div className="text-sm font-medium mb-1">Black</div>
                      <div className="text-2xl font-mono font-bold">
                        {Math.floor(timeLeft.black / 60)}:
                        {(timeLeft.black % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function getGameStatus() {
    if (game.isCheckmate()) return 'Checkmate!';
    if (game.isDraw()) return 'Draw';
    if (game.isStalemate()) return 'Stalemate';
    if (game.isThreefoldRepetition()) return 'Draw by repetition';
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material';
    if (timeLeft[currentPlayer === 'w' ? 'white' : 'black'] <= 0) return `${currentPlayer === 'w' ? 'Black' : 'White'} wins on time!`;
    if (game.isCheck()) return 'Check!';
    return `${currentPlayer === 'w' ? 'White' : 'Black'} to move`;
  }
}