'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  Calendar, 
  FileText, 
  Users, 
  Brain,
  FolderKanban,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { id: 'tasks', label: 'Tasks', icon: LayoutGrid, href: '/' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'docs', label: 'Docs', icon: FileText, href: '/docs' },
  { id: 'team', label: 'Team', icon: Users, href: '/team' },
  { id: 'memory', label: 'Memory', icon: Brain, href: '/memory' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, href: '/projects' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">MC</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">Mission Control</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                    : 'text-sidebar-foreground',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60">
              <p>Agent System v1.0</p>
              <p className="mt-1">Built by Geordi</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
