import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { isWithinInterval } from 'date-fns';

export default function RevenueReport() {
  const navigate = useNavigate();
  const { invoices, payments, clients } = useStore();

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const dateRangeInvalid = fromDate > toDate;

  const interval = { start: fromDate, end: toDate };
  const filteredInv = dateRangeInvalid ? [] : invoices.filter(i => isWithinInterval(new Date(i.issueDate), interval));
  const filteredPay = dateRangeInvalid ? [] : payments.filter(p => isWithinInterval(new Date(p.paymentDate), interval));

  const totalInvoiced = filteredInv.reduce((s, i) => s + i.total, 0);
  const totalCollected = filteredPay.reduce((s, p) => s + p.amount, 0);
  const outstanding = filteredInv.reduce((s, i) => s + i.balanceDue, 0);

  // Group by client
  const clientRevenue = new Map<string, { name: string; invoiced: number; collected: number }>();
  filteredInv.forEach(inv => {
    const c = clients.find(cl => cl.id === inv.clientId);
    const key = inv.clientId;
    const entry = clientRevenue.get(key) || { name: c?.name || 'Unknown', invoiced: 0, collected: 0 };
    entry.invoiced += inv.total;
    clientRevenue.set(key, entry);
  });
  filteredPay.forEach(p => {
    const entry = clientRevenue.get(p.clientId);
    if (entry) entry.collected += p.amount;
  });
  const clientRows = Array.from(clientRevenue.entries()).sort((a, b) => b[1].invoiced - a[1].invoiced);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="w-4 h-4" /></Button>
        <div><h1 className="text-3xl font-black tracking-tighter text-slate-900">Revenue Summary</h1><p className="text-slate-500 mt-1">Invoiced vs collected in the selected period.</p></div>
      </div>

      <Card className="p-4"><div className="flex flex-wrap gap-4 items-end">
        <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div></Card>

      {dateRangeInvalid && (
        <div className="p-4 rounded bg-red-50 border border-red-200 text-sm font-bold text-red-700">
          ⚠ "From" date must be before "To" date.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Invoiced</p><p className="text-2xl font-black mt-1">{formatCurrency(totalInvoiced)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Collected</p><p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(totalCollected)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Outstanding</p><p className="text-2xl font-black mt-1 text-red-600">{formatCurrency(outstanding)}</p></CardContent></Card>
      </div>

      {/* Visual bar */}
      {totalInvoiced > 0 && (
        <Card><CardContent className="p-6">
          <p className="text-sm font-bold text-slate-900 mb-3">Collection Rate</p>
          <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalCollected / totalInvoiced) * 100)}%` }} />
          </div>
          <p className="text-sm text-slate-500 mt-2">{((totalCollected / totalInvoiced) * 100).toFixed(1)}% collected</p>
        </CardContent></Card>
      )}

      <Card><div className="overflow-x-auto"><table className="w-full text-left border-collapse">
        <thead className="border-b border-slate-200"><tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
          <th className="px-6 py-4">Client</th><th className="px-6 py-4">Invoiced</th><th className="px-6 py-4">Collected</th><th className="px-6 py-4">Outstanding</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {clientRows.length === 0 ? (<tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No data in this period.</td></tr>) : (
            clientRows.map(([id, data]) => (
              <tr key={id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold">{data.name}</td><td className="px-6 py-4 font-bold">{formatCurrency(data.invoiced)}</td><td className="px-6 py-4 font-bold text-green-700">{formatCurrency(data.collected)}</td><td className="px-6 py-4 font-bold text-red-600">{formatCurrency(data.invoiced - data.collected)}</td></tr>
            ))
          )}
        </tbody>
      </table></div></Card>
    </div>
  );
}
