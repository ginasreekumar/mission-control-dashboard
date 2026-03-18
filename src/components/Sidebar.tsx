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
  X,
  Zap,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useState } from 'react';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
  href: string;
}

const navSections: NavSection[] = [
  {
    title: 'Platform',
    items: [
      { id: 'tasks', label: 'Dashboard', icon: LayoutGrid, href: '/' },
      { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
      { id: 'docs', label: 'Documentation', icon: FileText, href: '/docs' },
    ]
  },
  {
    title: 'Agents',
    items: [
      { id: 'team', label: 'Team', icon: Users, href: '/team' },
      { id: 'memory', label: 'Memory', icon: Brain, href: '/memory' },
    ]
  },
  {
    title: 'Work',
    items: [
      { id: 'projects', label: 'Projects', icon: FolderKanban, href: '/projects' },
    ]
  },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-40',
          'transition-all duration-200 ease-out',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sidebar-foreground text-sm leading-tight">Mission Control</span>
                <span className="text-[10px] text-sidebar-foreground/50 leading-tight">v0.3.0</span>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("hidden lg:flex h-7 w-7", collapsed && "mx-auto")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'text-sidebar-foreground/70',
                        collapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-sidebar-foreground/60"
                      )} />
                      {!collapsed && <span className="text-sm">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/50">
              <Activity className="w-3.5 h-3.5 text-green-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-sidebar-foreground/70">System Status</span>
                <span className="text-[10px] font-medium text-green-600">Operational</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
