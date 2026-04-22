import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Plus, Trash2, Save, Printer, ArrowLeft, Mail, FileText, MessageCircle, Share2, Loader2 } from 'lucide-react';
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
    notes: 'Installation and delivery not included. \nValidity: 30 days.',
    terms: '50% advance along with P.O. \nBalance against delivery delivery.',
  });

  useEffect(() => {
    if (isLoading) return;

    if (isEditing) {
      const existingQuote = quotes.find(q => q.id === id);
      if (existingQuote) {
        setQuote(existingQuote);
        setIsSaved(false); // Reset lock state for the new quote
      } else if (quotes.length > 0) {
        // If we finished loading and still can't find it
        navigate('/quotes');
      }
    } else {
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
        notes: 'Installation and delivery not included. \nValidity: 30 days.',
        terms: '50% advance along with P.O. \nBalance against delivery delivery.',
      });
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

  const [isSaved, setIsSaved] = useState(false);

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
    window.open(`/print/${id}?mode=print`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }
    
    if (!libLoaded || !(window as any).jspdf) {
      alert("PDF native engine is still initializing. Please wait a moment.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF();
      const client = clients.find(c => c.id === quote.clientId);

      const margin = 15;
      let yPos = 20;

      // --- HEADER ---
      // Company Name (Left)
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(settings.features.companyName || "COMPANY", margin, yPos);
      
      // Tagline (Left)
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text((settings.features.companyTagline || "").toUpperCase(), margin, yPos);

      // Quotation Title (Right)
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("QUOTATION", 195, 20, { align: "right" });
      
      // Quote Details (Right)
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`#${quote.quoteNumber}`, 195, 27, { align: "right" });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text(new Date(quote.date || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(), 195, 33, { align: "right" });

      yPos += 15;
      
      // Divider
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, 195, yPos);
      yPos += 12;

      // Safe currency formatter for native PDF (standard fonts don't support root Rupee symbol)
      const safeCurrency = (amount: number) => formatCurrency(amount).replace('₹', 'Rs. ');

      // --- CLIENT INFO ---
      // From
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("FROM", margin, yPos);
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(settings.features.companyName || "", margin, yPos + 6);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Professional Quotation Services", margin, yPos + 11);

      // To
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("CLIENT", 195, yPos, { align: "right" });
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(client?.name || "Valued Customer", 195, yPos + 6, { align: "right" });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      
      let clientInfoY = yPos + 12;
      if (client?.address) {
        const addressLines = doc.splitTextToSize(client.address, 80);
        doc.text(addressLines, 195, clientInfoY, { align: "right" });
        clientInfoY += (addressLines.length * 4); // add 4mm per line
      } else {
        clientInfoY += 4;
      }
      
      if (client?.phone) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(client.phone, 195, clientInfoY + 2, { align: "right" });
      }

      yPos += 35; // increased margin to prevent overlap

      // --- TABLE ---
      const tableData = (quote.items || []).map((item) => {
        let dimensions = "-";
        if (item.unit === 'sq ft') {
          dimensions = `${item.width} x ${item.height} Sq Ft`;
        }
        return [
          item.name,
          dimensions,
          item.qty.toString(),
          safeCurrency(item.rate),
          safeCurrency(item.total)
        ];
      });

      (doc as any).autoTable({
        startY: yPos,
        head: [['ITEM DESCRIPTION', 'DIMENSIONS', 'QTY', 'RATE', 'TOTAL']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          fillColor: [15, 23, 42], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 8,
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [15, 23, 42], // slate-900
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center', textColor: [100, 116, 139] },
          2: { halign: 'center', fontStyle: 'bold' },
          3: { halign: 'right', textColor: [100, 116, 139] },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        didDrawCell: (data: any) => {
           // Draw border bottom for each row
           if (data.row.section === 'body') {
             doc.setDrawColor(241, 245, 249);
             doc.setLineWidth(0.1);
             doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
           }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // --- TOTALS BOX ---
      // We manually draw a nice summary box on the right
      const boxWidth = 80;
      const boxX = 195 - boxWidth;
      
      // Draw light gray background box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.5);
      doc.roundedRect(boxX, yPos, boxWidth, 42, 3, 3, "FD");

      let currentY = yPos + 8;
      
      // Subtotal
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("SUBTOTAL", boxX + 6, currentY);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(safeCurrency(quote.subtotal || 0), boxX + boxWidth - 6, currentY, { align: "right" });
      
      // Discount
      currentY += 7;
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129); // emerald-500 (green)
      doc.text(`DISCOUNT (${quote.discountValue}%)`, boxX + 6, currentY);
      doc.setFontSize(9);
      doc.text(`-${safeCurrency(quote.discountAmount || 0)}`, boxX + boxWidth - 6, currentY, { align: "right" });
      
      // GST
      currentY += 7;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`GST (${quote.applyGst ? quote.gstRate : 0}%)`, boxX + 6, currentY);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(safeCurrency(quote.gstAmount || 0), boxX + boxWidth - 6, currentY, { align: "right" });

      // Total Line
      currentY += 5;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(boxX + 6, currentY, boxX + boxWidth - 6, currentY);
      
      // Grand Total
      currentY += 9;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("TOTAL PAYABLE", boxX + 6, currentY);
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(safeCurrency(quote.grandTotal || 0), boxX + boxWidth - 6, currentY, { align: "right" });

      // --- NOTES ---
      if (quote.notes) {
         // Place notes below table but not overlapping the total box
         const notesY = (doc as any).lastAutoTable.finalY + 15;
         doc.setFontSize(9);
         doc.setFont("helvetica", "bold");
         doc.setTextColor(148, 163, 184); // slate-400
         doc.text("TERMS & NOTES", margin, notesY);
         
         doc.setFontSize(9);
         doc.setFont("helvetica", "normal");
         doc.setTextColor(100, 116, 139); // slate-500
         doc.text(quote.notes, margin, notesY + 5, { maxWidth: boxX - margin - 10 });
      }

      // --- FOOTER ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Generated by Quoteit", 105, pageHeight - 15, { align: "center" });
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("Powered by BoostifyCorp", 105, pageHeight - 10, { align: "center" });

      // 6. Direct Save
      doc.save(`${quote.quoteNumber || 'quotation'}.pdf`);
    } catch (err: any) {
      console.error("PDF Engine Error:", err);
      alert(`Final PDF Error: "${err.message || 'Unknown'}"\n\nFallback: Please use standard 'Print' mode.`);
    } finally {
      setIsGeneratingPDF(false);
    }
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
    </div>
  );
}
