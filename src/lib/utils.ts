import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date with relative time (e.g., "20:15:00 · 12 min ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeStr = then.toLocaleTimeString('en-US', { 
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
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    relative = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    relative = then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return `${timeStr} · ${relative}`;
}

/**
 * Format a date with full relative time including seconds for recent times
 */
export function formatRelativeTimeFull(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeStr = then.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
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
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    relative = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    relative = then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return `${timeStr} · ${relative}`;
}

/**
 * Staleness info for agent cards - determines visual indicators based on last activity time
 */
export interface StalenessInfo {
  isStale: boolean;        // > 5 minutes
  isVeryStale: boolean;    // > 30 minutes
  label: string;           // Short label for badges
  message: string;         // Full message for display
  textColor: string;       // Tailwind text color class
  bgColor: string;         // Tailwind bg color class
  dotColor: string;        // Tailwind color for status dot
  icon: string;            // Icon indicator
}

export function getStalenessInfo(lastActivity: string): StalenessInfo {
  const now = new Date();
  const then = new Date(lastActivity);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Fresh: < 5 minutes
  if (diffMins < 5) {
    return {
      isStale: false,
      isVeryStale: false,
      label: 'Live',
      message: 'Active now',
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      dotColor: 'bg-green-500',
      icon: '●',
    };
  }

  // Stale warning: 5-30 minutes
  if (diffMins < 30) {
    return {
      isStale: true,
      isVeryStale: false,
      label: `${diffMins}m old`,
      message: `${diffMins} min ago`,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      dotColor: 'bg-amber-500',
      icon: '◐',
    };
  }

  // Very stale: 30-60 minutes
  if (diffMins < 60) {
    return {
      isStale: true,
      isVeryStale: true,
      label: 'Stale',
      message: `${diffMins} min ago`,
      textColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      dotColor: 'bg-orange-500',
      icon: '◑',
    };
  }

  // Offline: > 1 hour
  if (diffHours < 24) {
    return {
      isStale: true,
      isVeryStale: true,
      label: 'Offline',
      message: `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`,
      textColor: 'text-slate-500 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-900/50',
      dotColor: 'bg-slate-400',
      icon: '○',
    };
  }

  // Very old: > 1 day
  return {
    isStale: true,
    isVeryStale: true,
    label: 'Offline',
    message: diffDays === 1 ? 'yesterday' : `${diffDays} days ago`,
    textColor: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/50',
    dotColor: 'bg-slate-400',
    icon: '○',
  };
}
