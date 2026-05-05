import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Plus, TrendingUp, Users, Box, Edit2, ExternalLink, Receipt, CreditCard, AlertTriangle, Package, Briefcase } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { FilterBar } from '../components/FilterBar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';

export function Dashboard() {
  const navigate = useNavigate();
  const { quotes, clients, products, invoices, payments, inventoryItems, projects, projectProgress, role, updateQuote } = useStore();

  const [from, setFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState('All');

  const fromDate = new Date(from + 'T00:00:00.000');
  const toDate = new Date(to + 'T23:59:59.999');
  const interval = { start: fromDate, end: toDate };

  const filteredQuotes = quotes.filter(q => {
    const inDateRange = isWithinInterval(new Date(q.date), interval);
    const inProject = selectedProjectId === 'All' || q.projectId === selectedProjectId;
    return inDateRange && inProject;
  });

  const filteredInvoices = invoices.filter(i => {
    const inDateRange = isWithinInterval(new Date(i.issueDate), interval);
    const inProject = selectedProjectId === 'All' || i.projectId === selectedProjectId;
    return inDateRange && inProject;
  });

  const filteredPayments = payments.filter(p => {
    const inDateRange = isWithinInterval(new Date(p.paymentDate), interval);
    const inProject = selectedProjectId === 'All' || p.projectId === selectedProjectId;
    return inDateRange && inProject;
  });

  const filteredProgress = projectProgress.filter(p => {
    const inDateRange = isWithinInterval(new Date(p.recordedAt), interval);
    const inProject = selectedProjectId === 'All' || p.projectId === selectedProjectId;
    return inDateRange && inProject;
  });

  const totalRevenue = filteredQuotes
    .filter(q => q.status === 'Approved' || q.status === 'Invoiced')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const pendingQuotes = filteredQuotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  
  const totalInvoiced = filteredInvoices
    .filter(i => i.invoiceType !== 'Final')
    .reduce((sum, i) => sum + i.total, 0);
    
  const outstandingBalance = filteredInvoices
    .filter(i => i.invoiceType !== 'Final')
    .reduce((sum, i) => sum + i.balanceDue, 0);
    
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const activeProjects = projects.filter(p => {
    const inProject = selectedProjectId === 'All' || p.id === selectedProjectId;
    return p.status === 'Active' && inProject;
  }).length;
  
  const lowStockItems = inventoryItems.filter(i => i.quantityOnHand <= i.reorderThreshold).length;

  // Aggregate monthly data for the chart
  const months = eachMonthOfInterval({ start: fromDate, end: toDate });
  const chartData = months.map(month => {
    const start = startOfMonth(month).getTime();
    const end = endOfMonth(month).getTime();
    
    const revenue = invoices
      .filter(inv => {
        const d = new Date(inv.issueDate).getTime();
        const inProject = selectedProjectId === 'All' || inv.projectId === selectedProjectId;
        return d >= start && d <= end && inProject;
      })
      .reduce((s, inv) => s + inv.total, 0);
      
    const collected = payments
      .filter(p => {
        const d = new Date(p.paymentDate).getTime();
        const inProject = selectedProjectId === 'All' || p.projectId === selectedProjectId;
        return d >= start && d <= end && inProject;
      })
      .reduce((s, p) => s + p.amount, 0);
      
    return {
      name: format(month, 'MMM yy'),
      revenue,
      collected
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your quotation business.</p>
        </div>
        {role === 'admin' && (
          <div className="flex gap-3">
            <Link to="/billing/new">
              <Button variant="outline" className="gap-2 bg-white">
                <Receipt className="w-4 h-4" />
                Quick Invoice
              </Button>
            </Link>
            <Link to="/quotes/new">
              <Button variant="primary" className="gap-2 shadow-lg shadow-blue-200">
                <Plus className="w-4 h-4" />
                New Quote
              </Button>
            </Link>
          </div>
        )}
      </div>

      <FilterBar 
        fromDate={from}
        toDate={to}
        onDateChange={(f, t) => { setFrom(f); setTo(t); }}
        projectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {role === 'admin' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Revenue (Approved)</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue)}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded text-green-600 border border-green-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Active Projects</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{activeProjects}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded text-blue-600 border border-blue-100">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {role === 'admin' && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payments Collected</p>
                    <h3 className="text-2xl font-black text-green-700 mt-1">{formatCurrency(totalCollected)}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded text-emerald-600 border border-emerald-100">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600">Pending Production</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {filteredQuotes.reduce((acc, q) => acc + (q.items?.filter(i => i.productionStatus === 'pending' || i.productionStatus === 'manufacturing').length || 0), 0)} Items
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-100 rounded text-amber-600 border border-amber-200">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {role === 'admin' && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-bold text-slate-900">Revenue vs Collections Trend</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600, color: '#475569' }}
                />
                <Bar 
                  name="Invoiced" 
                  dataKey="revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  name="Collected" 
                  dataKey="collected" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Recent Site Progress</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-slate-200">
                  <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                    <th className="px-6 py-4">Site</th>
                    <th className="px-6 py-4">Installed</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProgress.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No progress recorded yet.</td></tr>
                  ) : (
                    [...filteredProgress].sort((a, b) => b.recordedAt - a.recordedAt).slice(0, 5).map(log => {
                      const project = projects.find(p => p.id === log.projectId);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${log.projectId}`)}>
                          <td className="px-6 py-4 font-bold text-slate-900">{project?.name || 'Unknown Site'}</td>
                          <td className="px-6 py-4">
                            <span className="text-blue-600 font-black">+{log.unitsCompleted}</span> {project?.unitType}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{format(log.recordedAt, 'MMM dd')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Quick Links</h2>
          <div className={`grid ${role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {role === 'admin' && (
              <Link to="/projects/new" className="p-6 bg-blue-600 rounded-3xl text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 group">
                <Briefcase className="w-8 h-8 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <p className="font-black text-lg">New Project</p>
                <p className="text-xs text-blue-100 mt-1">Setup a new installation site</p>
              </Link>
            )}
            <Link to="/projects" className="p-6 bg-slate-900 rounded-3xl text-white hover:bg-black transition-all shadow-lg shadow-slate-200 group">
              <Briefcase className="w-8 h-8 mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              <p className="font-black text-lg">All Projects</p>
              <p className="text-xs text-slate-400 mt-1">Manage installation sites</p>
            </Link>
            {role === 'admin' && (
              <>
                <Link to="/billing" className="p-6 bg-white border border-slate-100 rounded-3xl text-slate-900 hover:border-blue-500 transition-all shadow-sm group">
                  <Receipt className="w-8 h-8 mb-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                  <p className="font-black text-lg">Invoicing</p>
                  <p className="text-xs text-slate-400 mt-1">Manage bills and payments</p>
                </Link>
                <Link to="/inventory" className="p-6 bg-white border border-slate-100 rounded-3xl text-slate-900 hover:border-blue-500 transition-all shadow-sm group">
                  <Package className="w-8 h-8 mb-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                  <p className="font-black text-lg">Inventory</p>
                  <p className="text-xs text-slate-400 mt-1">Stock and materials</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-8 mb-4">Recent Quotes</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">Quote #</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No quotes found for selected criteria.
                  </td>
                </tr>
              ) : (
                [...filteredQuotes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((q) => {
                  const client = clients.find(c => c.id === q.clientId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{q.quoteNumber || 'UNNAMED'}</td>
                      <td className="px-6 py-4 font-medium">{client?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500">{format(q.date, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(q.grandTotal)}</td>
                      <td className="px-6 py-4">
                        {role === 'admin' ? (
                          <select 
                            value={q.status}
                            onChange={(e) => updateQuote(q.id, { status: e.target.value as any })}
                            className={`appearance-none px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all hover:ring-4 focus:ring-4 outline-none border-none ${
                              q.status === 'Approved' || q.status === 'Invoiced' ? 'bg-green-100 text-green-700 hover:ring-green-500/10 focus:ring-green-500/10' :
                              q.status === 'Sent' ? 'bg-blue-100 text-blue-700 hover:ring-blue-500/10 focus:ring-blue-500/10' :
                              q.status === 'Rejected' ? 'bg-red-100 text-red-700 hover:ring-red-500/10 focus:ring-red-500/10' :
                              'bg-slate-100 text-slate-700 hover:ring-slate-500/10 focus:ring-slate-500/10'
                            }`}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Approved">Approved</option>
                            <option value="Invoiced">Invoiced</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                            q.status === 'Approved' || q.status === 'Invoiced' ? 'bg-green-100 text-green-700' :
                            q.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                            q.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {q.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/quotes/${q.id}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                          {role === 'admin' && q.status === 'Approved' && (
                            <Link to={`/billing/new?quoteId=${q.id}`}>
                              <Button variant="ghost" size="sm" title="Convert to Invoice">
                                <Receipt className="h-4 w-4 text-green-600" />
                              </Button>
                            </Link>
                          )}
                          <a href={`/print/${q.id}`} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" title="View Print">
                              <ExternalLink className="h-4 w-4 text-slate-500" />
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
