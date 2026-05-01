import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { isWithinInterval } from 'date-fns';
import { FilterBar } from '../../components/FilterBar';
import { FunnelChart, Funnel, LabelList, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';

export default function QuoteConversionReport() {
  const navigate = useNavigate();
  const { quotes } = useStore();

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const filteredQuotes = quotes.filter(q => {
    const fromDate = new Date(from + 'T00:00:00.000');
    const toDate = new Date(to + 'T23:59:59.999');
    const interval = { start: fromDate, end: toDate };
    const inDateRange = isWithinInterval(new Date(q.date), interval);
    const inProject = selectedProjectId === 'All' || q.projectId === selectedProjectId;
    return inDateRange && inProject;
  });

  const total = filteredQuotes.length;
  const draft = filteredQuotes.filter(q => q.status === 'Draft').length;
  const sent = filteredQuotes.filter(q => q.status === 'Sent').length;
  const approved = filteredQuotes.filter(q => q.status === 'Approved').length;
  const invoiced = filteredQuotes.filter(q => q.status === 'Invoiced').length;
  const rejected = filteredQuotes.filter(q => q.status === 'Rejected').length;
  const converted = approved + invoiced;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';

  const funnelData = [
    { name: 'Draft', value: draft, fill: '#94a3b8' },
    { name: 'Sent', value: sent, fill: '#60a5fa' },
    { name: 'Approved', value: approved, fill: '#4ade80' },
    { name: 'Invoiced', value: invoiced, fill: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-3xl font-black tracking-tighter text-slate-900">Quote Conversion</h1><p className="text-slate-500 mt-1">Funnel analysis of your quotation pipeline.</p></div>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Quotes</p><p className="text-3xl font-black mt-1">{total}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Converted</p><p className="text-3xl font-black mt-1 text-green-700">{converted}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Conversion Rate</p><p className="text-3xl font-black mt-1 text-blue-600">{conversionRate}%</p></CardContent></Card>
      </div>

      {/* Funnel Visualization */}
      <Card><CardContent className="p-6">
        <h3 className="font-bold text-slate-900 mb-6">Pipeline Funnel</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Funnel
                  data={funnelData}
                  dataKey="value"
                >
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" fontSize={12} fontWeight={600} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Draft', count: draft, color: 'bg-slate-200' },
              { label: 'Sent', count: sent, color: 'bg-blue-400' },
              { label: 'Approved', count: approved, color: 'bg-green-400' },
              { label: 'Invoiced', count: invoiced, color: 'bg-emerald-500' },
              { label: 'Rejected', count: rejected, color: 'bg-red-400' },
            ].map(s => {
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
        </div>
      </CardContent></Card>
    </div>
  );
}
