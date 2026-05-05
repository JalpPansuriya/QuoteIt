import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Trash2, Edit2, Tag, Search } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Material, Unit, ProductCategory } from '../types';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { isWithinInterval } from 'date-fns';
import { FilterBar } from '../components/FilterBar';
import { Combobox } from '../components/ui/Combobox';

export function Catalog() {
  const { products, addProduct, updateProduct, deleteProduct, settings, addPreset } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [from, setFrom] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 10); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(p => {
    const fromDate = new Date(from + 'T00:00:00.000');
    const toDate = new Date(to + 'T23:59:59.999');
    const interval = { start: fromDate, end: toDate };
    
    const inDateRange = isWithinInterval(new Date(p.createdAt || 0), interval);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         (p.material.toLowerCase().includes(search.toLowerCase())) ||
                         (p.series?.toLowerCase() || '').includes(search.toLowerCase()) ||
                         (p.category?.toLowerCase() || '').includes(search.toLowerCase());
                         
    return inDateRange && matchesSearch;
  });
  
  const [formData, setFormData] = useState({ 
    name: '', 
    material: (settings.materials[0]?.name || 'UPVC') as Material, 
    glassType: settings.glassTypes[0]?.name || '', 
    category: 'Window' as ProductCategory,
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
    customSpecs: [] as { label: string; value: string }[],
  });

  const resetForm = () => {
    setFormData({ 
      name: '', 
      material: (settings.materials[0]?.name || 'UPVC') as Material, 
      glassType: settings.glassTypes[0]?.name || '', 
      category: 'Window' as ProductCategory,
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
      customSpecs: [],
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
      category: product.category || 'Window',
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
      customSpecs: product.customSpecs || [],
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
                    category: 'Window',
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
                    category: 'Window',
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

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        showProject={false}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search product catalog by name, material or series..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                  <Select label="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}>
                    <option value="Window">🪟 Window</option>
                    <option value="Fixed Glass">🖼️ Fixed Glass</option>
                    <option value="Door">🚪 Door</option>
                    <option value="Other">📦 Other</option>
                  </Select>
                  <Combobox 
                    label="Material" 
                    value={formData.material} 
                    onChange={val => setFormData({ ...formData, material: val as Material })}
                    onAddNew={val => {
                      addPreset('materials', { id: uuidv4(), name: val });
                      setFormData({ ...formData, material: val as Material });
                    }}
                    options={settings.materials.map(m => m.name)}
                  />
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
                  <Combobox 
                    label="Series" 
                    value={formData.series} 
                    onChange={val => setFormData({ ...formData, series: val })}
                    onAddNew={val => {
                      addPreset('series', { id: uuidv4(), name: val });
                      setFormData({ ...formData, series: val });
                    }}
                    options={settings.series.map(s => s.name)}
                  />
                  <Combobox 
                    label="Glass Detail" 
                    value={formData.glass} 
                    onChange={val => setFormData({ ...formData, glass: val })}
                    onAddNew={val => {
                      addPreset('glassTypes', { id: uuidv4(), name: val });
                      setFormData({ ...formData, glass: val });
                    }}
                    options={settings.glassTypes.map(g => g.name)}
                  />
                  <Combobox 
                    label="Color" 
                    value={formData.color} 
                    onChange={val => setFormData({ ...formData, color: val })}
                    onAddNew={val => {
                      addPreset('colors', { id: uuidv4(), name: val });
                      setFormData({ ...formData, color: val });
                    }}
                    options={settings.colors.map(c => c.name)}
                  />
                  <Combobox 
                    label="Reinforcement" 
                    value={formData.reinforcement} 
                    onChange={val => setFormData({ ...formData, reinforcement: val })}
                    onAddNew={val => {
                      addPreset('reinforcements', { id: uuidv4(), name: val });
                      setFormData({ ...formData, reinforcement: val });
                    }}
                    options={settings.reinforcements.map(r => r.name)}
                  />
                  <Combobox 
                    label="Frame Joins" 
                    value={formData.frameJoins} 
                    onChange={val => setFormData({ ...formData, frameJoins: val })}
                    onAddNew={val => {
                      addPreset('frameJoins', { id: uuidv4(), name: val });
                      setFormData({ ...formData, frameJoins: val });
                    }}
                    options={settings.frameJoins.map(f => f.name)}
                  />
                </div>
                {/* SECTION: Track & Sash */}
              {formData.category !== 'Fixed Glass' && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <div className="w-4 h-px bg-slate-200" /> Track & Sash Components
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Combobox 
                      label="Track Specs" 
                      value={formData.track} 
                      onChange={val => setFormData({ ...formData, track: val })}
                      onAddNew={val => {
                        addPreset('tracks', { id: uuidv4(), name: val });
                        setFormData({ ...formData, track: val });
                      }}
                      options={settings.tracks.map(t => t.name)}
                    />
                    <Combobox 
                      label="Track RI" 
                      value={formData.trackRI} 
                      onChange={val => setFormData({ ...formData, trackRI: val })}
                      onAddNew={val => {
                        addPreset('trackRIs', { id: uuidv4(), name: val });
                        setFormData({ ...formData, trackRI: val });
                      }}
                      options={settings.trackRIs.map(t => t.name)}
                    />
                    <Combobox 
                      label="Sliding Sash" 
                      value={formData.slidingSash} 
                      onChange={val => setFormData({ ...formData, slidingSash: val })}
                      onAddNew={val => {
                        addPreset('slidingSashes', { id: uuidv4(), name: val });
                        setFormData({ ...formData, slidingSash: val });
                      }}
                      options={settings.slidingSashes.map(s => s.name)}
                    />
                    <Combobox 
                      label="Sliding Sash RI" 
                      value={formData.slidingSashRI} 
                      onChange={val => setFormData({ ...formData, slidingSashRI: val })}
                      onAddNew={val => {
                        addPreset('slidingSashRIs', { id: uuidv4(), name: val });
                        setFormData({ ...formData, slidingSashRI: val });
                      }}
                      options={settings.slidingSashRIs.map(s => s.name)}
                    />
                    <Combobox 
                      label="Flyscreen Type" 
                      value={formData.flyscreen} 
                      onChange={val => setFormData({ ...formData, flyscreen: val })}
                      onAddNew={val => {
                        addPreset('flyscreens', { id: uuidv4(), name: val });
                        setFormData({ ...formData, flyscreen: val });
                      }}
                      options={settings.flyscreens.map(f => f.name)}
                    />
                    <Combobox 
                      label="Flyscreen Sash" 
                      value={formData.flyscreenSash} 
                      onChange={val => setFormData({ ...formData, flyscreenSash: val })}
                      onAddNew={val => {
                        addPreset('flyscreenSashes', { id: uuidv4(), name: val });
                        setFormData({ ...formData, flyscreenSash: val });
                      }}
                      options={settings.flyscreenSashes.map(f => f.name)}
                    />
                    <Combobox 
                      label="Sliding Sash Roller" 
                      value={formData.slidingSashRoller} 
                      onChange={val => setFormData({ ...formData, slidingSashRoller: val })}
                      onAddNew={val => {
                        addPreset('slidingSashRollers', { id: uuidv4(), name: val });
                        setFormData({ ...formData, slidingSashRoller: val });
                      }}
                      options={settings.slidingSashRollers.map(r => r.name)}
                    />
                    <Combobox 
                      label="Flyscreen Sash Roller" 
                      value={formData.flyscreenSashRoller} 
                      onChange={val => setFormData({ ...formData, flyscreenSashRoller: val })}
                      onAddNew={val => {
                        addPreset('flyscreenSashRollers', { id: uuidv4(), name: val });
                        setFormData({ ...formData, flyscreenSashRoller: val });
                      }}
                      options={settings.flyscreenSashRollers.map(r => r.name)}
                    />
                  </div>
                </div>
              )}
                {/* SECTION: Hardware & Meshes */}
              {formData.category !== 'Fixed Glass' && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <div className="w-4 h-px bg-slate-200" /> Hardware & Final Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Combobox 
                      label="Fly Mesh Type" 
                      value={formData.flyMeshType} 
                      onChange={val => setFormData({ ...formData, flyMeshType: val })}
                      onAddNew={val => {
                        addPreset('flyMeshTypes', { id: uuidv4(), name: val });
                        setFormData({ ...formData, flyMeshType: val });
                      }}
                      options={settings.flyMeshTypes.map(m => m.name)}
                    />
                    <Combobox 
                      label="Guide Rail" 
                      value={formData.guideRail} 
                      onChange={val => setFormData({ ...formData, guideRail: val })}
                      onAddNew={val => {
                        addPreset('guideRails', { id: uuidv4(), name: val });
                        setFormData({ ...formData, guideRail: val });
                      }}
                      options={settings.guideRails.map(g => g.name)}
                    />
                    <Combobox 
                      label="Handle" 
                      value={formData.handle} 
                      onChange={val => setFormData({ ...formData, handle: val })}
                      onAddNew={val => {
                        addPreset('handles', { id: uuidv4(), name: val });
                        setFormData({ ...formData, handle: val });
                      }}
                      options={settings.handles.map(h => h.name)}
                    />
                    <Combobox 
                      label="Flyscreen Handle" 
                      value={formData.flyscreenHandle} 
                      onChange={val => setFormData({ ...formData, flyscreenHandle: val })}
                      onAddNew={val => {
                        addPreset('flyscreenHandles', { id: uuidv4(), name: val });
                        setFormData({ ...formData, flyscreenHandle: val });
                      }}
                      options={settings.flyscreenHandles.map(f => f.name)}
                    />
                    <Combobox 
                      label="Interlock" 
                      value={formData.interlock} 
                      onChange={val => setFormData({ ...formData, interlock: val })}
                      onAddNew={val => {
                        addPreset('interlocks', { id: uuidv4(), name: val });
                        setFormData({ ...formData, interlock: val });
                      }}
                      options={settings.interlocks.map(i => i.name)}
                    />
                  </div>
                </div>
              )}
              </div>
              
              {/* SECTION: Custom Specifications */}
              <div className="mt-8 border-t border-slate-100 pt-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-4 h-px bg-slate-200" /> Custom Specifications
                </h4>
                <div className="space-y-3">
                  {formData.customSpecs.map((spec, idx) => (
                    <div key={idx} className="flex gap-3 items-end group animate-in slide-in-from-left-2 duration-200">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Label</label>
                        <Input 
                          value={spec.label}
                          onChange={(e) => {
                            const newSpecs = [...formData.customSpecs];
                            newSpecs[idx].label = e.target.value;
                            setFormData({ ...formData, customSpecs: newSpecs });
                          }}
                          placeholder="e.g. Finish Type"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Value</label>
                        <Input 
                          value={spec.value}
                          onChange={(e) => {
                            const newSpecs = [...formData.customSpecs];
                            newSpecs[idx].value = e.target.value;
                            setFormData({ ...formData, customSpecs: newSpecs });
                          }}
                          placeholder="e.g. Matt Finish"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={() => {
                          const newSpecs = formData.customSpecs.filter((_, i) => i !== idx);
                          setFormData({ ...formData, customSpecs: newSpecs });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 py-6 w-full rounded-xl"
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        customSpecs: [...formData.customSpecs, { label: '', value: '' }] 
                      });
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add Dynamic Specification
                  </Button>
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
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Glass Specs</th>
                  <th className="px-6 py-4">Base Rate / Unit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                       No products in catalog. Add your first window framework.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          {product.category || 'Window'}
                        </span>
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
