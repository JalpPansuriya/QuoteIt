import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Trash2, Save, Printer, ArrowLeft, Mail } from 'lucide-react';
import { formatCurrency, generateQuoteNumber } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Quote, QuoteLineItem, Unit } from '../types';

export function QuoteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotes, addQuote, updateQuote, clients, products, settings } = useStore();

  const isEditing = id && id !== 'new';
  
  const [quote, setQuote] = useState<Partial<Quote>>({
    quoteNumber: '',
    clientId: '',
    status: 'Draft',
    date: Date.now(),
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    items: [],
    subtotal: 0,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    applyGst: settings.features.defaultGstEnabled,
    gstRate: settings.features.defaultGstRate,
    gstAmount: 0,
    grandTotal: 0,
    notes: 'Installation and delivery not included. \nValidity: 30 days.',
    terms: '50% advance along with P.O. \nBalance against delivery delivery.',
  });

  useEffect(() => {
    if (isEditing) {
      const existingQuote = quotes.find(q => q.id === id);
      if (existingQuote) {
        setQuote(existingQuote);
      } else {
        navigate('/quotes');
      }
    } else {
      // Generate new quote number
      const lastQuote = quotes.length > 0 ? quotes[quotes.length - 1] : undefined;
      setQuote(prev => ({
        ...prev,
        quoteNumber: generateQuoteNumber(lastQuote?.quoteNumber)
      }));
    }
  }, [id, quotes, isEditing, navigate]);

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
      
      const itemSubtotal = multiplier * item.qty * item.rate;
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
  };

  const addItem = () => {
    const newItem: QuoteLineItem = {
      id: uuidv4(),
      name: '',
      qty: 1,
      rate: 0,
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
        };
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
    } else {
      const newQuote = { ...quote, id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() } as Quote;
      addQuote(newQuote);
      navigate(`/quotes/${newQuote.id}`, { replace: true });
    }
  };

  const handlePrint = () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }
    window.open(`/print/${id}`, '_blank');
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
              <Button variant="outline" className="gap-2" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Print / PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </>
          )}
          <Button variant="primary" className="gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Quote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="print:shadow-none print:border-none shadow-xl border-t-4 border-blue-600">
            <CardHeader className="border-b border-slate-200 bg-white print:bg-transparent">
              <CardTitle className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Select Client" 
                value={quote.clientId || ''} 
                onChange={(e) => updateField('clientId', e.target.value)}
                className="print:hidden"
              >
                <option value="" disabled>-- Choose Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              
              <div className="hidden print:block md:col-span-2">
                <h2 className="text-xl font-bold text-slate-900">{clients.find(c => c.id === quote.clientId)?.name}</h2>
                <p className="text-slate-600">{clients.find(c => c.id === quote.clientId)?.address}</p>
                <p className="text-slate-600">{clients.find(c => c.id === quote.clientId)?.phone}</p>
              </div>

              <div className="print:hidden">
                <Select 
                  label="Status" 
                  value={quote.status || 'Draft'}
                  onChange={(e) => updateField('status', e.target.value)}
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

          <Card className="print:shadow-none print:border-none shadow-xl">
            <CardHeader className="border-b border-slate-200 bg-white flex flex-row items-center justify-between print:hidden">
              <CardTitle className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem} className="h-8 gap-1">
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-slate-200">
                  <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                    <th className="px-4 py-3 min-w-[200px]">Product / Description</th>
                    <th className="px-4 py-3 w-24 hidden md:table-cell">W (ft)</th>
                    <th className="px-4 py-3 w-24 hidden md:table-cell">H (ft)</th>
                    <th className="px-4 py-3 w-20">Qty</th>
                    <th className="px-4 py-3 w-24">Unit</th>
                    <th className="px-4 py-3 w-28">Rate</th>
                    <th className="px-4 py-3 w-32 text-right">Total</th>
                    <th className="px-4 py-3 w-10 text-right print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {(!quote.items || quote.items.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No items added. Click 'Add Item' to start.
                      </td>
                    </tr>
                  ) : (
                    quote.items.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                             <Select 
                              className="h-10 py-1 text-base print:hidden" 
                              value={item.productId || ''}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                             >
                               <option value="" disabled>Select Product</option>
                               {products.map(p => (
                                 <option key={p.id} value={p.id}>{p.name}</option>
                               ))}
                             </Select>
                             <Input 
                              placeholder="Product name or description" 
                              className="h-10 text-base"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                            />
                            <div className="hidden print:block font-medium">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell align-top">
                          <Input 
                            type="number" 
                            className="h-10 px-3 text-base min-w-[80px]" 
                            disabled={item.unit !== 'sq ft'}
                            value={item.width || ''}
                            onChange={(e) => updateItem(index, 'width', e.target.value)}
                            placeholder={item.unit === 'sq ft' ? 'W' : '-'}
                          />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell align-top">
                          <Input 
                            type="number" 
                            className="h-10 px-3 text-base min-w-[80px]" 
                            disabled={item.unit !== 'sq ft'}
                            value={item.height || ''}
                            onChange={(e) => updateItem(index, 'height', e.target.value)}
                            placeholder={item.unit === 'sq ft' ? 'H' : '-'}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input 
                            type="number" 
                            className="h-10 px-3 text-base min-w-[80px]" 
                            value={item.qty}
                            onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Select 
                            className="h-10 py-1 px-3 text-base min-w-[100px]"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          >
                            <option value="sq ft">Sq Ft</option>
                            <option value="unit">Unit</option>
                            <option value="running ft">Rft</option>
                          </Select>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input 
                            type="number" 
                            className="h-10 px-3 text-base min-w-[100px]" 
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 align-top pt-5">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3 text-right align-top pt-4 print:hidden">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-red-500 h-10 w-10 p-0"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
               <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">{formatCurrency(quote.subtotal || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-600">Discount (5%)</span>
                    <div className="flex items-center gap-2 print:hidden">
                      <Input 
                        type="number" 
                        className="w-20 h-8 text-right bg-white"
                        value={quote.discountValue || ''}
                        onChange={(e) => updateField('discountValue', parseFloat(e.target.value) || 0)}
                      />
                      <Select 
                        className="w-20 h-8 py-1 bg-white"
                        value={quote.discountType}
                        onChange={(e) => updateField('discountType', e.target.value)}
                      >
                        <option value="flat">₹</option>
                        <option value="percentage">%</option>
                      </Select>
                    </div>
                    <span className="hidden print:inline font-bold text-green-600">
                      - {formatCurrency(quote.discountAmount || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">GST (18%)</span>
                      <Select 
                        className="w-20 h-8 py-1 bg-white print:hidden"
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
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </Select>
                      <span className="hidden print:inline text-slate-600">({quote.applyGst ? quote.gstRate : 0}%)</span>
                    </div>
                    <span className="font-medium text-slate-900">{formatCurrency(quote.gstAmount || 0)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 mt-4 flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Grand Total</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(quote.grandTotal || 0)}</span>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="print:hidden shadow-xl">
            <CardHeader className="border-b border-slate-200 bg-white">
              <CardTitle className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1 text-sm">
                <span className="text-slate-500">Quote Number</span>
                <p className="font-bold text-slate-900 text-lg">{quote.quoteNumber}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Notes / Terms</label>
                <textarea
                  className="w-full rounded border border-slate-300 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] text-slate-800"
                  value={quote.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Installation details, delivery terms..."
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Print specific terms display */}
          <div className="hidden print:block mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terms</div>
             <p className="text-[10px] text-slate-500 leading-tight whitespace-pre-wrap">{quote.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
