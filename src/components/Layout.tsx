import { Link, Outlet, useLocation } from 'react-router';
import { Home, FileText, Users, Box, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Catalog', href: '/catalog', icon: Box },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row font-sans">
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-lg mr-3">W</div>
          <h1 className="text-xl font-black tracking-tighter text-white">WinQuote Pro</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-3 rounded text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-white' : 'text-slate-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-auto flex flex-col">
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
