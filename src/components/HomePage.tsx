import React from 'react';
import { GameMode } from '../types';
import { Users, Bot, Brain, Ghost, Atom } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface HomePageProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function HomePage({ onSelectMode }: HomePageProps) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark transition-colors">
      <div className="container mx-auto px-4 py-16">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-8 text-primary-light dark:text-primary-dark">
            Welcome to Mind Mate
          </h1>
          <p className="text-xl text-secondary-light dark:text-secondary-dark mb-12">
            Choose your preferred game mode to begin
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {['quantum', 'ghost', 'ai', 'local', 'analysis'].map((mode) => (
              <button
                key={mode}
                onClick={() => onSelectMode(mode as GameMode)}
                className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col items-center">
                  {mode === 'ai' && <Bot size={48} className="text-primary-light dark:text-primary-dark mb-4" />}
                  {mode === 'local' && <Users size={48} className="text-primary-light dark:text-primary-dark mb-4" />}
                  {mode === 'analysis' && <Brain size={48} className="text-primary-light dark:text-primary-dark mb-4" />}
                  {mode === 'ghost' && <Ghost size={48} className="text-purple-500 dark:text-purple-400 mb-4" />}
                  {mode === 'quantum' && <Atom size={48} className="text-blue-500 dark:text-blue-400 mb-4" />}
                  <h2 className="text-2xl font-semibold text-secondary-light dark:text-secondary-dark mb-2">
                    {mode === 'ai' && 'AI Mode'}
                    {mode === 'local' && 'Local Play'}
                    {mode === 'analysis' && 'Analysis Mode'}
                    {mode === 'ghost' && 'Ghost Chess'}
                    {mode === 'quantum' && 'Quantum Chess'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {mode === 'ai' && 'Play against the computer'}
                    {mode === 'local' && 'Play against a friend'}
                    {mode === 'analysis' && 'Analyze your moves'}
                    {mode === 'ghost' && 'Can you play blind?'}
                    {mode === 'quantum' && 'Superposition & Entanglement'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}