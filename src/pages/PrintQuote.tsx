import React, { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { useParams, useSearchParams } from 'react-router';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { format, isValid } from 'date-fns';
import { getSupabase } from '../lib/supabase';
import { Printer, FileText } from 'lucide-react';

const PrintQuote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { quotes, clients, settings, isLoading, loadInitialData, user, setUser } = useStore();
  const [initChecked, setInitChecked] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;
    
    // TEMPORARILY hide controls for the PDF capture
    const controls = document.querySelectorAll('.print-hidden');
    controls.forEach(c => (c as HTMLElement).style.display = 'none');

    try {
      // HTML-to-Image bypasses html2canvas and uses native browser rendering,
      // which fully natively supports Tailwind v4's oklch() color spaces.
      const dataUrl = await toPng(element, { 
        quality: 1.0, 
        pixelRatio: 2 // High-fidelity scaling
      });
      
      // Get exact image dimensions to calculate true height
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });
      
      const pdfWidth = 297; // Lock width to standard A4 landscape (297mm)
      const pdfHeight = (img.height * pdfWidth) / img.width; // Auto-calculate dynamic height
      
      // Create a modern single-page continuous PDF
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`Quotation_${quote?.quoteNumber || 'Draft'}.pdf`);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      // Restore controls
      controls.forEach(c => (c as HTMLElement).style.display = '');
    }
  };

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
    if (initChecked && quote && searchParams.get('auto') === 'download' && printRef.current) {
      setTimeout(() => {
        handleDownloadPDF();
      }, 500); // Give it a moment to render SVGs and fonts
    }
  }, [initChecked, quote, searchParams]);

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

  const WindowDiagram = ({ width, height, unit }: { width?: number, height?: number, unit?: string }) => {
    const displayWidth = width || 0;
    const displayHeight = height || 0;
    
    return (
      <div className="relative mt-6 mb-4 mx-auto w-[120px] h-[90px] select-none font-sans">
        {/* Top Dimension Line */}
        <div className="absolute -top-4 left-0 right-6 h-[1px] bg-slate-400">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-2 bg-slate-400" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-2 bg-slate-400" />
          <div className="absolute inset-0 flex items-center justify-center -top-2.5">
            <span className="bg-white px-1 text-[9px] font-black text-slate-800">{displayWidth}</span>
          </div>
        </div>

        {/* Right Dimension Line */}
        <div className="absolute top-0 bottom-6 -right-4 w-[1px] bg-slate-400">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-[1px] bg-slate-400" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-[1px] bg-slate-400" />
          <div className="absolute inset-0 flex items-center justify-center -right-5">
            <span className="bg-white py-0.5 text-[9px] font-black text-slate-800 rotate-90">{displayHeight}</span>
          </div>
        </div>

        {/* Window Construct */}
        <div className="absolute top-0 left-0 right-6 bottom-6 border-[2px] border-slate-700 bg-white shadow-inner overflow-hidden">
          {/* Glass Shading - Gradient Light Blue */}
          <div className="absolute inset-0 bg-[#e0f7fa] flex">
            {/* Left Pane */}
            <div className="flex-1 border-r-2 border-slate-700 relative">
               {/* Arrow Left-to-Center */}
               <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-6 h-px bg-slate-400 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[2px] border-y-transparent border-l-[3px] border-l-slate-600" />
                  </div>
               </div>
            </div>
            {/* Right Pane */}
            <div className="flex-1 relative bg-[#b2ebf2]">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/5" />
               {/* Arrow Right-to-Center */}
               <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-6 h-px bg-slate-400 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 border-y-[2px] border-y-transparent border-r-[3px] border-r-slate-600" />
                  </div>
               </div>
            </div>
          </div>
          
          {/* Handles */}
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-400 rounded-sm" />
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-400 rounded-sm" />
        </div>
        
        {/* Unit Metadata */}
        <div className="absolute bottom-1 right-6 text-[5px] font-black text-slate-300 uppercase tracking-widest text-right">
          EXTERIOR VIEW • {unit?.toUpperCase()}
        </div>
      </div>
    );
  };

  const renderProductDetails = (item: any) => {
    const specs = [
      { label: 'Series', value: item.series },
      { label: 'Color', value: item.color },
      { label: 'Glass', value: item.glass },
      { label: 'Track', value: item.track },
      { label: 'Track RI', value: item.trackRI },
      { label: 'Sliding Sash', value: item.slidingSash },
      { label: 'Sash RI', value: item.slidingSashRI },
      { label: 'Reinforcement', value: item.reinforcement },
      { label: 'Frame Join', value: item.frameJoins },
      { label: 'Handle', value: item.handle },
      { label: 'Interlock', value: item.interlock },
      { label: 'Mesh', value: item.flyMeshType },
      { label: 'Flyscreen', value: item.flyscreen },
      { label: 'Fly Sash', value: item.flyscreenSash },
      { label: 'Guide Rail', value: item.guideRail },
      { label: 'Fly Handle', value: item.flyscreenHandle },
      { label: 'Rollers', value: item.slidingSashRoller },
      { label: 'Fly Rollers', value: item.flyscreenSashRoller },
    ].filter(s => s.value && s.value !== '');

    if (specs.length === 0 && !item.description) return <p className="text-gray-400 italic">No additional details.</p>;

    return (
      <div className="space-y-4">
        {item.description && (
          <p className="text-[10px] text-gray-600 italic whitespace-pre-wrap border-b border-gray-100 pb-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2 items-start border-b border-slate-100/50 pb-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{spec.label}:</span>
              <span className="text-[9px] font-black text-slate-900 leading-tight flex-1 text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:p-0 print:bg-white flex flex-col items-center">
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            body {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-hidden {
              display: none !important;
            }
            .print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 10mm !important;
              box-shadow: none !important;
              border: none !important;
              display: block !important;
              visibility: visible !important;
            }
          }
        `}
      </style>
      {/* Print Controls */}
      <div className="fixed bottom-8 right-8 print-hidden z-50 flex gap-3">
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-blue-700 transition-all font-bold"
        >
          <FileText className="w-5 h-5" />
          Download PDF
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl hover:bg-gray-700 transition-all font-bold"
        >
          <Printer className="w-5 h-5" />
          Print
        </button>
      </div>

      <div ref={printRef} className="print-container w-[297mm] min-h-[210mm] bg-white text-black font-serif text-[12px] p-12 shadow-md print:shadow-none print:w-full print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-1/3">
            <h1 className="font-black text-[16px] uppercase tracking-tighter" contentEditable suppressContentEditableWarning>{settings.features.companyName}</h1>
            <div className="text-[11px] leading-snug mt-1 text-gray-700 outline-none font-sans" contentEditable suppressContentEditableWarning>
              <p>{settings.features.companyTagline || 'Professional Quotation Services'}</p>
              {settings.features.companyPhone && <p>Contact No. - {settings.features.companyPhone}</p>}
              {settings.features.companyEmail && <p>Email - {settings.features.companyEmail}</p>}
              {settings.features.companyGstin && <p>GSTIN - {settings.features.companyGstin}</p>}
            </div>
          </div>
          <div className="w-1/3 text-center">
            <h2 className="text-[24px] font-black mt-2 uppercase tracking-tight" contentEditable suppressContentEditableWarning>Quotation</h2>
            <div className="w-12 h-1 bg-gray-900 mx-auto mt-1" />
          </div>
          <div className="w-1/3 flex justify-end">
            {settings.features.companyLogo ? (
               <img src={settings.features.companyLogo} alt="Logo" className="max-h-16" />
            ) : (
               <div className="w-24 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs italic border border-gray-300 font-sans">
                 Logo Placeholder
               </div>
            )}
          </div>
        </div>

        {/* Recipient Row */}
        <div className="w-full border border-gray-900 mb-4 flex font-sans">
          <div className="w-1/2 border-r border-gray-900 flex flex-col">
            <div className="bg-gray-900 text-white font-black px-2 py-1 text-[10px] uppercase tracking-widest">To</div>
            <div className="p-3 min-h-[60px] text-[11px] leading-relaxed outline-none" contentEditable suppressContentEditableWarning>
              <p className="font-black text-[12px] text-gray-900">{client?.name}</p>
              <p className="text-gray-600">{client?.address}</p>
              {client?.phone && <p className="font-bold text-gray-800 mt-1">Ph: {client.phone}</p>}
              {client?.email && <p className="text-gray-500">{client.email}</p>}
            </div>
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-900 text-white font-black px-2 py-1 text-[10px] uppercase tracking-widest">Deliver To</div>
            <div className="p-3 min-h-[60px] text-[11px] leading-relaxed outline-none" contentEditable suppressContentEditableWarning>
              <p className="font-black text-[12px] text-gray-900">{client?.name}</p>
              <p className="text-gray-600">{client?.address}</p>
              {client?.phone && <p className="font-bold text-gray-800 mt-1">Ph: {client.phone}</p>}
            </div>
          </div>
        </div>

        {/* Meta Row */}
        <div className="w-full border border-gray-900 mb-4 font-sans">
          <table className="w-full text-center text-[10px]">
            <thead>
              <tr className="bg-gray-900 text-white font-black uppercase tracking-widest">
                <th className="py-2 border-r border-white/20">Quote Number</th>
                <th className="py-2 border-r border-white/20">Quotation Date</th>
                <th className="py-2 border-r border-white/20">Sales Rep</th>
                <th className="py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-900">
                <td className="py-2 border-r border-gray-900 font-black text-[12px]" contentEditable suppressContentEditableWarning>{quote.quoteNumber}</td>
                <td className="py-2 border-r border-gray-900 font-bold" contentEditable suppressContentEditableWarning>{safeFormatDate(quote.date)}</td>
                <td className="py-2 border-r border-gray-900 font-bold uppercase" contentEditable suppressContentEditableWarning>{user?.email?.split('@')[0] || 'ADMIN'}</td>
                <td className="py-2 font-bold" contentEditable suppressContentEditableWarning>N/A</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Line Items Table */}
        <div className="w-full border border-gray-900 mb-6 font-sans">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white text-left font-black uppercase tracking-widest">
                <th className="py-2 px-3 border-r border-white/20 border-b border-gray-900 w-[20%]">Sales Line</th>
                <th className="py-2 px-3 border-r border-white/20 border-b border-gray-900 w-[50%]">Technical details</th>
                <th className="py-2 px-3 border-r border-white/20 border-b border-gray-900 w-[8%] text-center">Qty</th>
                <th className="py-2 px-3 border-r border-white/20 border-b border-gray-900 w-[12%] text-right">Rate (Rs.)</th>
                <th className="py-2 px-3 border-b border-gray-900 w-[13%] text-right">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-gray-200 last:border-b-0 align-top ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-4 px-3 border-r border-gray-900 bg-slate-50/30">
                    <div className="text-center font-black text-[13px] mb-2">{idx + 1} - {item.productId ? 'W0' + (idx+1) : 'ITM' + (idx+1)}</div>
                    
                    {item.displayMode === 'image' && item.image ? (
                      <img src={item.image} alt="diagram" className="w-full max-w-[130px] mx-auto border-2 border-slate-200 p-1 mb-2 bg-white" />
                    ) : (
                      <WindowDiagram width={item.width} height={item.height} unit={item.unit} />
                    )}

                    <div className="text-center mt-3 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      Area: {(item.width || 0) * (item.height || 0)} {item.unit}²
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-gray-900">
                    <div className="font-black text-[12px] text-slate-900 mb-3 border-b border-slate-200 pb-1">{item.name}</div>
                    {renderProductDetails(item)}
                  </td>
                  <td className="py-4 px-2 border-r border-gray-900 text-center font-black text-[13px] text-slate-900">{item.qty || 0}</td>
                  <td className="py-4 px-3 border-r border-gray-900 text-right font-medium text-slate-600">{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-3 text-right font-black text-[13px] text-slate-900">{item.total?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end w-full mb-8 font-sans">
          <div className="w-[35%] flex flex-col text-[11px] border-2 border-gray-900 overflow-hidden rounded-sm">
             <div className="flex justify-between px-3 py-2 border-b border-gray-100 bg-white">
                <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Subtotal</span>
                <span className="font-black text-slate-900">{quote.subtotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
             {(quote.discountAmount || 0) > 0 && (
                <div className="flex justify-between px-3 py-2 border-b border-gray-100 bg-white">
                  <span className="font-bold text-red-500 uppercase tracking-widest text-[9px]">Discount</span>
                  <span className="font-black text-red-600">-{quote.discountAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
             )}
             {quote.applyGst && (
                <div className="flex justify-between px-3 py-2 border-b border-gray-100 bg-white">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">GST ({quote.gstRate}%)</span>
                  <span className="font-black text-slate-900">{quote.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
             )}
             <div className="flex justify-between px-3 py-3 bg-gray-900 text-white">
                <span className="font-black uppercase tracking-[0.2em] text-[10px]">Grand Total</span>
                <span className="font-black text-[15px]">{quote.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>

        {quote.notes && (
          <div className="mt-8 text-[11px] border-t-2 border-slate-100 pt-4 font-sans">
             <div className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-2">Notes & Terms of Agreement</div>
             <div className="font-medium text-slate-700 whitespace-pre-wrap outline-none leading-relaxed" contentEditable suppressContentEditableWarning>{quote.notes}</div>
          </div>
        )}

        {/* Footer Signature */}
        <div className="mt-32 flex justify-between items-end font-sans">
          <div className="text-center w-48">
            <div className="w-full border-b border-gray-400 mb-2"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Signature</p>
          </div>
          <div className="text-center w-48">
            <p className="text-[10px] font-black italic mb-8">For {settings.features.companyName}</p>
            <div className="w-full border-b border-gray-900 mb-2"></div>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Authorized Signatory</p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PrintQuote;
