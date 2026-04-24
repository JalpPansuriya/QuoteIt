import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Material, Unit } from '../types';

export function Catalog() {
  const { products, addProduct, updateProduct, deleteProduct, settings } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    material: (settings.materials[0]?.name || 'UPVC') as Material, 
    glassType: settings.glassTypes[0]?.name || '', 
    baseRate: 0,
    unit: 'sq ft' as Unit,
    series: '',
    glass: '',
    reinforcement: '',
    frameJoins: '',
    flyscreen: '',
    color: '',
    track: '',
    trackRI: '',
    slidingSash: '',
    slidingSashRI: '',
    flyscreenSash: '',
    interlock: '',
    flyMeshType: '',
    guideRail: '',
    handle: '',
    flyscreenHandle: '',
    slidingSashRoller: '',
    flyscreenSashRoller: '',
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      material: (settings.materials[0]?.name || 'UPVC') as Material, 
      glassType: settings.glassTypes[0]?.name || '', 
      baseRate: 0, 
      unit: 'sq ft',
      series: '',
      glass: '',
      reinforcement: '',
      frameJoins: '',
      flyscreen: '',
      color: '',
      track: '',
      trackRI: '',
      slidingSash: '',
      slidingSashRI: '',
      flyscreenSash: '',
      interlock: '',
      flyMeshType: '',
      guideRail: '',
      handle: '',
      flyscreenHandle: '',
      slidingSashRoller: '',
      flyscreenSashRoller: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      updateProduct(editingId, formData);
    } else {
      addProduct({ ...formData, id: uuidv4(), createdAt: Date.now() });
    }
    resetForm();
  };

  const handleEdit = (product: any) => {
    setFormData({ 
      name: product.name, 
      material: product.material, 
      glassType: product.glassType, 
      baseRate: product.baseRate,
      unit: product.unit,
      series: product.series || '',
      glass: product.glass || '',
      reinforcement: product.reinforcement || '',
      frameJoins: product.frameJoins || '',
      flyscreen: product.flyscreen || '',
      color: product.color || '',
      track: product.track || '',
      trackRI: product.trackRI || '',
      slidingSash: product.slidingSash || '',
      slidingSashRI: product.slidingSashRI || '',
      flyscreenSash: product.flyscreenSash || '',
      interlock: product.interlock || '',
      flyMeshType: product.flyMeshType || '',
      guideRail: product.guideRail || '',
      handle: product.handle || '',
      flyscreenHandle: product.flyscreenHandle || '',
      slidingSashRoller: product.slidingSashRoller || '',
      flyscreenSashRoller: product.flyscreenSashRoller || '',
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Product Catalog</h1>
          <p className="text-slate-500 mt-1">Manage standard window types and items.</p>
        </div>
        {!isAdding && (
          <Button variant="primary" className="gap-2" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-blue-600 shadow-xl border-t-4">
          <CardContent className="p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{editingId ? 'Edit Product' : 'New Product'}</h3>
            <div className="space-y-8">
              {/* SECTION: Identity & Pricing */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Identity & Pricing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Input className="lg:col-span-2" label="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                  <Select label="Material" value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value as Material })}>
                    {settings.materials.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </Select>
                  <Input type="number" label="Base Rate" value={formData.baseRate || ''} onChange={e => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })} />
                  <Select label="Unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}>
                    <option value="sq ft">sq ft</option>
                    <option value="running ft">rft</option>
                    <option value="unit">unit</option>
                  </Select>
                </div>
              </div>

              {/* SECTION: Main Tech Specs */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Series & Framing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Input label="Series" value={formData.series} onChange={e => setFormData({ ...formData, series: e.target.value })} placeholder="e.g. Bella 60mm" />
                  <Input label="Glass Detail" value={formData.glass} onChange={e => setFormData({ ...formData, glass: e.target.value })} placeholder="e.g. 5mm Clear" />
                  <Input label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="White" />
                  <Input label="Reinforcement" value={formData.reinforcement} onChange={e => setFormData({ ...formData, reinforcement: e.target.value })} placeholder="Full" />
                  <Input label="Frame Joins" value={formData.frameJoins} onChange={e => setFormData({ ...formData, frameJoins: e.target.value })} placeholder="Welded" />
                </div>
              </div>

              {/* SECTION: Track & Sash */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Track & Sash Components
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input label="Track Specs" value={formData.track} onChange={e => setFormData({ ...formData, track: e.target.value })} />
                  <Input label="Track RI" value={formData.trackRI} onChange={e => setFormData({ ...formData, trackRI: e.target.value })} />
                  <Input label="Sliding Sash" value={formData.slidingSash} onChange={e => setFormData({ ...formData, slidingSash: e.target.value })} />
                  <Input label="Sliding Sash RI" value={formData.slidingSashRI} onChange={e => setFormData({ ...formData, slidingSashRI: e.target.value })} />
                  <Input label="Flyscreen Type" value={formData.flyscreen} onChange={e => setFormData({ ...formData, flyscreen: e.target.value })} />
                  <Input label="Flyscreen Sash" value={formData.flyscreenSash} onChange={e => setFormData({ ...formData, flyscreenSash: e.target.value })} />
                  <Input label="Sliding Sash Roller" value={formData.slidingSashRoller} onChange={e => setFormData({ ...formData, slidingSashRoller: e.target.value })} />
                  <Input label="Flyscreen Sash Roller" value={formData.flyscreenSashRoller} onChange={e => setFormData({ ...formData, flyscreenSashRoller: e.target.value })} />
                </div>
              </div>

              {/* SECTION: Hardware & Meshes */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Hardware & Final Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Input label="Fly Mesh Type" value={formData.flyMeshType} onChange={e => setFormData({ ...formData, flyMeshType: e.target.value })} />
                  <Input label="Guide Rail" value={formData.guideRail} onChange={e => setFormData({ ...formData, guideRail: e.target.value })} />
                  <Input label="Handle" value={formData.handle} onChange={e => setFormData({ ...formData, handle: e.target.value })} />
                  <Input label="Flyscreen Handle" value={formData.flyscreenHandle} onChange={e => setFormData({ ...formData, flyscreenHandle: e.target.value })} />
                  <Input label="Interlock" value={formData.interlock} onChange={e => setFormData({ ...formData, interlock: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 mt-6 pt-4">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save Product</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead className="border-b border-slate-200">
                <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Glass Specs</th>
                  <th className="px-6 py-4">Base Rate / Unit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                       No products in catalog. Add your first window framework.
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {product.material}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {product.glassType || '-'}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1">
                           <span className="font-black text-slate-900">{formatCurrency(product.baseRate)}</span>
                           <span className="text-slate-400 text-[10px] uppercase font-bold">/ {product.unit}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} title="Edit">
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if(window.confirm('Delete this product from catalog?')) deleteProduct(product.id);
                          }} className="text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
  );
}
