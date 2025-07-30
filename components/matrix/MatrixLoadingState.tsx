'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, Database, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface MatrixLoadingStateProps {
  type: 'amc' | 'sticker';
  stage?: 'fetching' | 'processing' | 'rendering' | 'complete' | 'retrying' | 'rate_limited';
  progress?: number;
  message?: string;
  className?: string;
  retryCount?: number;
  maxRetries?: number;
  estimatedWaitTime?: number; // in seconds
}

const MatrixLoadingState: React.FC<MatrixLoadingStateProps> = ({
  type,
  stage = 'fetching',
  progress,
  message,
  className,
  retryCount = 0,
  maxRetries = 3,
  estimatedWaitTime
}) => {
  const [dots, setDots] = React.useState('');

  // Animated dots effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getStageInfo = () => {
    switch (stage) {
      case 'fetching':
        return {
          icon: <Database className="h-6 w-6 text-blue-600" />,
          title: `Fetching ${type === 'amc' ? 'Payment' : 'Sticker'} Data`,
          description: 'Connecting to Google Sheets and retrieving data...',
          color: 'blue'
        };
      case 'processing':
        return {
          icon: <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />,
          title: 'Processing Data',
          description: 'Transforming and validating data for matrix display...',
          color: 'amber'
        };
      case 'rendering':
        return {
          icon: <RefreshCw className="h-6 w-6 text-green-600 animate-spin" />,
          title: 'Rendering Matrix',
          description: 'Building the matrix interface...',
          color: 'green'
        };
      case 'complete':
        return {
          icon: <RefreshCw className="h-6 w-6 text-green-600" />,
          title: 'Complete',
          description: 'Data loaded successfully',
          color: 'green'
        };
      case 'retrying':
        return {
          icon: <RefreshCw className="h-6 w-6 text-orange-600 animate-spin" />,
          title: `Retrying (${retryCount}/${maxRetries})`,
          description: 'Attempting to reload data after error...',
          color: 'orange'
        };
      case 'rate_limited':
        return {
          icon: <RefreshCw className="h-6 w-6 text-red-600" />,
          title: 'Rate Limited',
          description: estimatedWaitTime 
            ? `Waiting ${estimatedWaitTime}s before retry due to API rate limiting...`
            : 'Waiting due to API rate limiting...',
          color: 'red'
        };
      default:
        return {
          icon: <RefreshCw className="h-6 w-6 text-primary animate-spin" />,
          title: 'Loading',
          description: 'Please wait...',
          color: 'primary'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* Icon with animated background */}
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              stageInfo.color === 'blue' && "bg-blue-100",
              stageInfo.color === 'amber' && "bg-amber-100",
              stageInfo.color === 'green' && "bg-green-100",
              stageInfo.color === 'orange' && "bg-orange-100",
              stageInfo.color === 'red' && "bg-red-100",
              stageInfo.color === 'primary' && "bg-primary/10"
            )}>
              {stageInfo.icon}
            </div>
            
            {/* Pulse animation */}
            <div className={cn(
              "absolute inset-0 w-16 h-16 rounded-full animate-ping opacity-20",
              stageInfo.color === 'blue' && "bg-blue-600",
              stageInfo.color === 'amber' && "bg-amber-600",
              stageInfo.color === 'green' && "bg-green-600",
              stageInfo.color === 'orange' && "bg-orange-600",
              stageInfo.color === 'red' && "bg-red-600",
              stageInfo.color === 'primary' && "bg-primary"
            )} />
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {stageInfo.title}{dots}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {message || stageInfo.description}
            </p>
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete
              </div>
            </div>
          )}

          {/* Stage indicators */}
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              stage === 'fetching' ? "bg-blue-600" : "bg-muted"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              stage === 'processing' ? "bg-amber-600" : "bg-muted"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              (stage === 'rendering' || stage === 'complete') ? "bg-green-600" : "bg-muted"
            )} />
            {(stage === 'retrying' || stage === 'rate_limited') && (
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                stage === 'retrying' ? "bg-orange-600" : stage === 'rate_limited' ? "bg-red-600" : "bg-muted"
              )} />
            )}
          </div>

          {/* Additional info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>This may take a few moments depending on data size</div>
            {stage === 'fetching' && (
              <div className="text-amber-600">
                💡 If this takes too long, check your internet connection
              </div>
            )}
            {stage === 'retrying' && retryCount > 0 && (
              <div className="text-orange-600">
                🔄 Retry attempt {retryCount} of {maxRetries}
              </div>
            )}
            {stage === 'rate_limited' && (
              <div className="text-red-600">
                ⏳ Google Sheets API rate limit reached. Please wait...
              </div>
            )}
            {estimatedWaitTime && estimatedWaitTime > 10 && (
              <div className="text-blue-600">
                ⏱️ Estimated wait time: {Math.round(estimatedWaitTime)}s
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { MatrixLoadingState };