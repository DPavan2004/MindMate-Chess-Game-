import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Atom, Home, Waves, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameMode, GameSettings, QuantumState, EntangledPair } from '../types';
import GameSettingsPanel from './GameSettings';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import ChessBoard from './3D/ChessBoard';

interface QuantumChessGameProps {
  mode: GameMode;
  onBack: () => void;
}

export default function QuantumChessGame({ mode, onBack }: QuantumChessGameProps) {
  const { theme } = useTheme();
  const [game, setGame] = useState(new Chess());
  const [quantumStates, setQuantumStates] = useState<QuantumState[]>([]);
  const [entangledPairs, setEntangledPairs] = useState<EntangledPair[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [isQuantumMode, setIsQuantumMode] = useState(false);
  const [isEntangleMode, setIsEntangleMode] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    aiDifficulty: 5,
    timeControl: 10,
    showHints: false,
    ghostRevealPowerups: 0,
  });
  const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
  const [isGameOver, setIsGameOver] = useState(false);

  const createQuantumState = (square: string, piece: any): QuantumState => ({
    square,
    probability: 1,
    piece: {
      type: piece.type,
      color: piece.color,
    },
  });

  const handleQuantumMove = (from: string, to: string) => {
    // Prevent moving to the same square
    if (from === to) return;

    const piece = game.get(from);
    if (!piece) return;

    // Validate the move is legal in classical chess
    const legalMoves = game.moves({ square: from, verbose: true });
    const isLegalMove = legalMoves.some(move => move.to === to);

    if (!isLegalMove && !isQuantumMode) return;

    const newQuantumState = createQuantumState(to, piece);
    setQuantumStates(prev => [...prev, newQuantumState]);

    // Create superposition effect with varying probabilities
    const probability = Math.random() * 0.5 + 0.5; // Probability between 0.5 and 1
    newQuantumState.probability = probability;

    try {
      // Only make the actual move if not in quantum mode or if it's a legal classical move
      if (!isQuantumMode || isLegalMove) {
        const move = game.move({
          from,
          to,
          promotion: 'q',
        });

        if (move) {
          setGame(new Chess(game.fen()));
          setCurrentPlayer(game.turn());
          
          if (game.isGameOver()) {
            setIsGameOver(true);
          }
        }
      } else {
        // In quantum mode, just update the current player
        setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
      }
    } catch (error) {
      console.error('Invalid move:', error);
      return;
    }
    setSelectedPiece(null);
  };

  const handleEntanglement = (square: string) => {
    const piece = game.get(square);
    if (!piece) return;

    // Prevent self-entanglement
    if (selectedPiece === square) {
      setSelectedPiece(null);
      return;
    }

    if (!selectedPiece) {
      setSelectedPiece(square);
    } else {
      const piece1 = createQuantumState(selectedPiece, game.get(selectedPiece));
      const piece2 = createQuantumState(square, piece);

      // Check if either piece is already entangled
      const isAlreadyEntangled = entangledPairs.some(
        pair => 
          pair.piece1.square === selectedPiece || 
          pair.piece2.square === selectedPiece ||
          pair.piece1.square === square ||
          pair.piece2.square === square
      );

      if (!isAlreadyEntangled) {
        setEntangledPairs(prev => [...prev, { piece1, piece2 }]);
      }
      setSelectedPiece(null);
    }
  };

  function onSquareClick(square: string) {
    if (isGameOver) return;
    
    if (isEntangleMode) {
      handleEntanglement(square);
      return;
    }

    const piece = game.get(square);
    
    if (selectedPiece) {
      if (selectedPiece === square) {
        // Clicking the same square deselects the piece
        setSelectedPiece(null);
        return;
      }

      if (isQuantumMode) {
        handleQuantumMove(selectedPiece, square);
      } else {
        const moves = game.moves({ square: selectedPiece, verbose: true });
        const isLegalMove = moves.some(move => move.to === square);

        if (isLegalMove) {
          try {
            const move = game.move({
              from: selectedPiece,
              to: square,
              promotion: 'q',
            });

            if (move) {
              setGame(new Chess(game.fen()));
              setCurrentPlayer(game.turn());
              
              if (game.isGameOver()) {
                setIsGameOver(true);
              }
            }
          } catch (error) {
            console.error('Invalid move:', error);
          }
        }
      }
      setSelectedPiece(null);
    } else if (piece && piece.color === currentPlayer) {
      setSelectedPiece(square);
    }
  }

  const customPieces = () => {
    const pieces: { [square: string]: JSX.Element } = {};
    
    // Add quantum effects to pieces
    quantumStates.forEach(state => {
      pieces[state.square] = (
        <motion.div
          className="w-full h-full"
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative w-full h-full">
            <Atom className="absolute inset-0 w-full h-full text-blue-400 opacity-50" />
          </div>
        </motion.div>
      );
    });

    // Add entanglement effects
    entangledPairs.forEach(pair => {
      pieces[pair.piece1.square] = (
        <motion.div
          className="w-full h-full"
          animate={{
            opacity: [0.6, 1, 0.6],
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="relative w-full h-full">
            <Link2 className="absolute inset-0 w-full h-full text-purple-400 opacity-70" />
          </div>
        </motion.div>
      );
      pieces[pair.piece2.square] = (
        <motion.div
          className="w-full h-full"
          animate={{
            opacity: [0.6, 1, 0.6],
            rotate: [0, -360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="relative w-full h-full">
            <Link2 className="absolute inset-0 w-full h-full text-purple-400 opacity-70" />
          </div>
        </motion.div>
      );
    });

    return pieces;
  };

  const boardWrapper = {
    borderRadius: '16px',
    boxShadow: theme === 'dark'
      ? '0 0 40px rgba(147, 51, 234, 0.2), 0 0 20px rgba(147, 51, 234, 0.1)'
      : '0 25px 50px -12px rgba(147, 51, 234, 0.25)',
    border: theme === 'dark'
      ? '3px solid rgba(147, 51, 234, 0.3)'
      : '3px solid rgba(147, 51, 234, 0.5)',
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
                Quantum Chess
              </h1>
            </div>
            <ThemeToggle />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="relative">
                <div className="w-full aspect-square" style={boardWrapper}>
                  <ChessBoard
                    game={game}
                    onSquareClick={onSquareClick}
                    selectedPiece={selectedPiece}
                    customPieces={customPieces()}
                    theme={theme}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setIsQuantumMode(!isQuantumMode)}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    isQuantumMode
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Waves size={20} className="mr-2" />
                  Quantum Mode {isQuantumMode ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setIsEntangleMode(!isEntangleMode)}
                  className={`flex items-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    isEntangleMode
                      ? 'bg-purple-500 hover:bg-purple-600'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Link2 size={20} className="mr-2" />
                  Entangle Mode {isEntangleMode ? 'ON' : 'OFF'}
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
              <div className="p-6 rounded-2xl bg-purple-900/30 backdrop-blur-md">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Quantum States</h2>
                <div className="space-y-4">
                  {quantumStates.map((state, index) => (
                    <div key={index} className="p-4 bg-purple-800/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>{state.square}</span>
                        <span>{Math.round(state.probability * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-purple-900/30 backdrop-blur-md">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Entangled Pairs</h2>
                <div className="space-y-4">
                  {entangledPairs.map((pair, index) => (
                    <div key={index} className="p-4 bg-purple-800/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>{pair.piece1.square}</span>
                        <Link2 size={16} className="mx-2" />
                        <span>{pair.piece2.square}</span>
                      </div>
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
    if (game.isCheck()) return 'Check!';
    return `${currentPlayer === 'w' ? 'White' : 'Black'} to move`;
  }
}