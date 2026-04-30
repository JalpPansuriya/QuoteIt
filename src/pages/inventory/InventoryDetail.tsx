import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowLeft, Save, Plus, ArrowDownCircle, ArrowUpCircle, Package, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import type { InventoryItem, InventoryAdjustment } from '../../types';

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { inventoryItems, inventoryAdjustments, products, updateInventoryItem, addInventoryAdjustment, deleteInventoryAdjustment, user } = useStore();

  const item = inventoryItems.find(i => i.id === id);
  const adjustments = inventoryAdjustments
    .filter(a => a.inventoryItemId === id)
    .sort((a, b) => b.adjustedAt - a.adjustedAt);

  // ── All hooks must run unconditionally (Rules of Hooks) ──
  const [editing, setEditing] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjToDelete, setAdjToDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    unit: 'unit',
    costPrice: '0',
    reorderThreshold: '5',
    catalogProductId: '',
  });

  const [adjForm, setAdjForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
  });

  // Sync form when item loads or changes
  useEffect(() => {
    if (item) {
      setForm({
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        costPrice: item.costPrice.toString(),
        reorderThreshold: item.reorderThreshold.toString(),
        catalogProductId: item.catalogProductId || '',
      });
    }
  }, [item?.id]); // re-sync only when the item ID changes (not on every quantity update)

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-bold text-slate-900">Item not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/inventory')}>Back to Inventory</Button>
      </div>
    );
  }

  const handleUpdate = () => {
    const updated: Partial<InventoryItem> = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit,
      costPrice: parseFloat(form.costPrice) || 0,
      reorderThreshold: parseInt(form.reorderThreshold) || 5,
      catalogProductId: form.catalogProductId || undefined,
    };
    updateInventoryItem(item.id, updated);
    setEditing(false);
  };

  const handleAdjust = () => {
    const qty = parseInt(adjForm.quantity);
    if (!qty || qty <= 0) return;

    const adj: InventoryAdjustment = {
      id: uuidv4(),
      inventoryItemId: item.id,
      adjustmentType: adjForm.type,
      quantity: qty,
      reason: adjForm.reason.trim(),
      adjustedBy: user?.id || '',
      adjustedAt: Date.now(),
    };
    addInventoryAdjustment(adj);
    setAdjForm({ type: 'in', quantity: '', reason: '' });
    setShowAdjust(false);
  };

  const isLow = item.quantityOnHand <= item.reorderThreshold;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">{item.name}</h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">SKU: {item.sku}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => setShowAdjust(!showAdjust)}>
            <Plus className="w-4 h-4" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">On Hand</p>
            <p className={`text-3xl font-black mt-1 ${isLow ? 'text-red-600' : 'text-slate-900'}`}>{item.quantityOnHand}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Reorder At</p>
            <p className="text-3xl font-black mt-1 text-slate-900">{item.reorderThreshold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cost Price</p>
            <p className="text-2xl font-black mt-1 text-slate-900">{formatCurrency(item.costPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Stock Value</p>
            <p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(item.costPrice * item.quantityOnHand)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Adjustment Form */}
      {showAdjust && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 mb-4">Stock Adjustment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Type"
                value={adjForm.type}
                onChange={(e) => setAdjForm(f => ({ ...f, type: e.target.value as 'in' | 'out' }))}
              >
                <option value="in">Stock In (+)</option>
                <option value="out">Stock Out (−)</option>
              </Select>
              <Input
                label="Quantity"
                type="number"
                placeholder="0"
                value={adjForm.quantity}
                onChange={(e) => setAdjForm(f => ({ ...f, quantity: e.target.value }))}
              />
              <Input
                label="Reason"
                placeholder="e.g. New shipment received"
                value={adjForm.reason}
                onChange={(e) => setAdjForm(f => ({ ...f, reason: e.target.value }))}
              />
              <div className="flex items-end">
                <Button variant="primary" className="w-full gap-2" onClick={handleAdjust}>
                  <Save className="w-4 h-4" />
                  Apply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editing && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-bold text-slate-900">Edit Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="SKU" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} />
              <Input label="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select label="Unit" value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="unit">Unit</option>
                <option value="sq ft">Sq Ft</option>
                <option value="running ft">Running Ft</option>
                <option value="kg">Kg</option>
                <option value="meter">Meter</option>
                <option value="piece">Piece</option>
              </Select>
              <Input label="Cost Price (₹)" type="number" value={form.costPrice} onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))} />
              <Input label="Reorder Threshold" type="number" value={form.reorderThreshold} onChange={(e) => setForm(f => ({ ...f, reorderThreshold: e.target.value }))} />
            </div>
            <Select label="Linked Catalog Product" value={form.catalogProductId} onChange={(e) => setForm(f => ({ ...f, catalogProductId: e.target.value }))}>
              <option value="">— None —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="primary" className="gap-2" onClick={handleUpdate}>
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment History */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Adjustment History</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200">
                <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No adjustments recorded yet.</td>
                  </tr>
                ) : (
                  adjustments.map(adj => (
                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {adj.adjustmentType === 'in' ? (
                            <ArrowDownCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            adj.adjustmentType === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {adj.adjustmentType === 'in' ? 'Stock In' : 'Stock Out'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-lg">
                        {adj.adjustmentType === 'in' ? '+' : '−'}{adj.quantity}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{adj.reason || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center justify-between">
                          <span>{format(adj.adjustedAt, 'MMM dd, yyyy HH:mm')}</span>
                          <button 
                            onClick={() => setAdjToDelete(adj.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!adjToDelete}
        onClose={() => setAdjToDelete(null)}
        onConfirm={() => {
          if (adjToDelete) deleteInventoryAdjustment(adjToDelete);
          setAdjToDelete(null);
        }}
        title="Delete Adjustment Record"
        message="Are you sure you want to delete this adjustment? This will also reverse the stock change in the current inventory."
      />
    </div>
  );
}
