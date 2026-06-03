import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: UserRole, prefix: string): NavItem[] {
  const dashboard: NavItem = { label: 'Dashboard', href: `${prefix}/dashboard`, icon: LayoutDashboard };

  switch (role) {
    case 'Admin':
      return [
        dashboard,
        { label: 'Users', href: `${prefix}/users`, icon: Users },
        { label: 'Assets', href: `${prefix}/assets`, icon: Box },
        { label: 'Maintenance', href: `${prefix}/service-requests`, icon: ClipboardList },
        { label: 'Notifications', href: `${prefix}/notifications`, icon: Bell },
        { label: 'Reports', href: `${prefix}/reports`, icon: BarChart3 },
        { label: 'Profile', href: `${prefix}/profile`, icon: Settings },
      ];
    case 'Inspector':
      return [
        dashboard,
        { label: 'Maintenance', href: `${prefix}/service-requests`, icon: ClipboardList },
        { label: 'Assets', href: `${prefix}/assets`, icon: Box },
        { label: 'Reports', href: `${prefix}/reports`, icon: BarChart3 },
        { label: 'Profile', href: `${prefix}/profile`, icon: Settings },
      ];
    case 'User':
      return [
        dashboard,
        { label: 'My Extinguishers', href: `${prefix}/extinguishers`, icon: Flame },
        { label: 'Maintenance', href: `${prefix}/service-requests`, icon: ClipboardList },
        { label: 'Reports', href: `${prefix}/reports`, icon: BarChart3 },
        { label: 'Notifications', href: `${prefix}/notifications`, icon: Bell },
        { label: 'Profile', href: `${prefix}/profile`, icon: Settings },
      ];
    default:
      return [dashboard];
  }
}

function getRolePrefix(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return '/admin';
    case 'Inspector':
      return '/inspector';
    case 'User':
      return '/user';
    default:
      return '/';
  }
}

function SidebarNav({ items, collapsed }: { items: NavItem[]; collapsed?: boolean }) {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out',
              active
                ? 'border border-blue-100 bg-blue-50 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className={cn('h-4 w-4 shrink-0', active && 'text-blue-600')} />
            {!collapsed && <span>{item.label}</span>}
            {active && !collapsed && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!role || !user) return null;

  const prefix = getRolePrefix(role);
  const navItems = getNavItems(role, prefix);
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'flex h-16 items-center gap-3 border-b border-slate-200 px-4',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-azure shadow-sm">
          <Flame className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display text-sm font-bold text-slate-900">TWZ LTD</p>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">{role}</p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav items={navItems} collapsed={collapsed} />
      </div>
      <div className="hidden border-t border-slate-200 p-3 lg:block">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className="w-full justify-start text-slate-600"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={cn(
          'hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-300 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-slate-200 p-0">
                {sidebar}
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 lg:hidden">
              <Flame className="h-5 w-5 text-blue-600" />
              <span className="font-display font-bold text-slate-900">TWZ LTD</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarFallback className="gradient-azure text-sm font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{user.fullName}</span>
                    <span className="text-xs font-medium text-slate-500">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`${prefix}/profile`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
