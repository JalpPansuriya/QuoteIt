import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

const PrintQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { quotes, clients, settings } = useStore();
  const quote = quotes.find(q => q.id === id);
  const client = clients.find(c => c.id === quote?.clientId);

  useEffect(() => {
    if (quote) {
      // Small delay to ensure styles are applied
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [quote]);

  if (!quote) return <Navigate to="/quotes" />;

  return (
    <div className="p-8 max-w-[800px] mx-auto bg-white min-h-screen text-slate-900 border border-slate-100">
      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">{settings.features.companyName}</h1>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase mt-1">{settings.features.companyTagline}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Quotation</h2>
          <p className="font-bold text-lg mt-2">#{quote.quoteNumber}</p>
          <p className="text-slate-500 text-sm mt-1">{format(quote.date, 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quote From</h3>
          <div className="font-bold text-slate-900">{settings.features.companyName}</div>
          <div className="text-slate-600 text-sm mt-1">WindReseller Partner Program</div>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bill To</h3>
          <div className="font-bold text-slate-900 text-lg">{client?.name || 'Unknown'}</div>
          <div className="text-slate-600 text-sm mt-1 leading-relaxed">
            {client?.address || 'No address provided'}
            <br />
            {client?.phone}
            <br />
            {client?.email}
          </div>
        </div>
      </div>

      <table className="w-full mb-12 border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr className="text-[10px] uppercase font-bold tracking-widest">
            <th className="px-4 py-3 text-left">Description</th>
            <th className="px-4 py-3 text-right">Size</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Rate</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-sm">
          {quote.items.map((item, idx) => (
            <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-4 py-4">
                <div className="font-bold text-slate-900">{item.name}</div>
                {item.description && <div className="text-xs text-slate-500 mt-1">{item.description}</div>}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">
                {item.width && item.height ? `${item.width} x ${item.height}` : '-'}
              </td>
              <td className="px-4 py-4 text-right tabular-nums">{item.qty}</td>
              <td className="px-4 py-4 text-right tabular-nums">{formatCurrency(item.rate)}</td>
              <td className="px-4 py-4 text-right font-bold tabular-nums text-slate-900">
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-12">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-bold">{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount {quote.discountType === 'percentage' ? `(${quote.discountValue}%)` : ''}</span>
              <span className="font-bold">-{formatCurrency(quote.discountAmount)}</span>
            </div>
          )}
          {quote.applyGst && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">GST ({quote.gstRate}%)</span>
              <span className="font-bold">{formatCurrency(quote.gstAmount)}</span>
            </div>
          )}
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center bg-slate-50 p-2">
            <span className="font-black text-xs uppercase tracking-widest">Grand Total</span>
            <span className="text-xl font-black underline decoration-blue-500 underline-offset-4 decoration-2">
              {formatCurrency(quote.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-100">
        <div className="space-y-6">
          {quote.notes && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</h4>
              <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                {quote.notes}
              </p>
            </div>
          )}
          {quote.terms && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Terms & Conditions</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {quote.terms}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end items-end space-y-12">
          <div className="w-48 h-1 bg-slate-100 mt-20"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorized Signatory</p>
        </div>
      </div>

      <div className="mt-12 pt-8 text-center border-t border-slate-50">
        <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em]">Generated by WinQuote Pro Pro for {settings.features.companyName}</p>
      </div>
    </div>
  );
};

export default PrintQuote;
