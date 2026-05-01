import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, Search, FileText, Trash2, Edit2, Eye } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format, isWithinInterval } from 'date-fns';
import type { InvoiceStatus } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FilterBar } from '../../components/FilterBar';

const STATUS_TABS: { label: string; value: InvoiceStatus | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Sent', value: 'Sent' },
  { label: 'Partially Paid', value: 'Partially Paid' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Overdue', value: 'Overdue' },
];

export default function InvoiceList() {
  const { invoices, clients, deleteInvoice } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const filtered = invoices
    .filter(inv => {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const interval = { start: fromDate, end: toDate };

      const clientName = clients.find(c => c.id === inv.clientId)?.name.toLowerCase() || '';
      const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || clientName.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      const inDateRange = isWithinInterval(new Date(inv.issueDate), interval);
      const inProject = selectedProjectId === 'All' || inv.projectId === selectedProjectId;

      return matchesSearch && matchesStatus && inDateRange && inProject;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const statusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Sent': return 'bg-blue-100 text-blue-700';
      case 'Partially Paid': return 'bg-amber-100 text-amber-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Billing</h1>
          <p className="text-slate-500 mt-1">Manage invoices and track payments.</p>
        </div>
        <Link to="/billing/new">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded text-sm font-bold transition-all ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.value !== 'All' && (
              <span className="ml-2 text-xs opacity-60">
                {invoices.filter(i => i.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by invoice # or client..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Balance Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-bold text-slate-900">No invoices found</p>
                      <p className="text-sm mt-1">Create an invoice or convert an approved quote.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const client = clients.find(c => c.id === inv.clientId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">
                        <Link to={`/billing/${inv.id}`} className="hover:text-blue-800">{inv.invoiceNumber}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{client?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{format(inv.issueDate, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-4 font-bold text-red-600">{inv.balanceDue > 0 ? formatCurrency(inv.balanceDue) : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${statusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/billing/${inv.id}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => setInvoiceToDelete(inv.id)} className="text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={() => {
          if (invoiceToDelete) deleteInvoice(invoiceToDelete);
          setInvoiceToDelete(null);
        }}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This will also permanently remove all recorded payments against this invoice."
      />
    </div>
  );
}
