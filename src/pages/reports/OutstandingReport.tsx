import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format, differenceInDays, isWithinInterval } from 'date-fns';
import { FilterBar } from '../../components/FilterBar';

export default function OutstandingReport() {
  const navigate = useNavigate();
  const { invoices, clients } = useStore();

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const outstanding = invoices
    .filter(i => {
      const fromDate = new Date(from + 'T00:00:00.000');
      const toDate = new Date(to + 'T23:59:59.999');
      const interval = { start: fromDate, end: toDate };
      const inDateRange = isWithinInterval(new Date(i.issueDate), interval);
      const inProject = selectedProjectId === 'All' || i.projectId === selectedProjectId;
      const isOutstanding = i.balanceDue > 0 && i.status !== 'Draft';
      return inDateRange && inProject && isOutstanding;
    })
    .sort((a, b) => a.dueDate - b.dueDate);

  const totalOutstanding = outstanding.reduce((s, i) => s + i.balanceDue, 0);
  const now = Date.now();

  const getBucket = (dueDate: number) => {
    const days = differenceInDays(now, dueDate);
    if (days < 0) return 'Not Yet Due';
    if (days <= 30) return '0-30 Days';
    if (days <= 60) return '31-60 Days';
    if (days <= 90) return '61-90 Days';
    return '90+ Days';
  };

  const buckets = new Map<string, number>();
  ['Not Yet Due', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'].forEach(b => buckets.set(b, 0));
  outstanding.forEach(i => {
    const bucket = getBucket(i.dueDate);
    buckets.set(bucket, (buckets.get(bucket) || 0) + i.balanceDue);
  });

  const bucketColor = (b: string) => {
    switch (b) {
      case 'Not Yet Due': return 'bg-blue-100 text-blue-700';
      case '0-30 Days': return 'bg-amber-100 text-amber-700';
      case '31-60 Days': return 'bg-orange-100 text-orange-700';
      case '61-90 Days': return 'bg-red-100 text-red-700';
      default: return 'bg-red-200 text-red-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-3xl font-black tracking-tighter text-slate-900">Outstanding Balances</h1><p className="text-slate-500 mt-1">Unpaid invoices with aging buckets.</p></div>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Outstanding</p><p className="text-3xl font-black mt-1 text-red-600">{formatCurrency(totalOutstanding)}</p></CardContent></Card>

      {/* Aging Buckets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from(buckets.entries()).map(([bucket, amount]) => (
          <Card key={bucket}><CardContent className="p-4 text-center">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 ${bucketColor(bucket)}`}>{bucket}</span>
            <p className="text-lg font-black text-slate-900">{formatCurrency(amount)}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><div className="overflow-x-auto"><table className="w-full text-left border-collapse">
        <thead className="border-b border-slate-200"><tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
          <th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Due Date</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Paid</th><th className="px-6 py-4">Balance</th><th className="px-6 py-4">Aging</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {outstanding.length === 0 ? (<tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No outstanding invoices. 🎉</td></tr>) : (
            outstanding.map(inv => {
              const client = clients.find(c => c.id === inv.clientId);
              const bucket = getBucket(inv.dueDate);
              return (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-blue-600"><Link to={`/billing/${inv.id}`} className="hover:text-blue-800">{inv.invoiceNumber}</Link></td>
                  <td className="px-6 py-4 font-medium">{client?.name || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{format(inv.dueDate, 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(inv.total)}</td>
                  <td className="px-6 py-4 text-green-700">{formatCurrency(inv.amountPaid)}</td>
                  <td className="px-6 py-4 font-bold text-red-600">{formatCurrency(inv.balanceDue)}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${bucketColor(bucket)}`}>{bucket}</span></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table></div></Card>
    </div>
  );
}
