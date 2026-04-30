import { Link, Outlet, useLocation } from 'react-router';
import { Home, FileText, Users, Box, Settings, Package, Receipt, CreditCard, BarChart3, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';
import { Auth } from './Auth';
import { useStore } from '../store/useStore';

export function Layout() {
  const location = useLocation();
  const { role } = useStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Quotes', href: '/quotes', icon: FileText },
    { name: 'Production', href: '/production', icon: Package },
    { name: 'Billing', href: '/billing', icon: Receipt, adminOnly: true },
    { name: 'Payments', href: '/payments', icon: CreditCard, adminOnly: true },
    { name: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Clients', href: '/clients', icon: Users, adminOnly: true },
    { name: 'Catalog', href: '/catalog', icon: Box, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || role === 'admin');

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row font-sans">
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
        <main className="flex-1 p-6 md:p-8 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
