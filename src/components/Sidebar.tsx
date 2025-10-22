import { Link, useLocation } from 'react-router-dom';
import { Users, Settings, BarChart3, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/agent', label: 'Agent', icon: Users },
  { path: '/admin', label: 'Admin', icon: Settings },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/customer', label: 'Customer', icon: Mail },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-48 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border p-6">
        <h1 className="text-lg font-bold text-sidebar-foreground">Freddy AI Suite</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Demo v1.2</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/50">
          All AI simulated
        </p>
      </div>
    </div>
  );
};
