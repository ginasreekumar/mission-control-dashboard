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
