import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import ChessPiece from './ChessPiece';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  game: Chess;
  onSquareClick: (square: string) => void;
  selectedPiece: string | null;
  customPieces?: { [square: string]: JSX.Element };
  theme: 'light' | 'dark';
}

export default function ChessBoard({ game, onSquareClick, selectedPiece, customPieces, theme }: ChessBoardProps) {
  const boardRef = useRef();

  // Get legal moves for the selected piece
  const getLegalMoves = () => {
    if (!selectedPiece) return [];
    return game.moves({ square: selectedPiece, verbose: true });
  };

  const renderMoveIndicator = (position: [number, number, number], isCapture: boolean) => (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[isCapture ? 0.4 : 0.2, isCapture ? 0.4 : 0.2, 0.1, 32]} />
      <meshStandardMaterial
        color="#646cff"
        transparent
        opacity={0.5}
        emissive="#646cff"
        emissiveIntensity={0.5}
      />
    </mesh>
  );

  const renderQuantumIndicator = (position: [number, number, number]) => (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshStandardMaterial
          color="#ff00ff"
          transparent
          opacity={0.6}
          emissive="#ff00ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          transparent
          opacity={0.6}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );

  const renderSquare = (file: number, rank: number) => {
    const isLight = (file + rank) % 2 === 0;
    const squareName = `${String.fromCharCode(97 + file)}${8 - rank}`;
    const piece = game.get(squareName);
    const legalMoves = getLegalMoves();
    const isLegalMove = legalMoves.some(move => move.to === squareName);
    const isCapture = legalMoves.some(move => move.to === squareName && move.captured);
    
    return (
      <group key={`${file}-${rank}`}>
        <mesh
          position={[file - 3.5, 0, rank - 3.5]}
          onClick={() => onSquareClick(squareName)}
        >
          <boxGeometry args={[1, 0.2, 1]} />
          <meshStandardMaterial 
            color={isLight 
              ? theme === 'dark' ? '#2a2a3e' : '#f3f4f6'
              : theme === 'dark' ? '#1a1a2e' : '#4b5563'
            }
          />
        </mesh>
        
        {/* Move indicators */}
        {isLegalMove && renderMoveIndicator(
          [file - 3.5, 0.15, rank - 3.5],
          isCapture
        )}

        {/* Quantum move indicators */}
        {selectedPiece && !isLegalMove && renderQuantumIndicator(
          [file - 3.5, 0.15, rank - 3.5]
        )}

        {piece && (
          <ChessPiece
            piece={piece}
            position={[file - 3.5, 0.6, rank - 3.5]}
            isSelected={selectedPiece === squareName}
            customPiece={customPieces?.[squareName]}
          />
        )}
      </group>
    );
  };

  return (
    <div className="w-full h-full aspect-square">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 10, 10]} />
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          minDistance={8}
          maxDistance={16}
        />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <group ref={boardRef}>
          {/* Board frame */}
          <mesh position={[0, -0.2, 0]} receiveShadow>
            <boxGeometry args={[9, 0.4, 9]} />
            <meshStandardMaterial color={theme === 'dark' ? '#1a1a2e' : '#4b5563'} />
          </mesh>
          
          {/* Board squares */}
          {Array.from({ length: 8 }, (_, rank) =>
            Array.from({ length: 8 }, (_, file) => renderSquare(file, rank))
          )}
        </group>
      </Canvas>
    </div>
  );
}