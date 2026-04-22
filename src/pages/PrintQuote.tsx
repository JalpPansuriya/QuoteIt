import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isValid } from 'date-fns';
import { getSupabase } from '../lib/supabase';

const PrintQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { quotes, clients, settings, isLoading, loadInitialData, user, setUser } = useStore();
  const [initChecked, setInitChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("Checking print session...");
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        console.log("Session found, loading data...");
        await loadInitialData();
      }
      setInitChecked(true);
    };
    init();
  }, [setUser, loadInitialData]);

  // Find data
  const quote = id && quotes.length > 0 ? quotes.find(q => q.id === id) : null;
  const client = quote ? clients.find(c => c.id === quote.clientId) : null;

  useEffect(() => {
    // Only trigger print if quote data is definitely present and synced
    // AND if the explicitly requested mode is 'print'
    const isPrintMode = window.location.search.includes('mode=print');
    
    if (quote && !isLoading && initChecked && isPrintMode) {
      console.log("Print mode detected, triggering dialog...");
      const timer = setTimeout(() => {
        try {
          window.print();
          window.close(); // Automatically close the tab after print/cancel
        } catch (e) {
          console.error("Print failed:", e);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [quote, isLoading, initChecked]);

  const safeFormatDate = (dateVal: any) => {
    try {
      const d = new Date(dateVal);
      return isValid(d) ? format(d, 'MMMM dd, yyyy') : 'Invalid Date';
    } catch (e) {
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Quotation...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Quotation Not Found</h2>
        <p className="text-slate-500 text-sm max-w-xs">The quotation you are trying to print could not be located or is still syncing from the cloud.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto bg-white min-h-screen text-slate-900 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            {settings.features.companyName || 'Quoteit'}
          </h1>
          <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase mt-2">
            {settings.features.companyTagline || 'Premium Quality Solutions'}
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest leading-none">Quotation</h2>
          <p className="font-bold text-lg mt-3 text-slate-900 tracking-tight">#{quote.quoteNumber}</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
            {safeFormatDate(quote.date)}
          </p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">From</h3>
          <div className="font-black text-slate-900 text-base">{settings.features.companyName}</div>
          <div className="text-slate-500 text-xs mt-1 leading-relaxed max-w-[200px]">
             Professional Quotation Services
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">To Client</h3>
          <div className="font-black text-slate-900 text-lg mb-1">{client?.name || 'Valued Customer'}</div>
          <div className="text-slate-500 text-xs leading-relaxed max-w-[250px] text-right">
            {client?.address || 'No address provided'}
            {client?.phone && <div className="mt-1 font-bold text-slate-700">{client.phone}</div>}
            {client?.email && <div>{client.email}</div>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-12 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr className="text-[10px] uppercase font-bold tracking-widest">
              <th className="px-6 py-4 text-left">Item Description</th>
              <th className="px-4 py-4 text-center">Dimensions</th>
              <th className="px-4 py-4 text-center">Qty</th>
              <th className="px-4 py-4 text-right">Rate</th>
              <th className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {quote.items.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  {item.description && <div className="text-xs text-slate-500 mt-1 italic">{item.description}</div>}
                </td>
                <td className="px-4 py-4 text-center tabular-nums text-slate-600">
                  {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
                  <div className="text-[10px] text-slate-400 capitalize">{item.unit}</div>
                </td>
                <td className="px-4 py-4 text-center tabular-nums text-slate-900 font-medium">{item.qty || 0}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-600">{formatCurrency(item.rate || 0)}</td>
                <td className="px-6 py-4 text-right font-black tabular-nums text-slate-900">
                  {formatCurrency(item.total || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-16">
        <div className="w-full max-w-xs space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Subtotal</span>
            <span className="text-slate-900">{formatCurrency(quote.subtotal || 0)}</span>
          </div>
          {(quote.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-xs font-bold text-red-500 uppercase tracking-wider">
              <span>Discount</span>
              <span>-{formatCurrency(quote.discountAmount)}</span>
            </div>
          )}
          {quote.applyGst && (
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>GST ({quote.gstRate}%)</span>
              <span className="text-slate-900">{formatCurrency(quote.gstAmount || 0)}</span>
            </div>
          )}
          <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
            <span className="font-black text-xs uppercase tracking-widest text-slate-900">Total Payable</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums decoration-blue-500 decoration-2">
              {formatCurrency(quote.grandTotal || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-100 mt-20">
        <div className="space-y-8">
          {quote.notes && (
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Notes & Instructions</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap border-l-2 border-slate-200 pl-4 italic">
                {quote.notes}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end items-end">
          <div className="w-48 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Authorized Signatory</p>
          <p className="text-[9px] text-slate-400 uppercase mt-1">For {settings.features.companyName}</p>
        </div>
      </div>

      <div className="mt-24 pt-8 text-center border-t border-slate-50">
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          Official Quotation | Powered by Quoteit
        </p>
      </div>
    </div>
  );
};

export default PrintQuote;
