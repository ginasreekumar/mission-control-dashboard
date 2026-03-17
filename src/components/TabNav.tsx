'use client';

import { ViewMode } from '@/lib/types';
import { Users, CheckSquare, Bell, LayoutDashboard } from 'lucide-react';

interface TabNavProps {
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  alertCount?: number;
}

const tabs: { id: ViewMode; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

export function TabNav({ activeTab, onTabChange, alertCount }: TabNavProps) {
  return (
    <nav className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'alerts' && alertCount && alertCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {alertCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
