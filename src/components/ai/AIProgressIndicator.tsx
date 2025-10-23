import { Brain, Eye, TrendingUp, Database, Lightbulb, BarChart3, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ProgressStage =
  | 'thinking'
  | 'context'
  | 'analyzing'
  | 'querying'
  | 'generating'
  | 'visualizing'
  | 'finalizing'
  | 'complete';

interface AIProgressIndicatorProps {
  stage: ProgressStage;
  progress?: number;
  customMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

const stageConfig = {
  thinking: {
    icon: Brain,
    message: 'Quartile AI is thinking...',
    color: '#00ABAE',
    animation: 'pulse',
  },
  context: {
    icon: Eye,
    message: 'Understanding context...',
    color: '#8B5CF6',
    animation: 'scan',
  },
  analyzing: {
    icon: TrendingUp,
    message: 'Analyzing data patterns...',
    color: '#10B981',
    animation: 'wave',
  },
  querying: {
    icon: Database,
    message: 'Querying database...',
    color: '#F59E0B',
    animation: 'dots',
  },
  generating: {
    icon: Lightbulb,
    message: 'Generating insights...',
    color: '#EF4444',
    animation: 'glow',
  },
  visualizing: {
    icon: BarChart3,
    message: 'Creating visualization...',
    color: '#00ABAE',
    animation: 'build',
  },
  finalizing: {
    icon: CheckCircle,
    message: 'Finalizing results...',
    color: '#10B981',
    animation: 'fade',
  },
  complete: {
    icon: CheckCircle,
    message: 'Analysis complete',
    color: '#10B981',
    animation: 'none',
  },
};

export function AIProgressIndicator({
  stage,
  progress = 0,
  customMessage,
  size = 'md'
}: AIProgressIndicatorProps) {
  const [dots, setDots] = useState('');
  const config = stageConfig[stage];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { container: 'p-4', icon: 20, text: 'text-sm' },
    md: { container: 'p-6', icon: 28, text: 'text-base' },
    lg: { container: 'p-8', icon: 36, text: 'text-lg' },
  };

  const currentSize = sizeClasses[size];

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getAnimationClass = () => {
    switch (config.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'scan':
        return 'animate-bounce';
      case 'wave':
        return 'animate-pulse';
      case 'dots':
        return '';
      case 'glow':
        return 'animate-pulse';
      case 'build':
        return 'animate-bounce';
      case 'fade':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${currentSize.container} flex flex-col items-center justify-center space-y-4 shadow-sm`}>
      <div className="relative">
        <div
          className={`rounded-full p-4 ${getAnimationClass()}`}
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon
            size={currentSize.icon}
            strokeWidth={1}
            style={{ color: config.color }}
            className="transition-all duration-300"
          />
        </div>

        {config.animation === 'glow' && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse"
            style={{ backgroundColor: config.color }}
          />
        )}
      </div>

      <div className="text-center space-y-2">
        <p className={`font-medium text-gray-900 ${currentSize.text}`}>
          {customMessage || config.message}
          {stage !== 'complete' && <span className="inline-block w-6 text-left">{dots}</span>}
        </p>

        {progress > 0 && stage !== 'complete' && (
          <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: config.color
              }}
            />
          </div>
        )}
      </div>

      {stage !== 'complete' && (
        <div className="flex gap-2">
          {['thinking', 'context', 'analyzing', 'querying', 'generating', 'visualizing', 'finalizing'].map((s, idx) => {
            const isPast = ['thinking', 'context', 'analyzing', 'querying', 'generating', 'visualizing', 'finalizing'].indexOf(stage) > idx;
            const isCurrent = s === stage;

            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isPast
                    ? 'bg-green-500 scale-100'
                    : isCurrent
                    ? 'scale-125 animate-pulse'
                    : 'bg-gray-300 scale-75'
                }`}
                style={{
                  backgroundColor: isCurrent ? config.color : isPast ? '#10B981' : '#E5E7EB'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MultiStageProgressProps {
  stages: Array<{
    stage: ProgressStage;
    message?: string;
    duration?: number;
  }>;
  onComplete?: () => void;
}

export function MultiStageProgress({ stages, onComplete }: MultiStageProgressProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStageIndex >= stages.length) {
      onComplete?.();
      return;
    }

    const currentStage = stages[currentStageIndex];
    const duration = currentStage.duration || 1000;
    const steps = 20;
    const stepDuration = duration / steps;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          setCurrentStageIndex(idx => idx + 1);
          return 0;
        }
        return prev + 1 / steps;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, [currentStageIndex, stages, onComplete]);

  if (currentStageIndex >= stages.length) {
    return null;
  }

  const currentStage = stages[currentStageIndex];

  return (
    <AIProgressIndicator
      stage={currentStage.stage}
      progress={progress}
      customMessage={currentStage.message}
      size="md"
    />
  );
}
