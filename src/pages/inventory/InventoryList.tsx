import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Package, Plus, Search, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { isWithinInterval } from 'date-fns';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FilterBar } from '../../components/FilterBar';

export default function InventoryList() {
  const { inventoryItems, deleteInventoryItem } = useStore();
  const [search, setSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const filtered = inventoryItems
    .filter(i => {
      const fromDate = new Date(from + 'T00:00:00.000');
      const toDate = new Date(to + 'T23:59:59.999');
      const interval = { start: fromDate, end: toDate };
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
      const inDateRange = isWithinInterval(new Date(i.createdAt), interval);
      return matchesSearch && inDateRange;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const lowStockCount = inventoryItems.filter(i => i.quantityOnHand <= i.reorderThreshold).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Track raw materials and stock levels.</p>
        </div>
        <Link to="/inventory/new">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </Link>
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId=""
        onProjectChange={() => {}}
        showProject={false}
      />

      {lowStockCount > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-amber-800">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} below reorder threshold
            </p>
          </div>
        </Card>
      )}

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or SKU..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">{inventoryItems.length} items total</p>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4">Qty On Hand</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-bold text-slate-900">No inventory items</p>
                      <p className="text-sm mt-1">Add your first stock item to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.quantityOnHand <= item.reorderThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link to={`/inventory/${item.id}`} className="hover:text-blue-600">{item.name}</Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(item.costPrice)}</td>
                      <td className="px-6 py-4 font-black text-lg">{item.quantityOnHand}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          isLow
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/inventory/${item.id}`}>
                            <Button variant="ghost" size="sm" title="View Detail">
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => setItemToDelete(item.id)} className="text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
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
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) deleteInventoryItem(itemToDelete);
          setItemToDelete(null);
        }}
        title="Delete Inventory Item"
        message="Are you sure you want to delete this item? This will also remove all associated adjustment logs."
      />
    </div>
  );
}
