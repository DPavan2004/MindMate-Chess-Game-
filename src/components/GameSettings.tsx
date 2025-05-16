import React from 'react';
import type { GameSettings } from '../types';
import { Settings, Clock, Bot } from 'lucide-react';

interface GameSettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onShowHint: () => void;
}

export default function GameSettingsPanel({ settings, onSettingsChange, onShowHint }: GameSettingsProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center mb-4">
        <Settings size={20} className="mr-2 text-primary-light dark:text-primary-dark" />
        <h2 className="text-lg font-semibold text-secondary-light dark:text-secondary-dark">
          Game Settings
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center mb-2 text-secondary-light dark:text-secondary-dark">
            <Clock size={16} className="mr-2" />
            <span>Time Control (minutes)</span>
          </label>
          <select
            value={settings.timeControl}
            onChange={(e) => onSettingsChange({ ...settings, timeControl: Number(e.target.value) })}
            className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-secondary-light dark:text-secondary-dark focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:border-transparent transition-colors"
          >
            <option value={0}>No Time Limit</option>
            <option value={5}>5 Minutes</option>
            <option value={10}>10 Minutes</option>
            <option value={15}>15 Minutes</option>
            <option value={30}>30 Minutes</option>
          </select>
        </div>

        <div>
          <button
            onClick={onShowHint}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            Show Best Move
          </button>
        </div>

        <div>
          <label className="flex items-center mb-2 text-secondary-light dark:text-secondary-dark">
            <Bot size={16} className="mr-2" />
            <span>AI Difficulty</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={settings.aiDifficulty}
            onChange={(e) => onSettingsChange({ ...settings, aiDifficulty: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer transition-colors"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Level: {settings.aiDifficulty}
          </div>
        </div>
      </div>
    </div>
  );
}