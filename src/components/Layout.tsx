import React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { Home, FileText, Users, Box, Settings, Receipt, CreditCard, BarChart3, FolderKanban, Factory, Package, Bell, Search, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Auth } from './Auth';
import { Toaster } from './ui/Toaster';
import { useStore } from '../store/useStore';

export function Layout() {
  const location = useLocation();
  const { alerts, checkHealth, role } = useStore();

  React.useEffect(() => {
    // Initial health check on app load
    checkHealth();
    
    // Optional: check every 30 minutes
    const interval = setInterval(checkHealth, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const unreadAlerts = alerts.filter(a => !a.read).length;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Production', href: '/production', icon: Factory },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Catalog', href: '/catalog', icon: Box },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row font-sans relative">
      <Toaster />
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-lg mr-3">Q</div>
          <h1 className="text-xl font-black tracking-tighter text-white">Quoteit</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-2.5 rounded text-sm font-medium transition-colors',
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
        <Auth />
      </div>
      <div className="flex-1 overflow-auto flex flex-col">
        {/* TopBar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl w-64 md:w-96">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-600"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/notifications" 
              className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <Bell className="w-6 h-6" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </Link>
            
            <div className="h-8 w-px bg-slate-200 mx-2" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Gaudani Admin</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
