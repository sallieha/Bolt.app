import React, { useState, useEffect } from 'react';
import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from 'lucide-react';

interface EnergyBarProps {
  level: number | null;
  showLabel?: boolean;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (level: number) => void;
  interactive?: boolean;
  className?: string;
  showAverage?: boolean;
  averageLevel?: number;
  recordCount?: number;
}

export function EnergyBar({ 
  level, 
  showLabel = false, 
  showBar = true,
  size = 'md',
  onClick,
  interactive = false,
  className = '',
  showAverage = false,
  averageLevel,
  recordCount
}: EnergyBarProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(level);

  useEffect(() => {
    setSelectedLevel(level);
  }, [level]);

  const getEnergyIcon = (level: number | null) => {
    if (level === null) return <BatteryMedium className="h-5 w-5 text-gray-400" />;
    switch (level) {
      case 1: return <BatteryWarning className="h-5 w-5 text-red-400" />;
      case 2: return <BatteryLow className="h-5 w-5 text-orange-400" />;
      case 3: return <BatteryMedium className="h-5 w-5 text-yellow-400" />;
      case 4: return <BatteryMedium className="h-5 w-5 text-green-400" />;
      case 5: return <BatteryFull className="h-5 w-5 text-green-400" />;
      default: return <BatteryMedium className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEnergyColor = (level: number | null) => {
    if (!level) return 'bg-gray-400/20';
    if (level >= 4.5) return 'bg-green-500';
    if (level >= 3.5) return 'bg-green-400';
    if (level >= 2.5) return 'bg-yellow-400';
    if (level >= 1.5) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getEnergyLabel = (level: number | null) => {
    if (!level) return 'Not Set';
    if (level >= 4.5) return 'Very High';
    if (level >= 3.5) return 'High';
    if (level >= 2.5) return 'Medium';
    if (level >= 1.5) return 'Low';
    return 'Very Low';
  };

  const handleEnergyClick = (newLevel: number) => {
    if (interactive && onClick) {
      setSelectedLevel(newLevel);
      onClick(newLevel);
    }
  };

  const displayLevel = selectedLevel;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {interactive ? (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((l) => (
              <button
                key={l}
                onClick={() => handleEnergyClick(l)}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${
                  displayLevel === l ? 'bg-white/10' : ''
                }`}
              >
                {getEnergyIcon(l)}
              </button>
            ))}
          </div>
        ) : (
          <>
            {getEnergyIcon(displayLevel)}
            {showLabel && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">
                  {getEnergyLabel(displayLevel)}
                </span>
                {showAverage && averageLevel !== undefined && (
                  <span className="text-xs text-gray-500">
                    Avg: {averageLevel.toFixed(1)} ({recordCount} records)
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {showBar && (
        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${getEnergyColor(displayLevel)}`}
            style={{ 
              width: displayLevel ? `${(displayLevel / 5) * 100}%` : '0%',
              transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out'
            }}
          />
          {showAverage && averageLevel && (
            <div 
              className="absolute top-0 h-full w-0.5 bg-white"
              style={{ 
                left: `${(averageLevel / 5) * 100}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}