'use client';

import { useState, useEffect } from 'react';
import { Radio, Database, AlertCircle } from 'lucide-react';

interface DataFreshnessProps {
  lastUpdated?: string | null;
  dataSource?: 'live' | 'static' | 'bridge' | null;
}

function formatFreshnessTime(timestamp?: string | null): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    let relative = '';
    if (diffSecs < 60) {
      relative = 'just now';
    } else if (diffMins < 60) {
      relative = `${diffMins} min ago`;
    } else if (diffHours < 24) {
      relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      relative = 'yesterday';
    } else if (diffDays < 7) {
      relative = `${diffDays} days ago`;
    } else {
      relative = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return `${timeStr} · ${relative}`;
  } catch {
    return 'Unknown';
  }
}

export function DataFreshness({ lastUpdated, dataSource }: DataFreshnessProps) {
  const [displayTime, setDisplayTime] = useState<string>('');
  
  useEffect(() => {
    const updateDisplay = () => {
      setDisplayTime(formatFreshnessTime(lastUpdated));
    };
    
    updateDisplay();
    const interval = setInterval(updateDisplay, 60000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);
  
  // Determine data mode
  const isLive = dataSource === 'live' || dataSource === 'bridge';
  const isBridge = dataSource === 'bridge';
  
  // Safe fallback for missing data
  const hasData = !!lastUpdated && !!dataSource;
  
  if (!hasData) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Data status unavailable</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
      isLive 
        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
    }`}>
      {/* Status Icon */}
      <div className={`p-1.5 rounded-md ${
        isLive 
          ? 'bg-green-100 dark:bg-green-900/50' 
          : 'bg-amber-100 dark:bg-amber-900/50'
      }`}>
        {isLive ? (
          <Radio className={`w-4 h-4 ${
            isLive ? 'text-green-600 dark:text-green-400' : ''
          }`} />
        ) : (
          <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      
      {/* Status Text */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm font-semibold ${
          isLive 
            ? 'text-green-700 dark:text-green-300' 
            : 'text-amber-700 dark:text-amber-300'
        }`}>
          {isBridge ? 'LIVE (Bridge)' : isLive ? 'LIVE' : 'DEMO DATA'}
        </span>
        
        <span className="text-muted-foreground">·</span>
        
        <span className="text-sm text-muted-foreground">
          Last updated: <span className="font-medium text-foreground">{displayTime || 'Unknown'}</span>
        </span>
      </div>
      
      {/* Live pulse indicator */}
      {isLive && (
        <span className="relative flex h-2 w-2 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
    </div>
  );
}
