import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, MoreHorizontal, FileText, Trash2, Copy, Edit2 } from 'lucide-react';
import { formatCurrency, generateQuoteNumber } from '../lib/utils';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function QuotesList() {
  const { quotes, clients, deleteQuote, addQuote, updateQuote } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredQuotes = quotes.filter(q => {
    const clientName = clients.find(c => c.id === q.clientId)?.name.toLowerCase() || '';
    return q.quoteNumber.toLowerCase().includes(search.toLowerCase()) || 
           clientName.includes(search.toLowerCase());
  }).sort((a, b) => b.createdAt - a.createdAt);

  const handleDuplicate = (quote: any) => {
    const lastQuoteNum = quotes.length > 0 ? quotes[quotes.length - 1].quoteNumber : undefined;
    
    const newQuote = {
      ...quote,
      id: uuidv4(),
      quoteNumber: generateQuoteNumber(lastQuoteNum),
      status: 'Draft' as const,
      version: 1,
      date: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: quote.items.map((item: any) => ({ ...item, id: uuidv4() }))
    };
    
    addQuote(newQuote);
    navigate(`/quotes/${newQuote.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Quotes</h1>
          <p className="text-slate-500 mt-1">Manage and track your quotations.</p>
        </div>
        <Link to="/quotes/new">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            New Quote
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by quote # or client..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
      </Card>

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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-bold text-slate-900">No quotes found</p>
                      <p className="text-sm mt-1">Create your first quote to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const client = clients.find(c => c.id === q.clientId);
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">
                        <Link to={`/quotes/${q.id}`} className="hover:text-blue-800">{q.quoteNumber}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{client?.name || 'Unknown Client'}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">{client?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{format(q.date, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(q.grandTotal)}</td>
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
                          <Button variant="ghost" size="sm" onClick={() => handleDuplicate(q)} title="Duplicate">
                            <Copy className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if(window.confirm('Delete this quote?')) deleteQuote(q.id);
                          }} className="text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
