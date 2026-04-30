import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Settings as SettingsIcon, ShieldCheck, Database, Building2, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from '../lib/supabaseService';
import { Cloud, CloudOff, RefreshCw, ConfirmModal } from 'lucide-react';
import { ConfirmModal as AppConfirmModal } from '../components/ui/ConfirmModal';

const Settings: React.FC = () => {
  const { settings, addMaterial, removeMaterial, addGlassType, removeGlassType, updateFeatures, clients, products, quotes } = useStore();
  const [newMaterial, setNewMaterial] = useState('');
  const [newGlassType, setNewGlassType] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [glassToDelete, setGlassToDelete] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    try {
      await supabaseService.saveAll({ clients, products, quotes, settings });
      setSyncStatus('success');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.trim()) return;
    addMaterial({ id: uuidv4(), name: newMaterial.trim() });
    setNewMaterial('');
  };

  const handleAddGlassType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlassType.trim()) return;
    addGlassType({ id: uuidv4(), name: newGlassType.trim() });
    setNewGlassType('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">App Settings</h1>
            <p className="text-slate-500 mt-1">Configure your master data and preferences.</p>
          </div>
        </div>
        <Button 
          variant="primary" 
          className="gap-2 shadow-lg shadow-blue-500/20" 
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {syncing ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


        {/* Company Meta */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Company Identity</h2>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                  {settings.features.companyLogo ? (
                    <img src={settings.features.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 mt-2">NO LOGO</span>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-4 w-full">
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
                  <Input 
                    label="Logo URL" 
                    placeholder="https://example.com/logo.png"
                    value={settings.features.companyLogo || ''} 
                    onChange={e => updateFeatures({ companyLogo: e.target.value })} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Feature Toggles */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Preferences & Defaults</h2>
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Standard GST</p>
                  <p className="text-xs text-slate-500">Apply GST by default on new quotes</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-blue-600" 
                  checked={settings.features.defaultGstEnabled}
                  onChange={e => updateFeatures({ defaultGstEnabled: e.target.checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Auto-Numbering</p>
                  <p className="text-xs text-slate-500">Generate sequential quote numbers automatically</p>
                </div>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-blue-600" 
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

        {/* Materials */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Materials List</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleAddMaterial} className="flex gap-2 mb-6">
                <Input 
                  placeholder="Add material (e.g. Bronze)" 
                  value={newMaterial} 
                  onChange={e => setNewMaterial(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-2">
                {settings.materials.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <button 
                      onClick={() => setMaterialToDelete(m.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Glass Types */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Glass Types</h2>
          </div>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleAddGlassType} className="flex gap-2 mb-6">
                <Input 
                  placeholder="Add glass (e.g. Mirror)" 
                  value={newGlassType} 
                  onChange={e => setNewGlassType(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-2">
                {settings.glassTypes.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                    <span className="font-medium text-slate-800">{g.name}</span>
                    <button 
                      onClick={() => setGlassToDelete(g.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <AppConfirmModal
        isOpen={!!materialToDelete}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={() => {
          if (materialToDelete) removeMaterial(materialToDelete);
          setMaterialToDelete(null);
        }}
        title="Remove Material"
        message="Are you sure you want to remove this material? This will not affect existing records but will remove it from the catalog options."
      />

      <AppConfirmModal
        isOpen={!!glassToDelete}
        onClose={() => setGlassToDelete(null)}
        onConfirm={() => {
          if (glassToDelete) removeGlassType(glassToDelete);
          setGlassToDelete(null);
        }}
        title="Remove Glass Type"
        message="Are you sure you want to remove this glass type? This will not affect existing records but will remove it from the catalog options."
      />
    </div>
  );
};

export default Settings;
