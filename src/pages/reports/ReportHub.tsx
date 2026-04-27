import { Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { TrendingUp, AlertCircle, BarChart3, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

const reports = [
  { name: 'Revenue Summary', desc: 'Total invoiced vs total collected', href: '/reports/revenue', icon: TrendingUp, color: 'bg-green-50 text-green-600 border-green-100' },
  { name: 'Outstanding Balances', desc: 'Unpaid and partially paid invoices', href: '/reports/outstanding', icon: AlertCircle, color: 'bg-red-50 text-red-600 border-red-100' },
  { name: 'Quote Conversion', desc: 'Quotes sent vs approved vs invoiced', href: '/reports/quotes', icon: BarChart3, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { name: 'Inventory Value', desc: 'Current stock value by cost price', href: '/reports/inventory', icon: Package, color: 'bg-purple-50 text-purple-600 border-purple-100' },
];

export default function ReportHub() {
  const { invoices, payments, quotes, inventoryItems } = useStore();
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
  const stockValue = inventoryItems.reduce((s, i) => s + i.costPrice * i.quantityOnHand, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Financial and operational insights.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Invoiced</p><p className="text-2xl font-black mt-1 text-slate-900">{formatCurrency(totalInvoiced)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Collected</p><p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(totalCollected)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Outstanding</p><p className="text-2xl font-black mt-1 text-red-600">{formatCurrency(outstanding)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Inventory Value</p><p className="text-2xl font-black mt-1 text-purple-700">{formatCurrency(stockValue)}</p></CardContent></Card>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(r => (
          <Link key={r.href} to={r.href}>
            <Card className="hover:shadow-2xl transition-shadow cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`p-4 rounded-lg border ${r.color}`}>
                  <r.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{r.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{r.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
