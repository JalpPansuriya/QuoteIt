import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isValid } from 'date-fns';
import { getSupabase } from '../lib/supabase';
import { Printer } from 'lucide-react';

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

  const safeFormatDate = (dateVal: any) => {
    try {
      const d = new Date(dateVal);
      return isValid(d) ? format(d, 'dd/MM/yyyy') : 'Invalid Date';
    } catch (e) {
      return 'N/A';
    }
  };

  if (isLoading || !initChecked) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading Quotation...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quotation Not Found</h2>
        <p className="text-gray-500 text-sm max-w-xs">The quotation you are trying to print could not be located or is still syncing from the cloud.</p>
      </div>
    );
  }

  const renderSpecs = (description?: string) => {
    if (!description) return null;
    const lines = description.split('\n');
    return (
      <table className="w-full text-[11px] leading-tight mt-1">
        <tbody>
          {lines.map((line, i) => {
            const parts = line.split(':');
            if (parts.length > 1) {
              const key = parts[0].trim();
              const value = parts.slice(1).join(':').trim();
              return (
                <tr key={i}>
                  <td className="w-[30%] py-0.5 align-top font-medium text-gray-700">{key}</td>
                  <td className="w-[70%] py-0.5 align-top text-gray-900">{value}</td>
                </tr>
              );
            }
            return (
              <tr key={i}>
                <td colSpan={2} className="py-0.5 align-top text-gray-900">{line}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center">
      {/* Print Controls */}
      <div className="fixed bottom-8 right-8 print:hidden z-50">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-gray-700 transition-all font-bold"
        >
          <Printer className="w-5 h-5" />
          Print Document
        </button>
      </div>

      <div className="w-[210mm] min-h-[297mm] bg-white text-black font-serif text-[12px] p-6 shadow-md print:shadow-none print:w-full print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-1/3">
            <h1 className="font-bold text-[14px] uppercase" contentEditable suppressContentEditableWarning>{settings.features.companyName}</h1>
            <div className="text-[11px] leading-snug mt-1 text-gray-700 outline-none" contentEditable suppressContentEditableWarning>
              <p>Professional Quotation Services</p>
              <p>Contact No. - +91 XXXXXXXXXX</p>
              <p>Email - example@email.com</p>
              <p>GSTIN - XXXXXXXXXXXXXXX</p>
            </div>
          </div>
          <div className="w-1/3 text-center">
            <h2 className="text-[20px] font-bold mt-2 uppercase" contentEditable suppressContentEditableWarning>Quotation</h2>
          </div>
          <div className="w-1/3 flex justify-end">
            {settings.features.companyLogo ? (
               <img src={settings.features.companyLogo} alt="Logo" className="max-h-16" />
            ) : (
               <div className="w-24 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs italic border border-gray-300">
                 Logo Placeholder
               </div>
            )}
          </div>
        </div>

        {/* Recipient Row */}
        <div className="w-full border border-gray-500 mb-4 flex">
          <div className="w-1/2 border-r border-gray-500 flex flex-col">
            <div className="bg-gray-500 text-white font-bold px-2 py-1 text-[11px]">To</div>
            <div className="p-2 min-h-[60px] text-[11px] leading-snug outline-none" contentEditable suppressContentEditableWarning>
              <p className="font-bold">{client?.name}</p>
              <p>{client?.address}</p>
              {client?.phone && <p>{client.phone}</p>}
              {client?.email && <p>{client.email}</p>}
            </div>
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-500 text-white font-bold px-2 py-1 text-[11px]">Deliver To</div>
            <div className="p-2 min-h-[60px] text-[11px] leading-snug outline-none" contentEditable suppressContentEditableWarning>
              <p className="font-bold">{client?.name}</p>
              <p>{client?.address}</p>
              {client?.phone && <p>{client.phone}</p>}
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="w-full border border-gray-500 mb-4">
          <table className="w-full text-center text-[11px]">
            <thead>
              <tr className="bg-gray-500 text-white font-bold">
                <th className="py-1 border-r border-white/20 font-normal">Quote No.</th>
                <th className="py-1 border-r border-white/20 font-normal">Date</th>
                <th className="py-1 border-r border-white/20 font-normal">Sales Person</th>
                <th className="py-1 font-normal">Responsible</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 border-r border-gray-500 font-bold" contentEditable suppressContentEditableWarning>{quote.quoteNumber}</td>
                <td className="py-1 border-r border-gray-500 font-bold" contentEditable suppressContentEditableWarning>{safeFormatDate(quote.date)}</td>
                <td className="py-1 border-r border-gray-500 font-bold uppercase" contentEditable suppressContentEditableWarning>{user?.email?.split('@')[0] || 'ADMIN'}</td>
                <td className="py-1 font-bold" contentEditable suppressContentEditableWarning>N/A</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Line Items Table */}
        <div className="w-full border border-gray-500 mb-4">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-500 text-white text-left font-normal">
                <th className="py-1 px-2 border-r border-white/20 border-b border-gray-500 w-[20%]">Sales Line</th>
                <th className="py-1 px-2 border-r border-white/20 border-b border-gray-500 w-[45%]">Details</th>
                <th className="py-1 px-2 border-r border-white/20 border-b border-gray-500 w-[8%] text-center">Qty</th>
                <th className="py-1 px-2 border-r border-white/20 border-b border-gray-500 w-[12%] text-right">Rate (Rs.)</th>
                <th className="py-1 px-2 border-b border-gray-500 w-[15%] text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-gray-500 last:border-b-0 align-top ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-2 px-2 border-r border-gray-500">
                    <div className="text-center font-bold mb-1">{idx + 1} - {item.productId ? 'W0' + (idx+1) : 'ITM' + (idx+1)}</div>
                    {(item.width || item.height) && (
                      <div className="text-center mb-2 text-[10px]">Size: {item.width} x {item.height} {item.unit}</div>
                    )}
                    {item.image ? (
                      <img src={item.image} alt="diagram" className="w-full max-w-[120px] mx-auto border border-gray-300 p-1 mt-2 object-contain" />
                    ) : (
                       <div className="w-full h-24 mt-2 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[9px] print:hidden">
                         [No Image]
                       </div>
                    )}
                  </td>
                  <td className="py-2 px-2 border-r border-gray-500">
                    <div className="font-bold mb-1">{item.name}</div>
                    {renderSpecs(item.description)}
                  </td>
                  <td className="py-2 px-2 border-r border-gray-500 text-center font-bold">{item.qty || 0}</td>
                  <td className="py-2 px-2 border-r border-gray-500 text-right">{item.rate?.toFixed(2) || '0.00'}</td>
                  <td className="py-2 px-2 text-right font-bold">{item.total?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end w-full mb-8">
          <div className="w-[30%] flex flex-col text-[11px] border border-gray-500">
             <div className="flex justify-between px-2 py-1 border-b border-gray-500">
                <span className="font-bold">Subtotal</span>
                <span>{quote.subtotal?.toFixed(2) || '0.00'}</span>
             </div>
             {(quote.discountAmount || 0) > 0 && (
                <div className="flex justify-between px-2 py-1 border-b border-gray-500">
                  <span className="font-bold">Discount</span>
                  <span>-{quote.discountAmount?.toFixed(2)}</span>
                </div>
             )}
             {quote.applyGst && (
                <div className="flex justify-between px-2 py-1 border-b border-gray-500">
                  <span className="font-bold">GST ({quote.gstRate}%)</span>
                  <span>{quote.gstAmount?.toFixed(2)}</span>
                </div>
             )}
             <div className="flex justify-between px-2 py-1 bg-gray-500 text-white">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold">{quote.grandTotal?.toFixed(2) || '0.00'}</span>
             </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-4 text-[11px]">
             <div className="font-bold uppercase mb-1">Notes / Terms:</div>
             <div className="font-normal whitespace-pre-wrap outline-none" contentEditable suppressContentEditableWarning>{quote.notes}</div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default PrintQuote;
