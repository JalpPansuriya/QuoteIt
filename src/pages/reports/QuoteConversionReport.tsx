import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function QuoteConversionReport() {
  const navigate = useNavigate();
  const { quotes } = useStore();

  const total = quotes.length;
  const draft = quotes.filter(q => q.status === 'Draft').length;
  const sent = quotes.filter(q => q.status === 'Sent').length;
  const approved = quotes.filter(q => q.status === 'Approved').length;
  const invoiced = quotes.filter(q => q.status === 'Invoiced').length;
  const rejected = quotes.filter(q => q.status === 'Rejected').length;
  const converted = approved + invoiced;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

  const stages = [
    { label: 'Draft', count: draft, color: 'bg-slate-200', textColor: 'text-slate-700' },
    { label: 'Sent', count: sent, color: 'bg-blue-400', textColor: 'text-blue-700' },
    { label: 'Approved', count: approved, color: 'bg-green-400', textColor: 'text-green-700' },
    { label: 'Invoiced', count: invoiced, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'Rejected', count: rejected, color: 'bg-red-400', textColor: 'text-red-700' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-3xl font-black tracking-tighter text-slate-900">Quote Conversion</h1><p className="text-slate-500 mt-1">Funnel analysis of your quotation pipeline.</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Quotes</p><p className="text-3xl font-black mt-1">{total}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Converted</p><p className="text-3xl font-black mt-1 text-green-700">{converted}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Conversion Rate</p><p className="text-3xl font-black mt-1 text-blue-600">{conversionRate}%</p></CardContent></Card>
      </div>

      {/* Funnel Visualization */}
      <Card><CardContent className="p-6">
        <h3 className="font-bold text-slate-900 mb-6">Pipeline Funnel</h3>
        <div className="space-y-4">
          {stages.map(s => {
            const pct = total > 0 ? (s.count / total) * 100 : 0;
            return (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-slate-700">{s.label}</span>
                  <span className="text-sm font-bold text-slate-500">{s.count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}
