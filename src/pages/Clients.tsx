import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function Clients() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingId) {
      updateClient(editingId, formData);
    } else {
      addClient({ ...formData, id: uuidv4(), createdAt: Date.now() });
    }
    resetForm();
  };

  const handleEdit = (client: any) => {
    setFormData({ name: client.name, phone: client.phone, email: client.email, address: client.address });
    setEditingId(client.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage your customer database.</p>
        </div>
        {!isAdding && (
          <Button variant="primary" className="gap-2" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-blue-600 shadow-xl border-t-4">
          <CardContent className="p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{editingId ? 'Edit Client' : 'New Client'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input label="Company / Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
              <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 mt-6 pt-4">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save Client</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <Card key={client.id} className="hover:border-blue-200 transition-colors shadow-lg shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                <div className="flex gap-1">
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(client)}>
                     <Edit2 className="w-4 h-4 text-slate-400" />
                   </Button>
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                     if(window.confirm('Delete this client?')) deleteClient(client.id);
                   }}>
                     <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 hover:bg-red-50" />
                   </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600">
                 {client.phone && (
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-slate-400" />
                     {client.phone}
                   </div>
                 )}
                 {client.email && (
                   <div className="flex items-center gap-2">
                     <Mail className="w-4 h-4 text-slate-400" />
                     {client.email}
                   </div>
                 )}
                 {client.address && (
                   <div className="flex items-start gap-2">
                     <MapPin className="w-4 h-4 text-slate-400 mt-0.5 whitespace-nowrap" />
                     <span className="line-clamp-2">{client.address}</span>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        ))}
        {clients.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
            No clients added yet.
          </div>
        )}
      </div>
    </div>
  );
}
