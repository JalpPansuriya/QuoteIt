import React from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { ProductionStatusBadge } from '../components/ProductionStatusBadge';
import { Package, CheckCircle2, Hammer, Truck, MapPin } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function ProductionTracker() {
  const { quotes, clients, updateQuote } = useStore();

  // Extract all line items across all quotes
  const allItems = quotes.flatMap(quote => {
    const client = clients.find(c => c.id === quote.clientId);
    return (quote.items || []).map(item => ({
      ...item,
      quoteNumber: quote.quoteNumber,
      quoteId: quote.id,
      clientName: client?.name || 'Unknown Client',
      fullQuote: quote
    }));
  });

  // Calculate aggregates
  const statusCounts = {
    pending: 0,
    manufacturing: 0,
    done: 0,
    dispatched: 0,
    reached: 0
  };

  allItems.forEach(item => {
    const status = item.productionStatus || 'pending';
    if (status in statusCounts) {
      statusCounts[status] += (item.qty || 0);
    }
  });

  const handleStatusChange = (quoteId: string, itemId: string, newStatus: any) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    const updatedItems = quote.items.map(item => 
      item.id === itemId ? { ...item, productionStatus: newStatus } : item
    );

    updateQuote(quoteId, { items: updatedItems });
  };

  const stats = [
    { label: 'Pending', count: statusCounts.pending, icon: Package, color: 'text-amber-500 bg-amber-50' },
    { label: 'Manufacturing', count: statusCounts.manufacturing, icon: Hammer, color: 'text-blue-500 bg-blue-50' },
    { label: 'Done', count: statusCounts.done, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Dispatched', count: statusCounts.dispatched, icon: Truck, color: 'text-indigo-500 bg-indigo-50' },
    { label: 'Reached', count: statusCounts.reached, icon: MapPin, color: 'text-slate-500 bg-slate-50' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Production Tracker</h1>
        <p className="text-slate-500 mt-1">Monitor the manufacturing and delivery stages of all client items.</p>
      </div>

      {/* Aggregate Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-none shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.count}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Master Production Table */}
      <Card className="overflow-hidden border-slate-200 shadow-lg rounded-2xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="px-6 py-4">Client & Quote</th>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 text-center">Dimensions</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-right">Total Price</th>
                <th className="px-6 py-4 text-center">Production Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">
                    No active quotation items found in the pipeline.
                  </td>
                </tr>
              ) : (
                allItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-black">{item.clientName}</p>
                      <p className="text-[10px] text-blue-600 tracking-wider uppercase mt-0.5">#{item.quoteNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900">{item.series || item.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {item.tracks && `Tracks: ${item.tracks} | `}
                        {item.colorCoating && `Color: ${item.colorCoating} | `}
                        {item.glass && `Glass: ${item.glass}`}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {item.width && item.height ? `${item.width}' x ${item.height}'` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">{item.qty || 1}</td>
                    <td className="px-6 py-4 text-right text-slate-900 font-black">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <ProductionStatusBadge status={item.productionStatus || 'pending'} />
                        <select 
                          className="text-[10px] font-bold border border-slate-200 rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          value={item.productionStatus || 'pending'}
                          onChange={(e) => handleStatusChange(item.quoteId, item.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="done">Done</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="reached">Reached</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
