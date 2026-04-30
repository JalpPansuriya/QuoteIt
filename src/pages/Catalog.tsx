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
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function Catalog() {
  const { products, addProduct, updateProduct, deleteProduct, settings } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
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
    defaultWidth: undefined as number | undefined,
    defaultHeight: undefined as number | undefined,
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
      defaultWidth: undefined,
      defaultHeight: undefined,
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
      defaultWidth: product.defaultWidth,
      defaultHeight: product.defaultHeight,
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50" 
              onClick={() => {
                if(confirm('Are you sure you want to wipe all products and load the new Gaudani defaults?')) {
                  // Delete all existing
                  products.forEach(p => deleteProduct(p.id));
                  
                  // Add 32MM Sliding Series
                  addProduct({
                    id: uuidv4(),
                    name: 'Gaudani - 32MM SLIDING SERIES',
                    material: 'Aluminium',
                    glassType: '11.52mm ST-167 Clear Reflective Laminated',
                    baseRate: 0,
                    unit: 'sq ft',
                    createdAt: Date.now()
                  });
                  
                  // Add 40MM Casement Series
                  addProduct({
                    id: uuidv4(),
                    name: 'Gaudani - 40MM CASEMENT SERIES',
                    material: 'Aluminium',
                    glassType: '5mm Frosted Non Toughened',
                    baseRate: 0,
                    unit: 'sq ft',
                    createdAt: Date.now() + 1
                  });
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Reset DB & Load Gaudani
            </Button>
            <Button variant="primary" className="gap-2" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
        )}
      </div>

      {isAdding && (
        <Card className="border-blue-600 shadow-xl border-t-4">
          <CardContent className="p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{editingId ? 'Edit Product' : 'New Product'}</h3>
            <div className="space-y-8">
              {/* SECTION: Visuals */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-8 mb-4">
                <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all shadow-sm">
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Product" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold uppercase">Change</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-slate-50 rounded-full shadow-inner text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 px-2 text-center leading-tight">Add Product Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image: reader.result as string, displayMode: 'image' });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <div className="w-4 h-px bg-slate-200" /> Bill Visualization
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select 
                      label="Display Mode" 
                      value={formData.displayMode || 'diagram'} 
                      onChange={e => setFormData({ ...formData, displayMode: e.target.value as 'diagram' | 'image' })}
                    >
                      <option value="diagram">📐 Drawing Diagram (Demo)</option>
                      <option value="image">🖼️ Product Photo (Actual)</option>
                    </Select>
                  </div>
                  <p className="text-xs text-slate-500 tracking-tight">
                    Choose <span className="font-bold text-slate-900">"Drawing Diagram"</span> to show the CSS architectural box with dimensions on the final bill for this product.
                  </p>
                </div>
              </div>

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
                  <div className="flex gap-2">
                    <Input type="number" label="Base Rate" value={formData.baseRate || ''} onChange={e => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })} />
                    <Select label="Unit" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })}>
                      <option value="sq ft">sq ft</option>
                      <option value="running ft">rft</option>
                      <option value="unit">unit</option>
                    </Select>
                  </div>
                  <div className="flex gap-2 lg:col-span-1">
                    <Input type="number" label="Def. W (ft)" value={formData.defaultWidth ?? ''} onChange={e => setFormData({ ...formData, defaultWidth: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                    <Input type="number" label="Def. H (ft)" value={formData.defaultHeight ?? ''} onChange={e => setFormData({ ...formData, defaultHeight: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                  </div>
                </div>
              </div>

              {/* SECTION: Main Tech Specs */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Series & Framing
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Select label="Series" value={formData.series} onChange={e => setFormData({ ...formData, series: e.target.value })}>
                    <option value="">Select Series...</option>
                    {settings.series.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </Select>
                  <Select label="Glass Detail" value={formData.glass} onChange={e => setFormData({ ...formData, glass: e.target.value })}>
                    <option value="">Select Glass...</option>
                    {settings.glassTypes.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </Select>
                  <Select label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}>
                    <option value="">Select Color...</option>
                    {settings.colors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </Select>
                  <Select label="Reinforcement" value={formData.reinforcement} onChange={e => setFormData({ ...formData, reinforcement: e.target.value })}>
                    <option value="">Select Reinforcement...</option>
                    {settings.reinforcements.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </Select>
                  <Select label="Frame Joins" value={formData.frameJoins} onChange={e => setFormData({ ...formData, frameJoins: e.target.value })}>
                    <option value="">Select Frame Join...</option>
                    {settings.frameJoins.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </Select>
                </div>
              </div>

              {/* SECTION: Track & Sash */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Track & Sash Components
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Select label="Track Specs" value={formData.track} onChange={e => setFormData({ ...formData, track: e.target.value })}>
                    <option value="">Select Track...</option>
                    {settings.tracks.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </Select>
                  <Select label="Track RI" value={formData.trackRI} onChange={e => setFormData({ ...formData, trackRI: e.target.value })}>
                    <option value="">Select Track RI...</option>
                    {settings.trackRIs.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </Select>
                  <Select label="Sliding Sash" value={formData.slidingSash} onChange={e => setFormData({ ...formData, slidingSash: e.target.value })}>
                    <option value="">Select Sash...</option>
                    {settings.slidingSashes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </Select>
                  <Select label="Sliding Sash RI" value={formData.slidingSashRI} onChange={e => setFormData({ ...formData, slidingSashRI: e.target.value })}>
                    <option value="">Select Sash RI...</option>
                    {settings.slidingSashRIs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </Select>
                  <Select label="Flyscreen Type" value={formData.flyscreen} onChange={e => setFormData({ ...formData, flyscreen: e.target.value })}>
                    <option value="">Select Flyscreen...</option>
                    {settings.flyscreens.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </Select>
                  <Select label="Flyscreen Sash" value={formData.flyscreenSash} onChange={e => setFormData({ ...formData, flyscreenSash: e.target.value })}>
                    <option value="">Select Flyscreen Sash...</option>
                    {settings.flyscreenSashes.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </Select>
                  <Select label="Sliding Sash Roller" value={formData.slidingSashRoller} onChange={e => setFormData({ ...formData, slidingSashRoller: e.target.value })}>
                    <option value="">Select Roller...</option>
                    {settings.slidingSashRollers.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </Select>
                  <Select label="Flyscreen Sash Roller" value={formData.flyscreenSashRoller} onChange={e => setFormData({ ...formData, flyscreenSashRoller: e.target.value })}>
                    <option value="">Select Flyscreen Roller...</option>
                    {settings.flyscreenSashRollers.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </Select>
                </div>
              </div>

              {/* SECTION: Hardware & Meshes */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Hardware & Final Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <Select label="Fly Mesh Type" value={formData.flyMeshType} onChange={e => setFormData({ ...formData, flyMeshType: e.target.value })}>
                    <option value="">Select Mesh...</option>
                    {settings.flyMeshTypes.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </Select>
                  <Select label="Guide Rail" value={formData.guideRail} onChange={e => setFormData({ ...formData, guideRail: e.target.value })}>
                    <option value="">Select Guide Rail...</option>
                    {settings.guideRails.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </Select>
                  <Select label="Handle" value={formData.handle} onChange={e => setFormData({ ...formData, handle: e.target.value })}>
                    <option value="">Select Handle...</option>
                    {settings.handles.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                  </Select>
                  <Select label="Flyscreen Handle" value={formData.flyscreenHandle} onChange={e => setFormData({ ...formData, flyscreenHandle: e.target.value })}>
                    <option value="">Select Fly Handle...</option>
                    {settings.flyscreenHandles.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </Select>
                  <Select label="Interlock" value={formData.interlock} onChange={e => setFormData({ ...formData, interlock: e.target.value })}>
                    <option value="">Select Interlock...</option>
                    {settings.interlocks.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                  </Select>
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
                          <Button variant="ghost" size="sm" onClick={() => setProductToDelete(product.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete">
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

      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) deleteProduct(productToDelete);
          setProductToDelete(null);
        }}
        title="Delete Product Template"
        message="Are you sure you want to delete this product template from the catalog? This will not affect existing quotations or invoices that already use this product."
      />
    </div>
  );
}
