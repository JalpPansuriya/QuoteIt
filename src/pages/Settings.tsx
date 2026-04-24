import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Settings as SettingsIcon, ShieldCheck, Database, Building2, Save, Layers, Box, Wrench, Palette, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { AppSettings, MetaDataValue } from '../types';

interface PresetListProps {
  title: string;
  items: MetaDataValue[];
  placeholder: string;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  icon?: React.ReactNode;
}

const PresetList: React.FC<PresetListProps> = ({ title, items, placeholder, onAdd, onRemove, icon }) => {
  const [newValue, setNewValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    onAdd(newValue.trim());
    setNewValue('');
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-50 rounded text-blue-600">
            {icon || <Database className="w-3.5 h-3.5" />}
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input 
            placeholder={placeholder} 
            value={newValue} 
            onChange={e => setNewValue(e.target.value)}
            className="flex-1 h-9 text-xs"
          />
          <Button type="submit" variant="primary" size="sm" className="h-9 w-9 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {items.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic py-2 text-center">No presets added.</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg group hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                <span className="text-xs font-bold text-slate-600 truncate mr-2">{item.name}</span>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Settings: React.FC = () => {
  const { settings, addMaterial, removeMaterial, addGlassType, removeGlassType, addPreset, removePreset, updateFeatures } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'base' | 'frame' | 'sash' | 'hardware'>('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <Building2 className="w-4 h-4" /> },
    { id: 'base', name: 'Base Materials', icon: <Database className="w-4 h-4" /> },
    { id: 'frame', name: 'Series & Finish', icon: <Palette className="w-4 h-4" /> },
    { id: 'sash', name: 'Tracks & Sashes', icon: <Box className="w-4 h-4" /> },
    { id: 'hardware', name: 'Hardware', icon: <Wrench className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">App Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your company profile and window master data.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold' 
                : 'text-slate-500 hover:bg-slate-100 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                <span className="text-sm">{tab.name}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'translate-x-1' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Company Identity</h2>
                </div>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-6 pb-4 border-b border-slate-50">
                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                        {settings.features.companyLogo ? (
                          <>
                            <img src={settings.features.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white font-bold uppercase">Change</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-2 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                              <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-2">Add Logo</span>
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
                                updateFeatures({ companyLogo: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">Brand Logo</p>
                        <p className="text-xs text-slate-500 mt-1">PNG or JPG. Recommended size 400x150px. This will appear on all your quotations.</p>
                      </div>
                    </div>

                    <Input 
                      label="Company Name" 
                      value={settings.features.companyName} 
                      onChange={e => updateFeatures({ companyName: e.target.value })} 
                    />
                    <Input 
                      label="Tagline / Motto" 
                      value={settings.features.companyTagline} 
                      onChange={e => updateFeatures({ companyTagline: e.target.value })} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input 
                        label="Contact Number" 
                        value={settings.features.companyPhone || ''} 
                        onChange={e => updateFeatures({ companyPhone: e.target.value })} 
                      />
                      <Input 
                        label="Email Address" 
                        value={settings.features.companyEmail || ''} 
                        onChange={e => updateFeatures({ companyEmail: e.target.value })} 
                      />
                    </div>
                    <Input 
                      label="GSTIN" 
                      value={settings.features.companyGstin || ''} 
                      onChange={e => updateFeatures({ companyGstin: e.target.value })} 
                    />
                  </CardContent>
                </Card>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Preferences</h2>
                </div>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Standard GST</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Apply GST by default</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-blue-600 rounded" 
                        checked={settings.features.defaultGstEnabled}
                        onChange={e => updateFeatures({ defaultGstEnabled: e.target.checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Auto-Numbering</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Sequential IDs</p>
                      </div>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-blue-600 rounded" 
                        checked={settings.features.autoGenerateQuoteNumbers}
                        onChange={e => updateFeatures({ autoGenerateQuoteNumbers: e.target.checked })}
                      />
                    </div>
                    <div className="pt-2">
                       <Input 
                        label="Default GST Rate (%)" 
                        type="number"
                        value={settings.features.defaultGstRate} 
                        onChange={e => updateFeatures({ defaultGstRate: parseInt(e.target.value) || 0 })} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          )}

          {activeTab === 'base' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              <PresetList 
                title="Materials"
                items={settings.materials}
                placeholder="e.g. Bronze, Gold"
                onAdd={(name) => addMaterial({ id: uuidv4(), name })}
                onRemove={removeMaterial}
                icon={<Layers className="w-4 h-4" />}
              />
              <PresetList 
                title="Glass Types"
                items={settings.glassTypes}
                placeholder="e.g. 5mm Clear, Frosted"
                onAdd={(name) => addGlassType({ id: uuidv4(), name })}
                onRemove={removeGlassType}
              />
            </div>
          )}

          {activeTab === 'frame' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
               <PresetList 
                title="Window Series"
                items={settings.series}
                placeholder="e.g. Bella 60mm"
                onAdd={(name) => addPreset('series', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('series', id)}
              />
              <PresetList 
                title="Colors"
                items={settings.colors}
                placeholder="e.g. Sparkle White"
                onAdd={(name) => addPreset('colors', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('colors', id)}
                icon={<Palette className="w-4 h-4" />}
              />
              <PresetList 
                title="Reinforcements"
                items={settings.reinforcements}
                placeholder="e.g. Full Steel"
                onAdd={(name) => addPreset('reinforcements', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('reinforcements', id)}
              />
              <PresetList 
                title="Frame Joins"
                items={settings.frameJoins}
                placeholder="e.g. Welded"
                onAdd={(name) => addPreset('frameJoins', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('frameJoins', id)}
              />
            </div>
          )}

          {activeTab === 'sash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
               <PresetList 
                title="Tracks"
                items={settings.tracks}
                placeholder="e.g. Slider 3 Track"
                onAdd={(name) => addPreset('tracks', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('tracks', id)}
              />
               <PresetList 
                title="Track RI"
                items={settings.trackRIs}
                placeholder="e.g. RI-14 X 28"
                onAdd={(name) => addPreset('trackRIs', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('trackRIs', id)}
              />
               <PresetList 
                title="Sliding Sashes"
                items={settings.slidingSashes}
                placeholder="e.g. 38mm X 68mm"
                onAdd={(name) => addPreset('slidingSashes', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('slidingSashes', id)}
              />
               <PresetList 
                title="Sliding Sash RI"
                items={settings.slidingSashRIs}
                placeholder="e.g. RI-16X14.6"
                onAdd={(name) => addPreset('slidingSashRIs', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('slidingSashRIs', id)}
              />
               <PresetList 
                title="Flyscreens"
                items={settings.flyscreens}
                placeholder="e.g. Netlon Mesh"
                onAdd={(name) => addPreset('flyscreens', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('flyscreens', id)}
              />
               <PresetList 
                title="Flyscreen Sashes"
                items={settings.flyscreenSashes}
                placeholder="e.g. 12471"
                onAdd={(name) => addPreset('flyscreenSashes', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('flyscreenSashes', id)}
              />
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
               <PresetList 
                title="Handles"
                items={settings.handles}
                placeholder="e.g. Touch Lock"
                onAdd={(name) => addPreset('handles', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('handles', id)}
                icon={<Wrench className="w-4 h-4" />}
              />
               <PresetList 
                title="Flyscreen Handles"
                items={settings.flyscreenHandles}
                placeholder="e.g. Embeded"
                onAdd={(name) => addPreset('flyscreenHandles', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('flyscreenHandles', id)}
              />
               <PresetList 
                title="Interlocks"
                items={settings.interlocks}
                placeholder="e.g. 38MM Clip"
                onAdd={(name) => addPreset('interlocks', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('interlocks', id)}
              />
               <PresetList 
                title="Sliding Rollers"
                items={settings.slidingSashRollers}
                placeholder="e.g. Double Wheel"
                onAdd={(name) => addPreset('slidingSashRollers', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('slidingSashRollers', id)}
              />
               <PresetList 
                title="Flyscreen Rollers"
                items={settings.flyscreenSashRollers}
                placeholder="e.g. Single Wheel"
                onAdd={(name) => addPreset('flyscreenSashRollers', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('flyscreenSashRollers', id)}
              />
               <PresetList 
                title="Mesh Types"
                items={settings.flyMeshTypes}
                placeholder="e.g. SS Mesh"
                onAdd={(name) => addPreset('flyMeshTypes', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('flyMeshTypes', id)}
              />
               <PresetList 
                title="Guide Rails"
                items={settings.guideRails}
                placeholder="e.g. Aluminium"
                onAdd={(name) => addPreset('guideRails', { id: uuidv4(), name })}
                onRemove={(id) => removePreset('guideRails', id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
