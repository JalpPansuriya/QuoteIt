import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, CreditCard, Eye } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format, isWithinInterval } from 'date-fns';
import { FilterBar } from '../../components/FilterBar';

export default function PaymentList() {
  const { payments, invoices, clients } = useStore();
  const [search, setSearch] = useState('');

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const filtered = payments
    .filter(p => {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const interval = { start: fromDate, end: toDate };

      const inv = invoices.find(i => i.id === p.invoiceId);
      const client = clients.find(c => c.id === p.clientId);
      const q = search.toLowerCase();
      const matchesSearch = (
        (inv?.invoiceNumber?.toLowerCase() || '').includes(q) ||
        (client?.name?.toLowerCase() || '').includes(q) ||
        p.paymentMethod.toLowerCase().includes(q)
      );

      const inDateRange = isWithinInterval(new Date(p.paymentDate), interval);
      const inProject = selectedProjectId === 'All' || p.projectId === selectedProjectId;

      return matchesSearch && inDateRange && inProject;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">All recorded payments across invoices.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Collected</p>
          <p className="text-2xl font-black text-green-700">{formatCurrency(totalCollected)}</p>
        </div>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by invoice #, client, method..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">Date</th><th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Method</th><th className="px-6 py-4">Reference</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center"><CreditCard className="w-12 h-12 text-slate-300 mb-4" /><p className="text-lg font-bold text-slate-900">No payments recorded</p><p className="text-sm mt-1">Record a payment from an invoice.</p></div>
                </td></tr>
              ) : (
                filtered.map(p => {
                  const inv = invoices.find(i => i.id === p.invoiceId);
                  const client = clients.find(c => c.id === p.clientId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{format(p.paymentDate, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold text-blue-600"><Link to={`/billing/${p.invoiceId}`} className="hover:text-blue-800">{inv?.invoiceNumber || '—'}</Link></td>
                      <td className="px-6 py-4 font-medium">{client?.name || '—'}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">{p.paymentMethod}</span></td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{p.referenceNumber || '—'}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-700">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 text-right"><Link to={`/payments/${p.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4 text-blue-500" /></Button></Link></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
