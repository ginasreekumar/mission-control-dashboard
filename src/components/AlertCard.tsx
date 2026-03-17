'use client';

import { DashboardAlert } from '@/lib/types';

interface AlertCardProps {
  alert: DashboardAlert;
}

const levelColors = {
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-700',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700',
  error: 'bg-red-500/10 border-red-500/20 text-red-700',
  success: 'bg-green-500/10 border-green-500/20 text-green-700',
};

const levelIcons = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
};

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${levelColors[alert.level]} ${
      alert.acknowledged ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{levelIcons[alert.level]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{alert.title}</h3>
            {!alert.acknowledged && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-sm mt-1 opacity-90">{alert.message}</p>
          <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
            <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
            {alert.source && <span>• {alert.source}</span>}
            {alert.acknowledged && <span>• Acknowledged</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
