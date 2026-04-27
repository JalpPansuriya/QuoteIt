import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getSupabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();
  const { user, setUser, loadInitialData } = useStore();

  useEffect(() => {
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadInitialData();
          navigate('/');
        }
        setAuthChecking(false);
      }).catch(() => {
        setAuthChecking(false);
      });
    } catch (e) {
      setAuthChecking(false);
    }
  }, [navigate, setUser, loadInitialData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = getSupabase();
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        await loadInitialData();
        navigate('/');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-500">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-2xl shadow-blue-500/20 mb-6 rotate-3">
            Q
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Quoteit</h1>
          <p className="text-slate-500 font-medium tracking-tight">The ultimate bulk quotation engine.</p>
        </div>

        <Card className="border-slate-200/60 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pt-8 pb-4 text-center">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Secure Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-2 space-y-6">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Work Email</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Access Token</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/5 rounded-xl transition-all"
                  required
                />
              </div>
              <Button size="lg" className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-black rounded-xl shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'INITIALIZE SESSION'}
              </Button>
            </form>

            {message && (
              <div className={cn("p-4 rounded-xl text-xs font-bold text-center animate-in slide-in-from-top-2", message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100')}>
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-[11px] text-slate-400 font-medium">
          Protected by enterprise-grade encryption. <br />
          Internal use only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
