import React, { useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { LogOut, User as UserIcon, ShieldCheck, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Auth() {
  const { user, setUser, loadInitialData, isLoading } = useStore();

  useEffect(() => {
    const supabase = getSupabase();
    
    // Check current session on mount if not already in store
    if (!user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadInitialData();
        }
      });
    }

    // Listen for auth changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      if (newUser?.id !== user?.id) {
        setUser(newUser);
        if (newUser) loadInitialData();
      }
    });

    return () => subscription.unsubscribe();
  }, [user, setUser, loadInitialData]);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login'; // Force redirect to login
  };

  if (!user) return null;

  return (
    <div className="p-4 border-t border-slate-800 mt-auto bg-slate-900/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 ring-4 ring-blue-500/5">
          <UserIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">
            {user.email?.split('@')[0]}
          </p>
          <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3 text-green-500/70" /> 
            Authorized User
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {isLoading && (
          <div className="text-[9px] text-slate-500 flex items-center gap-2 mb-2 px-1 font-bold uppercase tracking-widest animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            Cloud Data Syncing...
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-slate-500 hover:text-red-400 h-9 hover:bg-red-400/5 group border border-transparent hover:border-red-400/10 transition-all font-bold text-[10px] uppercase tracking-wider"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Sign Out System
        </Button>
      </div>
    </div>
  );
}
