import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, Edit3, Trash2, MapPin, Calendar, Users, 
  CheckCircle2, FileText, Receipt, History, Plus, 
  ChevronRight, TrendingUp, DollarSign, Clock, MoreVertical
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { ProjectStatus } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, clients, quotes, invoices, payments, projectProgress, role, deleteProject, addProjectProgress, deleteProjectProgress } = useStore();
  
  const project = projects.find(p => p.id === id);
  const client = clients.find(c => c.id === project?.clientId);
  const projectQuotes = quotes.filter(q => q.projectId === id);
  const projectInvoices = invoices.filter(i => i.projectId === id);
  const progressLogs = projectProgress.filter(p => p.projectId === id).sort((a, b) => b.recordedAt - a.recordedAt);

  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'billing' | 'progress'>('overview');
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState({ units: 0, remarks: '' });

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h2 className="text-2xl font-bold text-slate-900">Project not found</h2>
        <Button onClick={() => navigate('/projects')} className="mt-4">Back to Projects</Button>
      </div>
    );
  }

  const totalUnitsCompleted = progressLogs.reduce((sum, log) => sum + log.unitsCompleted, 0);
  const progressPercentage = project.totalUnits > 0 ? Math.min(100, Math.round((totalUnitsCompleted / project.totalUnits) * 100)) : 0;
  
  const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const projectPayments = payments.filter(p => p.projectId === id);
  const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = totalInvoiced - totalPaid;

  const [isDeleting, setIsDeleting] = useState(false);
  const [progressToDelete, setProgressToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/projects');
  };

  const handleAddProgress = (e: React.FormEvent) => {
    e.preventDefault();
    addProjectProgress({
      id: crypto.randomUUID(),
      projectId: project.id,
      unitsCompleted: newProgress.units,
      remarks: newProgress.remarks,
      recordedBy: 'system', // Replace with actual user ID
      recordedAt: Date.now(),
      createdAt: Date.now(),
    });
    setNewProgress({ units: 0, remarks: '' });
    setIsAddingProgress(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{project.name}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black border tracking-wide uppercase",
                project.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-600 bg-slate-50 border-slate-100'
              )}>
                {project.status}
              </span>
            </div>
            <div className="flex items-center text-slate-500 font-medium mt-1">
              <MapPin className="w-4 h-4 mr-1 text-slate-300" />
              {project.location}
            </div>
          </div>
        </div>
        {role === 'admin' && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/edit/${project.id}`)}
              className="h-12 px-6 rounded-xl border-2 font-bold"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Site
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleting(true)}
              className="h-12 w-12 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</p>
              <h4 className="text-2xl font-black text-slate-900">{progressPercentage}%</h4>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            {totalUnitsCompleted} / {project.totalUnits} {project.unitType} installed
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Collected</p>
              <h4 className="text-2xl font-black text-slate-900">₹{totalPaid.toLocaleString()}</h4>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-1000 ease-out" 
              style={{ width: `${totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0}%` }} 
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">
            Of ₹{totalInvoiced.toLocaleString()} total invoiced
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quotes</p>
              <h4 className="text-2xl font-black text-slate-900">{projectQuotes.length}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {projectQuotes.filter(q => q.status === 'Approved').length} Approved revisions
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Client</p>
              <h4 className="text-lg font-black text-slate-900 line-clamp-1">{client?.name}</h4>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium truncate">
            {client?.phone || 'No phone'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
        {(['overview', 'quotes', 'billing', 'progress'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-black transition-all uppercase tracking-wider",
              activeTab === tab 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">Recent Progress</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsAddingProgress(true)}
                    className="rounded-xl font-bold border-2"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Entry
                  </Button>
                </div>
                
                {progressLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No progress recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-black">
                          +{log.unitsCompleted}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-slate-900">{project.unitType} Installation</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(log.recordedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{log.remarks || 'No remarks provided.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-slate-900">Latest Quotation</h3>
                  {projectQuotes.length > 0 && (
                    <Button variant="ghost" className="text-blue-600 font-bold" onClick={() => setActiveTab('quotes')}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
                
                {projectQuotes.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No quotations created for this site.</p>
                    <Button 
                      className="mt-6 rounded-xl bg-blue-600" 
                      onClick={() => navigate(`/quotes/new?projectId=${project.id}&clientId=${project.clientId}`)}
                    >
                      Create First Quote
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl bg-blue-50/30 border border-blue-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Active Revision</span>
                        <h4 className="text-xl font-black text-slate-900 mt-1">{projectQuotes[0].quoteNumber}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">₹{projectQuotes[0].grandTotal.toLocaleString()}</p>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{projectQuotes[0].status}</span>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button size="sm" className="rounded-lg font-bold" onClick={() => navigate(`/quotes/${projectQuotes[0].id}`)}>Edit Revision</Button>
                      <Button size="sm" variant="outline" className="rounded-lg font-bold bg-white" onClick={() => navigate(`/print/${projectQuotes[0].id}`)}>View PDF</Button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6">Financial Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
                      <p className="text-lg font-black text-slate-900">₹{totalInvoiced.toLocaleString()}</p>
                    </div>
                    <Receipt className="w-8 h-8 text-slate-200" />
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-50/50">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Total Received</p>
                      <p className="text-lg font-black text-emerald-700">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-200" />
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-rose-50/50">
                    <div>
                      <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest">Pending Balance</p>
                      <p className="text-lg font-black text-rose-700">₹{balanceDue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-rose-200" />
                  </div>
                </div>
                {role === 'admin' && (
                  <Button 
                    className="w-full mt-8 h-12 rounded-xl font-bold bg-slate-900 text-white"
                    onClick={() => setActiveTab('billing')}
                  >
                    Manage Invoices
                  </Button>
                )}
              </section>

              <section className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full translate-y-1/2 translate-x-1/2 blur-2xl" />
                <h3 className="text-xl font-black mb-4 relative z-10">Site Info</h3>
                <div className="space-y-4 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Target</p>
                    <p className="text-sm font-bold">{project.totalUnits} {project.unitType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Client Contact</p>
                    <p className="text-sm font-bold">{client?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{client?.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline</p>
                    <p className="text-sm font-bold">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} 
                      <span className="mx-2 text-slate-600">→</span>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Quotation History</h3>
              {role === 'admin' && (
                <Button 
                  className="rounded-xl font-bold bg-blue-600" 
                  onClick={() => navigate(`/quotes/new?projectId=${project.id}&clientId=${project.clientId}`)}
                >
                  <Plus className="w-4 h-4 mr-1" /> New Revision
                </Button>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quote #</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projectQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/quotes/${q.id}`)}>
                    <td className="px-8 py-5 font-black text-slate-900">{q.quoteNumber}</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{new Date(q.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black border border-slate-100 bg-white text-slate-600 uppercase tracking-wider">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-900">₹{q.grandTotal.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-slate-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Billing & Payments</h3>
              <Button 
                className="rounded-xl font-bold bg-slate-900" 
                onClick={() => navigate(`/billing/new?quoteId=${projectQuotes[0]?.id || ''}`)}
              >
                <Plus className="w-4 h-4 mr-1" /> New Invoice
              </Button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice #</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projectInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/billing/${inv.id}`)}>
                    <td className="px-8 py-5 font-black text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-8 py-5 font-bold">₹{inv.total.toLocaleString()}</td>
                    <td className="px-8 py-5 font-bold text-emerald-600">₹{inv.amountPaid.toLocaleString()}</td>
                    <td className="px-8 py-5 font-bold text-rose-600">₹{inv.balanceDue.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider",
                        inv.status === 'Paid' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                      )}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {projectInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No invoices found for this project.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">Installation Log</h3>
              <Button 
                variant="outline" 
                className="rounded-xl font-bold border-2"
                onClick={() => setIsAddingProgress(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Progress
              </Button>
            </div>
            <div className="p-8">
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-100" />
                <div className="space-y-10">
                  {progressLogs.map((log) => (
                    <div key={log.id} className="relative pl-12">
                      <div className="absolute left-0 top-1.5 w-10 h-10 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-black text-slate-900">Installed {log.unitsCompleted} {project.unitType}</h4>
                          <p className="text-sm text-slate-500 mt-1">{log.remarks || 'Daily installation update.'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(log.recordedAt).toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">By {log.recordedBy}</p>
                          </div>
                          <button 
                            onClick={() => setProgressToDelete(log.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {progressLogs.length === 0 && (
                    <div className="py-12 text-center text-slate-400 font-medium">No progress logs recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Entry Modal */}
      {isAddingProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-2xl font-black tracking-tight">Record Progress</h3>
              <p className="text-slate-400 mt-1 font-medium text-sm">Update site installation numbers for today.</p>
            </div>
            <form onSubmit={handleAddProgress} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Units Completed Today</label>
                <div className="relative group">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    required
                    type="number"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900 font-bold"
                    placeholder="0"
                    value={newProgress.units || ''}
                    onChange={e => setNewProgress({ ...newProgress, units: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Remarks / Issues</label>
                <textarea
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none text-slate-900 font-bold min-h-[100px]"
                  placeholder="Any site issues, broken glass, or remarks..."
                  value={newProgress.remarks}
                  onChange={e => setNewProgress({ ...newProgress, remarks: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingProgress(false)}
                  className="flex-1 h-12 rounded-xl font-bold border-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will permanently remove all associated progress logs, quotations, and financial records linked to this site."
        confirmText="Yes, Delete Project"
      />

      <ConfirmModal
        isOpen={!!progressToDelete}
        onClose={() => setProgressToDelete(null)}
        onConfirm={() => {
          if (progressToDelete) deleteProjectProgress(progressToDelete);
          setProgressToDelete(null);
        }}
        title="Delete Progress Log"
        message="Are you sure you want to delete this progress entry? This will decrease the overall completion percentage of the site."
      />
    </div>
  );
}
