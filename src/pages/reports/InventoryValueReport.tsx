import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Package } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { isWithinInterval } from 'date-fns';
import { FilterBar } from '../../components/FilterBar';

export default function InventoryValueReport() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 12); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const filteredItems = inventoryItems.filter(i => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const interval = { start: fromDate, end: toDate };
    return isWithinInterval(new Date(i.createdAt), interval);
  });

  const totalValue = filteredItems.reduce((s, i) => s + i.costPrice * i.quantityOnHand, 0);
  const lowStockItems = filteredItems.filter(i => i.quantityOnHand <= i.reorderThreshold);

  const sorted = [...filteredItems].sort((a, b) => (b.costPrice * b.quantityOnHand) - (a.costPrice * a.quantityOnHand));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Inventory Value</h1>
          <p className="text-slate-500 mt-1">Current stock value by cost price.</p>
        </div>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId=""
        onProjectChange={() => {}}
        showProject={false}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Stock Value</p><p className="text-2xl font-black mt-1 text-purple-700">{formatCurrency(totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Items</p><p className="text-2xl font-black mt-1 text-slate-900">{inventoryItems.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Low Stock Count</p><p className={`text-2xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockItems.length}</p></CardContent></Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4 text-right">Stock Value</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {sorted.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  No inventory items yet.
                </td></tr>
              ) : (
                sorted.map(item => {
                  const isLow = item.quantityOnHand <= item.reorderThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 font-black">{item.quantityOnHand} <span className="text-slate-400 font-normal text-xs">{item.unit}</span></td>
                      <td className="px-6 py-4">{formatCurrency(item.costPrice)}</td>
                      <td className="px-6 py-4 text-right font-bold text-purple-700">{formatCurrency(item.costPrice * item.quantityOnHand)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
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
