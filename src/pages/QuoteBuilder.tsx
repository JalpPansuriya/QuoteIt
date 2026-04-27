import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Trash2, Save, Printer, ArrowLeft, Mail, FileText, MessageCircle, Share2, Loader2, LayoutTemplate } from 'lucide-react';
import { formatCurrency, generateQuoteNumber } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Quote, QuoteLineItem, Unit } from '../types';

export function QuoteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, addQuote, updateQuote, clients, addClient, products, settings, isLoading } = useStore();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [libLoaded, setLibLoaded] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const isEditing = id && id !== 'new';
  
  const [quote, setQuote] = useState<Partial<Quote>>({
    quoteNumber: '',
    clientId: '',
    status: 'Draft',
    date: Date.now(),
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    items: [],
    subtotal: 0,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    applyGst: settings.features.defaultGstEnabled,
    gstRate: settings.features.defaultGstRate,
    gstAmount: 0,
    grandTotal: 0,
    version: 1,
    notes: 'Installation and delivery not included. \nValidity: 30 days.',
    terms: '50% advance along with P.O. \nBalance against delivery delivery.',
  });

  const [isSaved, setIsSaved] = useState(false);
  const hasLoadedRef = React.useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isEditing) {
      if (!hasLoadedRef.current) {
        const existingQuote = quotes.find(q => q.id === id);
        if (existingQuote) {
          setQuote(existingQuote);
          setIsSaved(false); // Reset lock state for the new quote
          hasLoadedRef.current = true;
        } else if (quotes.length > 0) {
          // If we finished loading and still can't find it
          navigate('/quotes');
        }
      }
    } else {
      if (!hasLoadedRef.current) {
        // Logic for new quote - reset and generate number
        const lastQuote = quotes.length > 0 ? quotes[quotes.length - 1] : undefined;
        setQuote({
          quoteNumber: generateQuoteNumber(lastQuote?.quoteNumber),
          clientId: '',
          status: 'Draft',
          date: Date.now(),
          validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
          items: [],
          subtotal: 0,
          discountType: 'percentage',
          discountValue: 0,
          discountAmount: 0,
          applyGst: settings.features.defaultGstEnabled,
          gstRate: settings.features.defaultGstRate,
          gstAmount: 0,
          grandTotal: 0,
          version: 1,
          notes: 'Installation and delivery not included. \nValidity: 30 days.',
          terms: '50% advance along with P.O. \nBalance against delivery delivery.',
        });
        hasLoadedRef.current = true;
      }
    }
  }, [id, quotes, isEditing, isLoading, navigate, settings.features]);

  // Recalculate totals whenever relevant fields change
  useEffect(() => {
    if (!quote.items) return;

    let subtotal = 0;
    
    // Calculate each item's total
    const computedItems = quote.items.map(item => {
      let multiplier = 1;
      if (item.unit === 'sq ft') {
        const w = parseFloat(item.width as any) || 1;
        const h = parseFloat(item.height as any) || 1;
        multiplier = w * h;
      }
      
      const qty = item.qty || 0;
      const rate = item.rate || 0;
      const itemSubtotal = multiplier * qty * rate;
      const itemTotal = itemSubtotal - (item.discount || 0);
      subtotal += itemTotal;
      
      return { ...item, subtotal: itemSubtotal, total: itemTotal };
    });

    let discountAmount = quote.discountAmount || 0;
    if (quote.discountType === 'percentage') {
      discountAmount = subtotal * ((quote.discountValue || 0) / 100);
    } else {
      discountAmount = quote.discountValue || 0;
    }

    const afterDiscount = subtotal - discountAmount;
    const gstAmount = quote.applyGst ? afterDiscount * ((quote.gstRate || 18) / 100) : 0;
    const grandTotal = afterDiscount + gstAmount;

    setQuote(prev => {
      // Prevent infinite loop if nothing actually changed deeply
      if (prev.subtotal === subtotal && prev.grandTotal === grandTotal) return prev;
      return {
        ...prev,
        items: computedItems,
        subtotal,
        discountAmount,
        gstAmount,
        grandTotal
      };
    });
  }, [quote.items, quote.discountType, quote.discountValue, quote.applyGst, quote.gstRate]);


  const updateField = (field: keyof Quote, value: any) => {
    setQuote(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const addItem = () => {
    const newItem: QuoteLineItem = {
      id: uuidv4(),
      name: '',
      qty: undefined as any,
      rate: undefined as any,
      unit: 'unit',
      discount: 0,
      subtotal: 0,
      total: 0
    };
    updateField('items', [...(quote.items || []), newItem]);
  };

  const updateItem = (index: number, field: keyof QuoteLineItem, value: any) => {
    const newItems = [...(quote.items || [])];
    
    // Auto-fill from product selection
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
          newItems[index] = {
            ...newItems[index],
            productId: product.id,
            name: product.name,
            rate: product.baseRate,
            unit: product.unit,
            // Tech Specs
            series: product.series,
            glass: product.glass,
            reinforcement: product.reinforcement,
            frameJoins: product.frameJoins,
            flyscreen: product.flyscreen,
            color: product.color,
            track: product.track,
            trackRI: product.trackRI,
            slidingSash: product.slidingSash,
            slidingSashRI: product.slidingSashRI,
            flyscreenSash: product.flyscreenSash,
            interlock: product.interlock,
            flyMeshType: product.flyMeshType,
            guideRail: product.guideRail,
            handle: product.handle,
            flyscreenHandle: product.flyscreenHandle,
            slidingSashRoller: product.slidingSashRoller,
            flyscreenSashRoller: product.flyscreenSashRoller,
            // Default size
            width: product.defaultWidth,
            height: product.defaultHeight,
          };
        if (newItems[index].qty === undefined) {
          newItems[index].qty = 1;
        }
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    updateField('items', newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...(quote.items || [])];
    newItems.splice(index, 1);
    updateField('items', newItems);
  };



  const handleSave = () => {
    if (!quote.clientId) {
      alert("Please select a client.");
      return;
    }
    
    if (isEditing && id) {
      updateQuote(id, quote as Quote);
      setIsSaved(true);
    } else {
      const newId = uuidv4();
      const newQuote = { ...quote, id: newId, createdAt: Date.now(), updatedAt: Date.now() } as Quote;
      addQuote(newQuote);
      setIsSaved(true);
      navigate(`/quotes/${newId}`, { replace: true });
    }
  };

  const handleWhatsApp = () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }
    const client = clients.find(c => c.id === quote.clientId);
    if (!client?.phone) {
      alert("Client does not have a phone number.");
      return;
    }
    
    // Format: Hello [Name], Here is your quotation #[Number] from [Company]. 
    // Total: [Amount]. View here: [URL]
    const message = `Hello *${client.name}*,\n\nHere is your quotation *#${quote.quoteNumber}* from *${settings.features.companyName}*.\n\n*Grand Total:* ${formatCurrency(quote.grandTotal || 0)}\n\nYou can view and download the official PDF here:\n${window.location.origin}/print/${id}\n\nThank you!`;
    
    // Remove non-numeric characters for WA link
    const cleanPhone = client.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    
    const clientId = uuidv4();
    addClient({
      id: clientId,
      ...newClient,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    setQuote(prev => ({ ...prev, clientId }));
    setIsAddingClient(false);
    setNewClient({ name: '', phone: '', email: '', address: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateItem(index, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Inject jsPDF and AutoTable for native drawing (100% reliable, zero canvas crashes)
    const loadScripts = async () => {
      const jspdf = document.createElement('script');
      jspdf.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jspdf.async = true;
      
      const autotable = document.createElement('script');
      autotable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
      autotable.async = true;

      jspdf.onload = () => {
        document.body.appendChild(autotable);
      };
      
      autotable.onload = () => {
        console.log("PDF Native Engine Loaded");
        setLibLoaded(true);
      };

      document.body.appendChild(jspdf);
    };

    loadScripts();
  }, []);

  const handlePrint = () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }
    // Open in print mode which auto-triggers window.print()
    window.open(`/print/${id}?mode=print`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }

    const existing = document.getElementById('pdf-capture-frame');
    if (existing) {
      document.body.removeChild(existing);
    }

    setIsGeneratingPDF(true);
    const iframe = document.createElement('iframe');
    iframe.id = 'pdf-capture-frame';
    iframe.style.display = 'none';
    iframe.src = `/print/${id}?auto=download`;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
      setIsGeneratingPDF(false);
    }, 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const columns = 6; // productId, width, height, qty, unit, rate
    const rows = quote.items?.length || 0;

    let nextRow = rowIndex;
    let nextCol = colIndex;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (colIndex < columns - 1) {
        nextCol = colIndex + 1;
        e.preventDefault();
      } else if (rowIndex < rows - 1) {
        nextRow = rowIndex + 1;
        nextCol = 0;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (colIndex > 0) {
        nextCol = colIndex - 1;
        e.preventDefault();
      } else if (rowIndex > 0) {
        nextRow = rowIndex - 1;
        nextCol = columns - 1;
        e.preventDefault();
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      addItem();
      setTimeout(() => {
        const nextElement = document.getElementById(`cell-${rowIndex + 1}-0`);
        nextElement?.focus();
      }, 10);
      return;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // If it's a select column, let the browser handle it.
      // We will try showPicker to programmatically open it.
      if (colIndex === 0 || colIndex === 4) {
        const element = e.target as HTMLSelectElement;
        if (element && typeof element.showPicker === 'function') {
          try {
            element.showPicker();
            e.preventDefault();
            return;
          } catch (err) {
            // Error means it's ALREADY open, or not available.
            // DO NOT prevent default here! Let the browser natively select the item.
            return;
          }
        }
        return; // Don't move down; rely on native behavior for opening selectors
      }
      
      // Default Enter behavior: Move Down
      if (rowIndex < rows - 1) {
        nextRow = rowIndex + 1;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowDown') {
      if (rowIndex < rows - 1) {
        nextRow = rowIndex + 1;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowUp') {
      if (rowIndex > 0) {
        nextRow = rowIndex - 1;
        e.preventDefault();
      }
    }

    if (nextRow !== rowIndex || nextCol !== colIndex) {
      const nextElement = document.getElementById(`cell-${nextRow}-${nextCol}`);
      nextElement?.focus();
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">
              {isEditing ? `Edit Quote ${quote.quoteNumber}` : 'New Quote'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50" onClick={handleWhatsApp}>
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button 
                variant="primary" 
                className="gap-2 bg-blue-600 text-white border-none hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all" 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </Button>
            </>
          )}
          <Button variant="primary" className="gap-2 shadow-xl shadow-blue-500/20" onClick={handleSave} disabled={isSaved}>
            <Save className="w-4 h-4" />
            {isSaved ? 'Saved Successfully' : 'Save Quote'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="print:shadow-none print:border-none shadow-xl border-t-4 border-blue-600">
          <CardHeader className="border-b border-slate-200 bg-white print:bg-transparent">
            <CardTitle className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Client & Quote Context</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="flex items-end gap-2 print:hidden">
                <div className="flex-1">
                  <Select 
                    label="Select Client" 
                    value={quote.clientId || ''} 
                    onChange={(e) => updateField('clientId', e.target.value)}
                    disabled={isSaved}
                  >
                    <option value="" disabled>-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <Button 
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="rounded-xl h-[42px] w-[42px] flex items-center justify-center shrink-0 mb-0.5 shadow-sm"
                  onClick={() => setIsAddingClient(true)}
                  disabled={isSaved}
                  title="Quick Add Client"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="hidden print:block">
                <h2 className="text-xl font-bold text-slate-900">{clients.find(c => c.id === quote.clientId)?.name}</h2>
                <p className="text-slate-600">{clients.find(c => c.id === quote.clientId)?.address}</p>
                <p className="text-slate-600">{clients.find(c => c.id === quote.clientId)?.phone}</p>
              </div>
            </div>

            <div className="md:col-span-1">
               <div className="space-y-1 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Reference #</span>
                  <p className="font-black text-slate-900 text-lg">{quote.quoteNumber}</p>
               </div>
            </div>

            <div className="md:col-span-1">
              <Select 
                label="Process Status" 
                value={quote.status || 'Draft'}
                onChange={(e) => updateField('status', e.target.value)}
                disabled={isSaved}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Rejected">Rejected</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-none shadow-2xl border-slate-200 overflow-hidden rounded-2xl bg-white min-h-[600px]">
            <CardHeader className="border-b border-slate-200 bg-slate-50 flex flex-row items-center justify-between print:hidden py-3 px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <FileText className="w-4 h-4" />
                </div>
                <CardTitle className="text-xs uppercase font-black text-slate-500 tracking-widest">Quote Sheet</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={addItem} className="h-8 gap-2 border-slate-200" disabled={isSaved}>
                <Plus className="w-4 h-4" /> New Row (Enter)
              </Button>
            </CardHeader>
            <div className="p-0 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <th className="px-4 py-3 min-w-[200px] border-r border-slate-100">Product Catalog</th>
                    <th className="px-2 py-3 w-20 text-center border-r border-slate-100">W (ft)</th>
                    <th className="px-2 py-3 w-20 text-center border-r border-slate-100">H (ft)</th>
                    <th className="px-2 py-3 w-20 text-center border-r border-slate-100">Qty</th>
                    <th className="px-2 py-3 w-24 text-center border-r border-slate-100">Unit</th>
                    <th className="px-4 py-3 w-28 text-right border-r border-slate-100">Rate (₹)</th>
                    <th className="px-4 py-3 w-32 text-right">Total</th>
                    <th className="px-2 py-3 w-10 text-right print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!quote.items || quote.items.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center">
                        <Button variant="outline" onClick={addItem} className="gap-2 border-dashed border-2">
                          <Plus className="w-4 h-4" /> Start Building Sheet
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    quote.items.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="p-0 border-r border-slate-100 relative">
                           <select 
                            id={`cell-${index}-0`}
                            className="w-full h-11 px-4 py-1 text-sm font-bold bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 appearance-none transition-all cursor-pointer disabled:cursor-default" 
                            disabled={isSaved}
                            value={item.productId || ''}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 0)}
                           >
                             <option value="" disabled>Select Product...</option>
                             {products.map(p => (
                               <option key={p.id} value={p.id}>{p.name}</option>
                             ))}
                           </select>
                           <div className="px-4 pb-2 print:hidden">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-6 text-[10px] uppercase font-bold tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                               onClick={() => setEditingItemIndex(index)}
                               disabled={isSaved}
                             >
                               {item.description || item.image ? 'Edit Specs/Image' : '+ Add Specs/Image'}
                             </Button>
                           </div>
                           <div className="hidden print:block px-4 font-bold text-sm">{item.name}</div>
                        </td>
                        <td className="p-0 border-r border-slate-100 hidden md:table-cell">
                          <input 
                            id={`cell-${index}-1`}
                            type="number" 
                            className="w-full h-11 px-2 text-center font-bold bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all disabled:opacity-20" 
                            disabled={isSaved || item.unit !== 'sq ft'}
                            value={item.width ?? ''}
                            onChange={(e) => updateItem(index, 'width', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 1)}
                            placeholder="-"
                          />
                        </td>
                        <td className="p-0 border-r border-slate-100 hidden md:table-cell">
                          <input 
                            id={`cell-${index}-2`}
                            type="number" 
                            className="w-full h-11 px-2 text-center font-bold bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all disabled:opacity-20" 
                            disabled={isSaved || item.unit !== 'sq ft'}
                            value={item.height ?? ''}
                            onChange={(e) => updateItem(index, 'height', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 2)}
                            placeholder="-"
                          />
                        </td>
                        <td className="p-0 border-r border-slate-100">
                          <input 
                            id={`cell-${index}-3`}
                            type="number" 
                            className="w-full h-11 px-2 text-center font-bold bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all disabled:opacity-50" 
                            disabled={isSaved}
                            value={item.qty ?? ''}
                            onChange={(e) => updateItem(index, 'qty', e.target.value === '' ? undefined : parseInt(e.target.value))}
                            onKeyDown={(e) => handleKeyDown(e, index, 3)}
                          />
                        </td>
                        <td className="p-0 border-r border-slate-100">
                          <select 
                            id={`cell-${index}-4`}
                            className="w-full h-11 px-2 py-1 text-center text-[10px] font-black uppercase bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 appearance-none transition-all cursor-pointer disabled:cursor-default"
                            disabled={isSaved}
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 4)}
                          >
                            <option value="sq ft">Sq Ft</option>
                            <option value="unit">Unit</option>
                            <option value="running ft">Rft</option>
                          </select>
                        </td>
                        <td className="p-0 border-r border-slate-100">
                           <input 
                              id={`cell-${index}-5`}
                              type="number" 
                              className="w-full h-11 px-4 text-right font-bold bg-transparent outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all disabled:opacity-50" 
                              disabled={isSaved}
                              value={item.rate ?? ''}
                              onChange={(e) => updateItem(index, 'rate', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                              onKeyDown={(e) => handleKeyDown(e, index, 5)}
                            />
                        </td>
                        <td className="px-4 py-1 text-right font-black text-slate-900 text-sm bg-slate-50/30">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-2 py-1 text-right print:hidden">
                          <button 
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                            disabled={isSaved}
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 border-t border-slate-200 bg-slate-50/50 backdrop-blur-sm flex justify-end">
               <div className="w-full max-w-sm space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                      <span>Subtotal</span>
                      <span className="text-sm text-slate-900 font-black">{formatCurrency(quote.subtotal || 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Discount (%)</span>
                      <div className="flex items-center gap-2 print:hidden">
                        <Input 
                          type="number" 
                          className="w-24 h-9 text-right font-black bg-white border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/5 transition-all"
                          value={quote.discountValue || ''}
                          onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                        <div className="w-10 h-9 flex items-center justify-center bg-slate-100 border border-slate-200 rounded-lg text-xs font-black text-slate-500 select-none">
                          %
                        </div>
                      </div>
                      <span className="hidden print:inline font-black text-red-500 text-sm">
                        - {formatCurrency(quote.discountAmount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">GST</span>
                        <Select 
                          className="w-24 h-9 font-bold bg-white border-slate-200 rounded-lg focus:ring-4 focus:ring-blue-500/5 print:hidden"
                          value={quote.applyGst ? quote.gstRate?.toString() : '0'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '0') updateField('applyGst', false);
                            else {
                               updateField('applyGst', true);
                               updateField('gstRate', parseInt(val));
                            }
                          }}
                        >
                          <option value="0">Exempt</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </Select>
                        <span className="hidden print:inline text-slate-500 font-black text-xs">({quote.applyGst ? quote.gstRate : 0}%)</span>
                      </div>
                      <span className="font-black text-slate-900 text-sm">{formatCurrency(quote.gstAmount || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t-2 border-slate-200 flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Final Payable Amount</span>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter">
                      {formatCurrency(quote.grandTotal || 0)}
                    </div>
                  </div>
               </div>
            </div>
          </Card>

        </div>

        <Card className="print:shadow-none print:border-none shadow-xl border-slate-200 overflow-hidden rounded-2xl bg-white mt-6">
          <CardHeader className="border-b border-slate-200 bg-slate-50 flex flex-row items-center justify-between py-3 px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <FileText className="w-4 h-4" />
              </div>
              <CardTitle className="text-xs uppercase font-black text-slate-500 tracking-widest">Additional Terms & Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <textarea
              className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-h-[150px] text-slate-800 transition-all font-medium leading-relaxed bg-slate-50/30"
              value={quote.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Installation details, delivery terms, payment conditions..."
              disabled={isSaved}
            />
          </CardContent>
        </Card>

      {/* QUICK ADD CLIENT MODAL */}
      {isAddingClient && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddingClient(false)} />
          <Card className="relative w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Quick Add Client</CardTitle>
              <p className="text-sm text-slate-500">Create a new client profile instantly.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickAddClient} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                  <Input 
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    autoFocus
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone</label>
                    <Input 
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="99999 55555"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
                    <Input 
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Address</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-h-[80px] bg-slate-50/30"
                    value={newClient.address}
                    onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street, City, Zip"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddingClient(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Client
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {editingItemIndex !== null && quote.items && quote.items[editingItemIndex] && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingItemIndex(null)} />
          <Card className="relative w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Item Details & Specs</CardTitle>
              <p className="text-sm text-slate-500">Add detailed specifications and an image for {quote.items[editingItemIndex].name || 'this item'}.</p>
            </CardHeader>
            <CardContent className="h-[70vh] overflow-y-auto">
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Tech Details */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* SECTION: Identity & Framing */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        Series & Framing
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Series" value={quote.items[editingItemIndex].series || ''} onChange={e => updateItem(editingItemIndex, 'series', e.target.value)} />
                        <Input label="Glass Detail" value={quote.items[editingItemIndex].glass || ''} onChange={e => updateItem(editingItemIndex, 'glass', e.target.value)} />
                        <Input label="Color" value={quote.items[editingItemIndex].color || ''} onChange={e => updateItem(editingItemIndex, 'color', e.target.value)} />
                        <Input label="Reinforcement" value={quote.items[editingItemIndex].reinforcement || ''} onChange={e => updateItem(editingItemIndex, 'reinforcement', e.target.value)} />
                        <Input label="Frame Joins" value={quote.items[editingItemIndex].frameJoins || ''} onChange={e => updateItem(editingItemIndex, 'frameJoins', e.target.value)} />
                        <Input label="Flyscreen Type" value={quote.items[editingItemIndex].flyscreen || ''} onChange={e => updateItem(editingItemIndex, 'flyscreen', e.target.value)} />
                      </div>
                    </div>

                    {/* SECTION: Track & Sash */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        Track & Sash Components
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Track Specs" value={quote.items[editingItemIndex].track || ''} onChange={e => updateItem(editingItemIndex, 'track', e.target.value)} />
                        <Input label="Track RI" value={quote.items[editingItemIndex].trackRI || ''} onChange={e => updateItem(editingItemIndex, 'trackRI', e.target.value)} />
                        <Input label="Sliding Sash" value={quote.items[editingItemIndex].slidingSash || ''} onChange={e => updateItem(editingItemIndex, 'slidingSash', e.target.value)} />
                        <Input label="Sliding Sash RI" value={quote.items[editingItemIndex].slidingSashRI || ''} onChange={e => updateItem(editingItemIndex, 'slidingSashRI', e.target.value)} />
                        <Input label="Flyscreen Sash" value={quote.items[editingItemIndex].flyscreenSash || ''} onChange={e => updateItem(editingItemIndex, 'flyscreenSash', e.target.value)} />
                        <Input label="Interlock" value={quote.items[editingItemIndex].interlock || ''} onChange={e => updateItem(editingItemIndex, 'interlock', e.target.value)} />
                        <Input label="Sliding Sash Roller" value={quote.items[editingItemIndex].slidingSashRoller || ''} onChange={e => updateItem(editingItemIndex, 'slidingSashRoller', e.target.value)} />
                        <Input label="Flyscreen Sash Roller" value={quote.items[editingItemIndex].flyscreenSashRoller || ''} onChange={e => updateItem(editingItemIndex, 'flyscreenSashRoller', e.target.value)} />
                      </div>
                    </div>

                    {/* SECTION: Hardware & Meshes */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        Hardware & Meshes
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Fly Mesh Type" value={quote.items[editingItemIndex].flyMeshType || ''} onChange={e => updateItem(editingItemIndex, 'flyMeshType', e.target.value)} />
                        <Input label="Guide Rail" value={quote.items[editingItemIndex].guideRail || ''} onChange={e => updateItem(editingItemIndex, 'guideRail', e.target.value)} />
                        <Input label="Handle" value={quote.items[editingItemIndex].handle || ''} onChange={e => updateItem(editingItemIndex, 'handle', e.target.value)} />
                        <Input label="Flyscreen Handle" value={quote.items[editingItemIndex].flyscreenHandle || ''} onChange={e => updateItem(editingItemIndex, 'flyscreenHandle', e.target.value)} />
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Additional Item Notes</label>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-h-[80px] bg-slate-50/30"
                        value={quote.items[editingItemIndex].description || ''}
                        onChange={(e) => updateItem(editingItemIndex, 'description', e.target.value)}
                        placeholder="Any extra instructions or custom notes for this specific item..."
                      />
                    </div>
                  </div>

                  {/* Right Column: Visuals */}
                  <div className="lg:col-span-4 space-y-6">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Visualization Mode</label>
                      <Select 
                        value={quote.items[editingItemIndex].displayMode || 'diagram'} 
                        onChange={e => updateItem(editingItemIndex, 'displayMode', e.target.value as 'diagram' | 'image')}
                        className="mt-2"
                      >
                        <option value="diagram">📐 Drawing Diagram (Demo)</option>
                        <option value="image">🖼️ Product Photo (Actual)</option>
                      </Select>
                    </div>

                    {quote.items[editingItemIndex].displayMode === 'image' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Product Photo</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] bg-slate-50 relative overflow-hidden">
                          {quote.items[editingItemIndex].image ? (
                            <>
                              <img src={quote.items[editingItemIndex].image} alt="Product" className="object-contain h-full w-full absolute inset-0 p-2" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" onClick={() => updateItem(editingItemIndex, 'image', undefined)}>Remove Photo</Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <Plus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm font-medium text-slate-500">Upload Image</p>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, editingItemIndex)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {quote.items[editingItemIndex].displayMode === 'diagram' && (
                      <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col items-center justify-center min-h-[200px] text-center space-y-3">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                           <LayoutTemplate className="w-6 h-6" />
                         </div>
                         <p className="text-sm font-bold text-blue-900">Diagram View Active</p>
                         <p className="text-[10px] text-blue-600 font-medium px-4">
                           This item will show a professional CSS window diagram with width/height labels on the bill.
                         </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button onClick={() => setEditingItemIndex(null)}>
                    Done
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
