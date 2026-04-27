import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryItem } from '../../types';

export default function InventoryForm() {
  const navigate = useNavigate();
  const { products, addInventoryItem } = useStore();

  const [form, setForm] = useState({
    sku: '',
    name: '',
    unit: 'unit',
    costPrice: '0',
    quantityOnHand: '0',
    reorderThreshold: '5',
    catalogProductId: '',
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim()) return;

    const item: InventoryItem = {
      id: uuidv4(),
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit,
      costPrice: parseFloat(form.costPrice) || 0,
      quantityOnHand: parseInt(form.quantityOnHand) || 0,
      reorderThreshold: parseInt(form.reorderThreshold) || 5,
      catalogProductId: form.catalogProductId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addInventoryItem(item);
    navigate('/inventory');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">New Inventory Item</h1>
          <p className="text-slate-500 mt-1">Add a new stock item to your inventory.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="SKU"
              placeholder="e.g. UPVC-SLD-01"
              value={form.sku}
              onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))}
            />
            <Input
              label="Item Name"
              placeholder="e.g. UPVC Sliding Window Frame"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
            >
              <option value="unit">Unit</option>
              <option value="sq ft">Sq Ft</option>
              <option value="running ft">Running Ft</option>
              <option value="kg">Kg</option>
              <option value="meter">Meter</option>
              <option value="piece">Piece</option>
            </Select>
            <Input
              label="Cost Price (₹)"
              type="number"
              placeholder="0"
              value={form.costPrice}
              onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))}
            />
            <Input
              label="Initial Quantity"
              type="number"
              placeholder="0"
              value={form.quantityOnHand}
              onChange={(e) => setForm(f => ({ ...f, quantityOnHand: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Reorder Threshold"
              type="number"
              placeholder="5"
              value={form.reorderThreshold}
              onChange={(e) => setForm(f => ({ ...f, reorderThreshold: e.target.value }))}
            />
            <Select
              label="Link to Catalog Product (Optional)"
              value={form.catalogProductId}
              onChange={(e) => setForm(f => ({ ...f, catalogProductId: e.target.value }))}
            >
              <option value="">— None —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => navigate('/inventory')}>Cancel</Button>
            <Button variant="primary" className="gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
