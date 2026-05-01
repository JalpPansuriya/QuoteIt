import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isValid } from 'date-fns';
import { getSupabase } from '../lib/supabase';
import { Printer } from 'lucide-react';
import { WindowSchematic } from '../components/WindowSchematic';

const PrintQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { quotes, clients, settings, isLoading, loadInitialData, user, setUser } = useStore();
  const [initChecked, setInitChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("Checking print session for ID:", id);
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        console.log("Session found, ensuring data is loaded...");
        await loadInitialData();
        setInitChecked(true);
      } else {
        console.log("No session found, redirecting to login...");
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    };
    init();
  }, [id, setUser, loadInitialData]);

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
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-black transition-all font-bold"
        >
          <Printer className="w-5 h-5" />
          Print Document
        </button>
      </div>

      <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 font-sans text-[12px] p-10 shadow-md print:shadow-none print:w-full print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-4">
          <div className="w-1/3">
            {settings.features.companyLogo ? (
              <img src={settings.features.companyLogo} alt="Logo" className="max-h-16 object-contain" />
            ) : (
              <h1 className="font-black text-[20px] uppercase tracking-tighter">
                {settings.features.companyName || 'PRINCE WINDOWS'}
              </h1>
            )}
          </div>
          
          <div className="w-1/3 text-center">
            <h2 className="text-[32px] font-bold text-gray-800 tracking-tight">Quotation</h2>
          </div>

          <div className="w-1/3 flex justify-end">
            <div className="text-right">
               {settings.features.companyLogo && (
                 <h1 className="font-bold text-[14px] text-gray-800 mb-1">{settings.features.companyName}</h1>
               )}
               <p className="text-[10px] text-gray-500 italic uppercase tracking-wider">{settings.features.companyTagline}</p>
            </div>
          </div>
        </div>

        {/* Project Info & Date */}
        <div className="flex justify-between items-start mb-6 text-[11px]">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="w-24 text-gray-500">Project no.</span>
              <span className="font-bold">: {quote.quoteNumber?.replace(/\D/g, '') || '2479'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-gray-500">Project name</span>
              <span className="font-bold">: {client?.name?.toUpperCase() || 'JIGARBHAI'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-gray-500">Client name</span>
              <span className="font-bold">: {client?.name?.toUpperCase() || 'JIGARBHAI'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Date:</span> <span className="font-bold">{safeFormatDate(quote.date)}</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="w-full mb-6 border-t border-l border-gray-400">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-white text-center font-bold">
                <th className="py-2 border-r border-b border-gray-400 w-[35%]">Type</th>
                <th className="py-2 border-r border-b border-gray-400 w-[10%]">Width</th>
                <th className="py-2 border-r border-b border-gray-400 w-[10%]">Height</th>
                <th className="py-2 border-r border-b border-gray-400 w-[10%]">ft²</th>
                <th className="py-2 border-r border-b border-gray-400 w-[15%]">Unit price Rs.</th>
                <th className="py-2 border-r border-b border-gray-400 w-[5%]">Qt.</th>
                <th className="py-2 border-b border-gray-400 w-[15%]">Subtotal Rs.</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => {
                const area = (Number(item.width || 0) * Number(item.height || 0));
                return (
                  <React.Fragment key={item.id}>
                    {/* Dimension Row */}
                    <tr className="text-center font-bold">
                      <td rowSpan={2} className="p-4 border-r border-b border-gray-400 align-middle relative">
                        <div className="absolute top-1 left-1 text-[9px] font-bold text-gray-400">{idx + 1}</div>
                        <div className="absolute top-1 right-1 text-[9px] font-bold text-gray-400">{idx + 1}</div>
                        <div className="flex justify-center items-center py-4">
                          <WindowSchematic 
                            width={item.width || 3} 
                            height={item.height || 2} 
                            sections={item.sections || 2}
                            className="scale-[0.85]"
                          />
                        </div>
                      </td>
                      <td className="py-2 border-r border-b border-gray-400 bg-gray-50">{item.width || '-'}</td>
                      <td className="py-2 border-r border-b border-gray-400 bg-gray-50">{item.height || '-'}</td>
                      <td className="py-2 border-r border-b border-gray-400 bg-gray-50">{area > 0 ? area.toFixed(2) : '-'}</td>
                      <td className="py-2 border-r border-b border-gray-400 bg-gray-50">{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 border-r border-b border-gray-400 bg-gray-50">{item.qty || 1}</td>
                      <td className="py-2 border-b border-gray-400 bg-gray-50">{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {/* Specifications Row */}
                    <tr>
                      <td colSpan={6} className="p-4 border-b border-gray-400 text-left align-top space-y-2">
                        <div className="font-bold text-[11px] uppercase text-gray-800">{item.series || item.name || 'Gaudani - 32MM SLIDING SERIES'}</div>
                        
                        <div className="flex text-[10px] gap-2">
                          <span className="w-20 text-gray-500">Description:</span>
                          <span className="font-medium text-gray-800">{item.description || '2T/2P Sliding'}</span>
                        </div>
                        
                        {item.tracks && (
                          <div className="flex text-[10px] gap-2">
                            <span className="w-20 text-gray-500">Tracks:</span>
                            <span className="font-medium text-gray-800">{item.tracks}</span>
                          </div>
                        )}
                        
                        <div className="flex text-[10px] gap-2">
                          <span className="w-20 text-gray-500">Glass:</span>
                          <span className="font-medium text-gray-800">{item.glass || '11.52mm ST-187 Clear Reflective Laminated'}</span>
                        </div>

                        {item.colorCoating && (
                          <div className="flex text-[10px] gap-2">
                            <span className="w-20 text-gray-500">Coating:</span>
                            <span className="font-medium text-gray-800">{item.colorCoating}</span>
                          </div>
                        )}

                        {item.panelCost ? (
                          <div className="flex text-[10px] gap-2">
                            <span className="w-20 text-gray-500">Panel Cost:</span>
                            <span className="font-medium text-gray-800">{item.panelCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Rs.</span>
                          </div>
                        ) : null}

                        {/* Rubber Color Block */}
                        <div className="border border-gray-400 p-1 flex items-center justify-between w-full max-w-[400px]">
                          <span className="px-2 text-[9px] font-bold text-gray-600">Rubber and brush: {item.rubberColor || 'Black'}</span>
                          <div 
                            className="w-16 h-4 border border-gray-400" 
                            style={{ backgroundColor: item.rubberColor?.toLowerCase() || 'black' }}
                          />
                        </div>

                        <div className="font-bold text-[10px] text-gray-800 uppercase tracking-tight">
                          {item.hardware || 'MULTI POINT LOCKING'}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Summary */}
        <div className="flex justify-end mb-8">
          <div className="w-[45%] space-y-1 text-[11px]">
             <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                <span className="text-gray-500">Total area:</span>
                <span>{quote.items.reduce((acc, item) => acc + ((item.width || 0) * (item.height || 0) * (item.qty || 1)), 0).toFixed(2)} ft²</span>
             </div>
             <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                <span className="text-gray-500">Subtotal</span>
                <span>{quote.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Rs.</span>
             </div>
             {quote.applyGst && (
                <div className="flex justify-between font-bold border-b border-gray-200 pb-1">
                  <span className="text-gray-500">GST {quote.gstRate}%</span>
                  <span>{quote.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Rs.</span>
                </div>
             )}
             <div className="flex justify-between font-black text-[14px] pt-1">
                <span>Total</span>
                <span>{quote.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Rs.</span>
             </div>
          </div>
        </div>

        {/* T&C Page Break Logic - Professional Approach */}
        <div className="print:break-before-page mt-20 p-8 border border-gray-300 rounded-sm">
           <h3 className="text-center font-bold text-[18px] text-red-600 mb-8 uppercase tracking-widest">Terms and Conditions</h3>
           <ul className="list-disc pl-10 space-y-4 text-[11px] font-medium leading-relaxed text-gray-800">
             <li><strong>100% Advance Payment</strong> to be made while placing the order.</li>
             <li>Any replacement or removal of windows will be charged Extra.</li>
             <li>Pre & Post inspection of the site will be done by both client and us.</li>
             <li>Quotation has to be checked and verified by the client.</li>
             <li>Once the quotation is finalized and order placed, no changes are permitted.</li>
             <li>Rates will be re-calculated if there is a variation in height or width more than 150mm after site inspection.</li>
             <li>Glass: There is no warranty for fragile material and protection for it will be done by client.</li>
             <li>There is no warranty for glass once installation is done.</li>
             <li>For manufacturing defect, client has to inform us within 48 hours after installation. After the time period, {settings.features.companyName} will be not liable for any defects.</li>
             <li>Scaffolding/Crane Service, electricity, storage for material and cleaning of glass & window will be under customer's scope.</li>
             <li>Any Damage or Breackage of Sill/Stone/Glass White will not be our responsibility.</li>
             <li>Transportation Charges will be additional(Extra) and comes under client's scope.</li>
             <li>Delivery time :- 40 - 60 days</li>
             <li>Quotation Validity :- 15 days</li>
             <li className="text-red-600 font-bold uppercase">**Above Mentioned Rates Does Not Include Mosquito Mesh**</li>
           </ul>

           <div className="mt-16 flex border border-gray-400 text-[11px] font-bold">
              <div className="w-1/2 border-r border-gray-400 flex flex-col min-h-[100px]">
                <div className="p-2 border-b border-gray-400">AGREED TO AND ACCEPTED BY:</div>
                <div className="flex-1" />
                <div className="p-2 border-t border-gray-400">SIGN:</div>
              </div>
              <div className="w-1/2 flex flex-col min-h-[100px]">
                <div className="p-2 border-b border-gray-400">AGREED TO AND ACCEPTED BY:</div>
                <div className="p-2 uppercase">{settings.features.companyName}</div>
                <div className="flex-1" />
                <div className="p-2 border-t border-gray-400">SIGN:</div>
              </div>
           </div>
        </div>

        {/* Print Page Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-bold italic">
           <span>{new Date().toLocaleString()}</span>
           <span>Page 1 of 2</span>
           <div className="flex items-center gap-2">
             <span>Powered by</span>
             <span className="text-gray-600 not-italic">Boostify Corp</span>
           </div>
        </div>
        
      </div>
    </div>
  );
};

export default PrintQuote;
