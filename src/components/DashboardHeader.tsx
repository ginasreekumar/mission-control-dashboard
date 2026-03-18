'use client';

import { ThemeToggle } from './theme-toggle';
import { LogOut, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatRelativeTimeFull } from '@/lib/utils';

interface DashboardHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: string;
}

export function DashboardHeader({ onRefresh, refreshing, lastUpdated }: DashboardHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update the relative time display every minute
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateDisplay = () => {
      setDisplayTime(formatRelativeTimeFull(lastUpdated));
    };
    
    updateDisplay();
    const interval = setInterval(updateDisplay, 60000); // Update every minute
    
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
    <header className="flex items-center justify-between py-4 border-b border-border mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
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
          <h1 className="text-xl font-bold text-foreground">Mission Control</h1>
          {displayTime && (
            <p className="text-xs text-muted-foreground">
              Updated {displayTime}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
