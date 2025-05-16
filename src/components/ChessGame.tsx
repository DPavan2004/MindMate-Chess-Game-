import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Undo2, Redo2, RotateCcw, Download, Home } from 'lucide-react';
import { GameMode, GameState } from '../types';
import GameSettingsPanel from './GameSettings';
import ThemeToggle from './ThemeToggle';
import type { GameSettings } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ChessGameProps {
  mode: GameMode;
  onBack: () => void;
}

export default function ChessGame({ mode, onBack }: ChessGameProps) {
  const { theme } = useTheme();
  const [game, setGame] = useState(new Chess());
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [settings, setSettings] = useState<GameSettings>({
    aiDifficulty: 5,
    timeControl: 0,
    showHints: false,
  });
  const [timeLeft, setTimeLeft] = useState({ white: 0, black: 0 });
  const [evaluation, setEvaluation] = useState<number>(0);
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestMove, setBestMove] = useState<{ from: string; to: string } | null>(null);
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
    updateGameHistory();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

  const updateGameHistory = () => {
    const newHistory = {
      fen: game.fen(),
      pgn: game.pgn(),
      moves: game.history(),
      evaluation,
    };
    setGameHistory(prev => [...prev.slice(0, currentHistoryIndex + 1), newHistory]);
    setCurrentHistoryIndex(prev => prev + 1);
  };

  const makeAIMove = useCallback(() => {
    if (mode !== 'ai' || game.isGameOver() || isGameOver) return;

    const possibleMoves = game.moves();
    if (possibleMoves.length > 0) {
      const thinkingTime = Math.max(300, settings.aiDifficulty * 200);
      setTimeout(() => {
        const moves = possibleMoves.map(move => {
          const testGame = new Chess(game.fen());
          testGame.move(move);
          const score = evaluatePosition(testGame);
          return { move, score };
        });
        
        moves.sort((a, b) => b.score - a.score);
        const topMoves = moves.slice(0, 3);
        const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
        
        game.move(selectedMove.move);
        setGame(new Chess(game.fen()));
        setCurrentPlayer(game.turn());
        updateGameHistory();
        
        if (game.isGameOver()) {
          setIsGameOver(true);
        }
        
        setEvaluation(prev => prev + (Math.random() * 0.5 - 0.25));
      }, thinkingTime);
    }
  }, [game, mode, settings.aiDifficulty, isGameOver]);

  const evaluatePosition = (position: Chess) => {
    const pieceValues = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0
    };
    
    let score = 0;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = position.get(String.fromCharCode(97 + i) + (j + 1));
        if (piece) {
          const value = pieceValues[piece.type.toLowerCase() as keyof typeof pieceValues];
          score += piece.color === 'w' ? value : -value;
        }
      }
    }
    
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    centerSquares.forEach(square => {
      const piece = position.get(square);
      if (piece) {
        score += piece.color === 'w' ? 0.3 : -0.3;
      }
    });
    
    return score;
  };

  const calculateBestMove = () => {
    if (game.isGameOver() || isGameOver) return null;

    const possibleMoves = game.moves({ verbose: true });
    if (possibleMoves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove = null;

    for (const move of possibleMoves) {
      const testGame = new Chess(game.fen());
      testGame.move(move);
      
      // Evaluate position after move
      let score = 0;
      
      // Material value
      const pieces = testGame.board().flat().filter(piece => piece !== null);
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      
      for (const piece of pieces) {
        if (piece) {
          const value = pieceValues[piece.type as keyof typeof pieceValues];
          score += piece.color === currentPlayer ? value : -value;
        }
      }
      
      // Center control
      const centerSquares = ['d4', 'd5', 'e4', 'e5'];
      for (const square of centerSquares) {
        const piece = testGame.get(square);
        if (piece && piece.color === currentPlayer) {
          score += 0.3;
        }
      }
      
      // Check
      if (testGame.isCheck()) {
        score += 0.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove ? { from: bestMove.from, to: bestMove.to } : null;
  };

  const handleShowHint = () => {
    const move = calculateBestMove();
    setBestMove(move);
    setTimeout(() => setBestMove(null), 3000);
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
          setGame(new Chess(game.fen()));
          setCurrentPlayer(game.turn());
          updateGameHistory();
          
          if (game.isGameOver()) {
            setIsGameOver(true);
          } else if (mode === 'ai' && !game.isGameOver()) {
            setTimeout(makeAIMove, 300);
          }
        }
      }
      setSelectedSquare(null);
    } else if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isGameOver) return false;
    
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;
      
      setGame(new Chess(game.fen()));
      setCurrentPlayer(game.turn());
      setSelectedSquare(null);
      updateGameHistory();

      if (game.isGameOver()) {
        setIsGameOver(true);
      } else if (mode === 'ai' && !game.isGameOver()) {
        setTimeout(makeAIMove, 300);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  const customDarkSquareStyle = {
    backgroundColor: theme === 'dark' ? '#262421' : '#4b5563',
  };

  const customLightSquareStyle = {
    backgroundColor: theme === 'dark' ? '#f3f4f6' : '#f3f4f6',
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

  const getPossibleMoves = () => {
    const styles: Record<string, { background: string }> = {};

    if (bestMove) {
      styles[bestMove.from] = {
        background: 'rgba(75, 181, 67, 0.4)',
        borderRadius: '8px',
      };
      styles[bestMove.to] = {
        background: 'rgba(75, 181, 67, 0.4)',
        borderRadius: '50%',
      };
      return styles;
    }

    if (!selectedSquare) return {};

    const moves = game.moves({ square: selectedSquare, verbose: true });
    moves.forEach((move) => {
      styles[move.to] = {
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(66, 153, 225, 0.4) 0%, rgba(66, 153, 225, 0.2) 70%)'
          : 'radial-gradient(circle, rgba(49, 130, 206, 0.4) 0%, rgba(49, 130, 206, 0.2) 70%)',
        borderRadius: '50%',
      };
    });

    styles[selectedSquare] = {
      background: theme === 'dark'
        ? 'rgba(66, 153, 225, 0.3)'
        : 'rgba(49, 130, 206, 0.3)',
      borderRadius: '8px',
    };

    return styles;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="flex items-center px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <Home size={20} className="mr-2" /> Menu
              </button>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
                Chess Master - {mode.toUpperCase()} Mode
              </h1>
            </div>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 dark:bg-blue-500 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-blue-400 dark:bg-blue-300 transition-all duration-300"
                    style={{
                      height: `${50 + evaluation * 5}%`,
                    }}
                  />
                </div>
                
                <div className="w-full aspect-square ml-6" style={boardWrapper}>
                  <Chessboard
                    position={game.fen()}
                    onPieceDrop={onDrop}
                    onSquareClick={onSquareClick}
                    customSquareStyles={getPossibleMoves()}
                    customDarkSquareStyle={customDarkSquareStyle}
                    customLightSquareStyle={customLightSquareStyle}
                    boardOrientation="white"
                    animationDuration={200}
                  />
                </div>
              </div>

              {isGameOver && (
                <div className="mt-6 p-6 bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-blue-200 dark:border-blue-900 text-center transform transition-all duration-300">
                  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3">Game Over!</h2>
                  <p className="text-xl text-gray-700 dark:text-gray-300">{getGameStatus()}</p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div className="text-xl font-medium text-center text-gray-700 dark:text-gray-300">
                  {getGameStatus()}
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={undoMove}
                    disabled={currentHistoryIndex <= 0 || isGameOver}
                    className="flex items-center px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <Undo2 size={20} className="mr-2" /> Undo
                  </button>
                  <button
                    onClick={redoMove}
                    disabled={currentHistoryIndex >= gameHistory.length - 1 || isGameOver}
                    className="flex items-center px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <Redo2 size={20} className="mr-2" /> Redo
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex items-center px-5 py-2.5 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <RotateCcw size={20} className="mr-2" /> Reset
                  </button>
                  <button
                    onClick={downloadPGN}
                    className="flex items-center px-5 py-2.5 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                  >
                    <Download size={20} className="mr-2" /> Export PGN
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GameSettingsPanel 
                settings={settings} 
                onSettingsChange={setSettings}
                onShowHint={handleShowHint}
              />

              {settings.timeControl > 0 && (
                <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-blue-200 dark:border-blue-900">
                  <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Time Control</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl transition-all duration-300 ${
                      currentPlayer === 'w'
                        ? 'bg-blue-500 dark:bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <div className="text-sm font-medium mb-1">White</div>
                      <div className="text-2xl font-mono font-bold">
                        {Math.floor(timeLeft.white / 60)}:
                        {(timeLeft.white % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl transition-all duration-300 ${
                      currentPlayer === 'b'
                        ? 'bg-blue-500 dark:bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700'
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

              <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-blue-200 dark:border-blue-900">
                <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Move History</h2>
                <div className="h-64 overflow-y-auto rounded-xl">
                  {gameHistory[currentHistoryIndex]?.moves.map((move, index) => (
                    <div
                      key={index}
                      className={`py-2 px-4 ${
                        index % 2 === 0
                          ? 'bg-gray-50 dark:bg-gray-700/50'
                          : 'bg-white/50 dark:bg-gray-800/50'
                      }`}
                    >
                      {Math.floor(index / 2) + 1}. {move}
                    </div>
                  ))}
                </div>
              </div>
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

  function undoMove() {
    if (isGameOver || currentHistoryIndex <= 0) return;
    setCurrentHistoryIndex(prev => prev - 1);
    const previousState = gameHistory[currentHistoryIndex - 1];
    const newGame = new Chess(previousState.fen);
    setGame(newGame);
    setCurrentPlayer(newGame.turn());
    setSelectedSquare(null);
  }

  function redoMove() {
    if (isGameOver || currentHistoryIndex >= gameHistory.length - 1) return;
    setCurrentHistoryIndex(prev => prev + 1);
    const nextState = gameHistory[currentHistoryIndex + 1];
    const newGame = new Chess(nextState.fen);
    setGame(newGame);
    setCurrentPlayer(newGame.turn());
    setSelectedSquare(null);
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setGameHistory([]);
    setCurrentHistoryIndex(-1);
    setEvaluation(0);
    setCurrentPlayer('w');
    setSelectedSquare(null);
    setIsGameOver(false);
    if (settings.timeControl > 0) {
      setTimeLeft({
        white: settings.timeControl * 60,
        black: settings.timeControl * 60,
      });
    }
    updateGameHistory();
  }

  function downloadPGN() {
    const element = document.createElement('a');
    const file = new Blob([game.pgn()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'chess-game.pgn';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}