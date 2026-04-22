import { Link } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Plus, TrendingUp, Users, Box } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function Dashboard() {
  const { quotes, clients, products } = useStore();

  const totalRevenue = quotes
    .filter(q => q.status === 'Approved' || q.status === 'Invoiced')
    .reduce((sum, q) => sum + q.grandTotal, 0);

  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;

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
                quotes.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map((q) => {
                  const client = clients.find(c => c.id === q.clientId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{q.quoteNumber}</td>
                      <td className="px-6 py-4 font-medium">{client?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500">{format(q.date, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(q.grandTotal)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'Approved' || q.status === 'Invoiced' ? 'bg-green-100 text-green-700' :
                          q.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                          q.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/quotes/${q.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
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
