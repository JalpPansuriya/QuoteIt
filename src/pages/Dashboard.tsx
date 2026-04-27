import { Link } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Plus, TrendingUp, Users, Box, Edit2, ExternalLink, Receipt, CreditCard, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function Dashboard() {
  const { quotes, clients, products, invoices, payments, inventoryItems, updateQuote } = useStore();

  const totalRevenue = quotes
    .filter(q => q.status === 'Approved' || q.status === 'Invoiced')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const outstandingBalance = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const lowStockItems = inventoryItems.filter(i => i.quantityOnHand <= i.reorderThreshold).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your quotation business.</p>
        </div>
        <Link to="/quotes/new">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            New Quote
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Invoiced</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalInvoiced)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded text-blue-600 border border-blue-100">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Outstanding Balance</p>
                <h3 className="text-2xl font-black text-red-600 mt-1">{formatCurrency(outstandingBalance)}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded text-red-600 border border-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pending Quotes</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingQuotes}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded text-blue-600 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Clients</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{clients.length}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded text-purple-600 border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Catalog Items</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{products.length}</h3>
              </div>
              <div className="p-3 bg-slate-100 rounded text-slate-600 border border-slate-200">
                <Box className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Low Stock Items</p>
                <h3 className={`text-2xl font-black mt-1 ${lowStockItems > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockItems}</h3>
              </div>
              <div className={`p-3 rounded border ${lowStockItems > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                <Package className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
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
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No quotes yet. Create your first quote.
                  </td>
                </tr>
              ) : (
                [...quotes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((q) => {
                  const client = clients.find(c => c.id === q.clientId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{q.quoteNumber}</td>
                      <td className="px-6 py-4 font-medium">{client?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500">{format(q.date, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(q.grandTotal)}</td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/quotes/${q.id}`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <Edit2 className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                          {q.status === 'Approved' && (
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
