import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Edit2, Phone, Mail, MapPin, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { isWithinInterval } from 'date-fns';
import { FilterBar } from '../components/FilterBar';

export function Clients() {
  const { clients, addClient, updateClient, deleteClient, projects } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [from, setFrom] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 10); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter(c => {
    const fromDate = new Date(from + 'T00:00:00.000');
    const toDate = new Date(to + 'T23:59:59.999');
    const interval = { start: fromDate, end: toDate };

    const inDateRange = isWithinInterval(new Date(c.createdAt || 0), interval);

    let inProject = selectedProjectId === 'All';
    if (!inProject) {
      const project = projects.find(p => p.id === selectedProjectId);
      inProject = project?.clientId === c.id;
    }

    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         (c.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
                         (c.phone || '').includes(search);

    return inDateRange && inProject && matchesSearch;
  });

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

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients by name, email or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
        {filteredClients.map(client => (
          <Card key={client.id} className="hover:border-blue-200 transition-colors shadow-lg shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                <div className="flex gap-1">
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(client)}>
                     <Edit2 className="w-4 h-4 text-slate-400" />
                   </Button>
                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setClientToDelete(client.id)}>
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
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link to={`/clients/${client.id}`} className="w-full block">
                  <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest text-blue-600 border-blue-50 hover:bg-blue-50">
                    View Customer History
                  </Button>
                </Link>
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

      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) deleteClient(clientToDelete);
          setClientToDelete(null);
        }}
        title="Delete Client"
        message="Are you sure you want to delete this client? This will remove all their contact information. Please note that associated quotes and invoices will remain but will be orphaned."
      />
    </div>
  );
}
