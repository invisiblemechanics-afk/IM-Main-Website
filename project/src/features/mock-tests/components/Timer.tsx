import React, { useState, useEffect } from 'react';
import { Clock, Pause, Play } from 'lucide-react';

interface TimerProps {
  totalSec: number;
  onElapsed?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  showControls?: boolean;
}

export default function Timer({ 
  totalSec, 
  onElapsed, 
  isPaused = false, 
  onTogglePause,
  showControls = false 
}: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSec);

  useEffect(() => {
    setRemainingSeconds(totalSec);
  }, [totalSec]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          onElapsed?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, isPaused, onElapsed]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (remainingSeconds / totalSec) * 100;
    if (percentage <= 10) return 'text-red-600';
    if (percentage <= 25) return 'text-orange-600';
    return 'text-gray-700';
  };

  const getBackgroundColor = () => {
    const percentage = (remainingSeconds / totalSec) * 100;
    if (percentage <= 10) return 'bg-red-50 border-red-200';
    if (percentage <= 25) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${getBackgroundColor()} transition-colors duration-300`}>
      <Clock className={`w-4 h-4 ${getTimeColor()}`} />
      <span className={`font-mono text-sm font-medium ${getTimeColor()}`}>
        {formatTime(remainingSeconds)}
      </span>
      
      {showControls && onTogglePause && (
        <button
          onClick={onTogglePause}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 text-gray-600" />
          ) : (
            <Pause className="w-3 h-3 text-gray-600" />
          )}
        </button>
      )}
      
      {remainingSeconds <= 0 && (
        <span className="text-xs text-red-600 font-medium animate-pulse">
          Time's up!
        </span>
      )}
    </div>
  );
}
