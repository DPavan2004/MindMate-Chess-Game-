import React from 'react';
import { Cylinder, Box, Cone, Sphere } from '@react-three/drei';
import { Object3D } from 'three';

interface ChessPieceProps {
  piece: {
    type: string;
    color: string;
  };
  position: [number, number, number];
  isSelected: boolean;
  customPiece?: Object3D;
}

export default function ChessPiece({ piece, position, isSelected, customPiece }: ChessPieceProps) {
  if (customPiece) {
    return (
      <group position={position}>
        <primitive object={customPiece.clone()} />
      </group>
    );
  }

  const color = piece.color === 'w' ? '#ffffff' : '#1a1a1a';
  const material = {
    metalness: 0.7,
    roughness: 0.2,
    emissive: isSelected ? '#646cff' : '#000000',
    emissiveIntensity: isSelected ? 0.5 : 0,
  };

  const renderPiece = () => {
    switch (piece.type.toLowerCase()) {
      case 'p': // Pawn
        return (
          <group>
            <Cylinder args={[0.2, 0.25, 0.3, 32]} position={[0, 0.15, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Sphere args={[0.15, 16, 16]} position={[0, 0.35, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Sphere>
          </group>
        );

      case 'r': // Rook
        return (
          <group>
            <Cylinder args={[0.25, 0.3, 0.4, 32]} position={[0, 0.2, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Box args={[0.4, 0.2, 0.4]} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Box>
          </group>
        );

      case 'n': // Knight
        return (
          <group>
            <Cylinder args={[0.25, 0.3, 0.3, 32]} position={[0, 0.15, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Box args={[0.2, 0.4, 0.15]} position={[0, 0.45, 0.1]} rotation={[Math.PI / 6, 0, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Box>
          </group>
        );

      case 'b': // Bishop
        return (
          <group>
            <Cylinder args={[0.25, 0.3, 0.3, 32]} position={[0, 0.15, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Cone args={[0.2, 0.5, 32]} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cone>
            <Sphere args={[0.1, 16, 16]} position={[0, 0.8, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Sphere>
          </group>
        );

      case 'q': // Queen
        return (
          <group>
            <Cylinder args={[0.25, 0.35, 0.3, 32]} position={[0, 0.15, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 0.5, 32]} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Sphere args={[0.15, 16, 16]} position={[0, 0.8, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Sphere>
          </group>
        );

      case 'k': // King
        return (
          <group>
            <Cylinder args={[0.25, 0.35, 0.3, 32]} position={[0, 0.15, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Cylinder args={[0.2, 0.2, 0.6, 32]} position={[0, 0.55, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Cylinder>
            <Box args={[0.15, 0.3, 0.15]} position={[0, 0.95, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Box>
            <Box args={[0.3, 0.15, 0.15]} position={[0, 0.95, 0]}>
              <meshStandardMaterial {...material} color={color} />
            </Box>
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <group position={position} scale={[0.8, 0.8, 0.8]}>
      {renderPiece()}
    </group>
  );
}