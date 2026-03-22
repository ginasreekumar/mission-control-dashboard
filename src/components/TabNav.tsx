'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ViewMode } from '@/lib/types';
import { Users, CheckSquare, Bell, LayoutDashboard, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabNavProps {
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  alertCount?: number;
}

const tabs: { id: ViewMode; label: string; icon: typeof Users; href?: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderKanban, href: '/projects' },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export function TabNav({ activeTab, onTabChange, alertCount }: TabNavProps) {
  const pathname = usePathname();
  
  return (
    <nav className="flex items-center gap-1 mb-6 border-b border-border pb-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        // Projects tab uses Link to navigate to /projects page
        if (tab.href) {
          const isProjectsActive = pathname === '/projects' || pathname.startsWith('/projects/');
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isProjectsActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {isProjectsActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
              )}
            </Link>
          );
        }
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
              'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'alerts' && alertCount && alertCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-semibold">
                {alertCount}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
