'use client';

import { ThemeToggle } from './theme-toggle';
import { LogOut, RefreshCw, GitBranch, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatRelativeTimeFull } from '@/lib/utils';
import { APP_VERSION, BUILD_DATE, BUILD_SHA } from '@/lib/version';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: string;
  isLive?: boolean;
}

export function DashboardHeader({ onRefresh, refreshing, lastUpdated, isLive }: DashboardHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateDisplay = () => {
      setDisplayTime(formatRelativeTimeFull(lastUpdated));
    };
    
    updateDisplay();
    const interval = setInterval(updateDisplay, 60000);
    
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border mb-6">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Mission Control</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border border-border">
              {APP_VERSION}
            </span>
            {isLive && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 rounded border border-green-200 dark:border-green-800">
                <Radio className="w-3 h-3" />
                LIVE
              </span>
            )}
          </div>
          {displayTime && (
            <p className="text-xs text-muted-foreground">
              Updated {displayTime}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Build info - subtle */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-[10px] text-muted-foreground bg-muted/50 rounded-md border border-border/50">
          <GitBranch className="w-3 h-3" />
          <span className="font-mono">{BUILD_SHA}</span>
          <span className="text-border">|</span>
          <span>{BUILD_DATE}</span>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
