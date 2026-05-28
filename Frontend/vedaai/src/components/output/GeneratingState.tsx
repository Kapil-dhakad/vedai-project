'use client';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  status: 'pending' | 'processing';
  progress: number;
  message: string;
}

const STEPS = [
  { pct: 0,  label: 'Job queued' },
  { pct: 20, label: 'Building prompt' },
  { pct: 50, label: 'AI generating...' },
  { pct: 80, label: 'Saving paper' },
  { pct: 100, label: 'Done!' },
];

export default function GeneratingState({ status, progress, message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-violet-500" />
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl bg-violet-400 opacity-20 animate-ping" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {status === 'pending' ? 'Queuing AI Job...' : 'Generating Question Paper'}
      </h2>
      <p className="text-sm text-gray-500 mb-8 text-center max-w-sm">
        {message || 'Our AI is crafting the perfect question paper for your class. This takes 15–30 seconds.'}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="progress-bar mb-2">
          <div
            className="progress-fill"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{message || 'Working...'}</span>
          <span className="font-semibold text-violet-600">{progress}%</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mt-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 transition-all duration-500 ${
                  progress >= step.pct ? 'bg-violet-400' : 'bg-gray-200'
                }`}
              />
            )}
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                progress >= step.pct ? 'bg-violet-500' : 'bg-gray-200'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
        <p className="text-xs text-gray-400">Real-time updates via WebSocket</p>
      </div>
    </div>
  );
}
