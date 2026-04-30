import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Combobox } from '../components/ui/Combobox';
import { Plus, Trash2, Save, Printer, ArrowLeft, Mail, FileText, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { formatCurrency, generateQuoteNumber } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Quote, QuoteLineItem, Unit } from '../types';
import { WindowSchematic } from '../components/WindowSchematic';
import { ProductionStatusBadge, ProductionStatus } from '../components/ProductionStatusBadge';

export function QuoteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { quotes, addQuote, updateQuote, clients, addClient, products, projects, settings, isLoading } = useStore();
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
        const searchParams = new URLSearchParams(location.search);
        const paramProjectId = searchParams.get('projectId');
        const paramClientId = searchParams.get('clientId');

        // Logic for new quote - reset and generate number
        const lastQuote = quotes.length > 0 ? quotes[quotes.length - 1] : undefined;
        setQuote({
          quoteNumber: generateQuoteNumber(lastQuote?.quoteNumber),
          clientId: paramClientId || '',
          projectId: paramProjectId || '',
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
  }, [id, quotes, isEditing, isLoading, navigate, settings.features, location.search]);

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
    window.open(`/print/${id}?mode=print`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!isEditing) {
      alert("Please save the quote first.");
      return;
    }
    
    if (!libLoaded || !(window as any).jspdf) {
      alert("PDF engine is still initializing.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const client = clients.find(c => c.id === quote.clientId);
      const margin = 10;
      let yPos = 15;

      const safeCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

      const drawPageBorder = (d: any) => {
        d.setDrawColor(150, 150, 150);
        d.setLineWidth(0.3);
        d.rect(5, 5, 200, 287);
      };

      drawPageBorder(doc);

      // Helper to get logo natural dimensions
      const getImgInfo = (src: string): Promise<{w: number, h: number}> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = src;
        });
      };

      // --- HEADER ---
      // Logo (Left)
      if (settings.features.companyLogo) {
        try {
          const dims = await getImgInfo(settings.features.companyLogo);
          let logoW = 25;
          let logoH = 25;
          if (dims.w > 0 && dims.h > 0) {
            const maxH = 20;
            const maxW = 50;
            const ratio = dims.w / dims.h;
            logoH = maxH;
            logoW = logoH * ratio;
            if (logoW > maxW) {
              logoW = maxW;
              logoH = logoW / ratio;
            }
          }
          // Set fixed Y coordinate to exactly align with the Quotation title
          doc.addImage(settings.features.companyLogo, 'PNG', margin, 10, logoW, logoH);
        } catch (e) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(settings.features.companyName || "Prince Windows", margin, yPos);
        }
      } else {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(settings.features.companyName || "Prince Windows", margin, yPos);
      }

      // Center Title
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Quotation", 105, yPos + 5, { align: "center" });

      // Right Side Info
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(settings.features.companyName || "Prince Windows", 200, yPos + 2, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text((settings.features.companyTagline || "WE MAKE WINDOWS"), 200, yPos + 7, { align: "right" });

      // Divider
      yPos += 15;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, 200, yPos);

      // --- PROJECT INFO ---
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      
      doc.text("Project no.", margin, yPos);
      doc.text("Project name", margin, yPos + 5);
      doc.text("Client name", margin, yPos + 10);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(": " + (quote.quoteNumber?.replace(/\D/g, '') || '0003'), margin + 25, yPos);
      doc.text(": " + (client?.name?.toUpperCase() || 'RAJ'), margin + 25, yPos + 5);
      doc.text(": " + (client?.name?.toUpperCase() || 'RAJ'), margin + 25, yPos + 10);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Date: " + new Date(quote.date || Date.now()).toLocaleDateString('en-GB'), 200, yPos, { align: "right" });

      // --- ITEMS TABLE ---
      yPos += 20;
      
      const drawWindowSchematic = (doc: any, x: number, y: number, w: number, h: number, sections: number) => {
        const boxW = 35;
        const boxH = 25;
        const centerX = x + 20;
        const centerY = y + 15;

        // Frame
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.4);
        doc.rect(centerX - (boxW/2), centerY - (boxH/2), boxW, boxH);

        // Panels
        const panelW = boxW / sections;
        for(let i=0; i<sections; i++) {
          const px = centerX - (boxW/2) + (i * panelW);
          doc.setFillColor(224, 251, 252);
          doc.rect(px + 0.5, centerY - (boxH/2) + 0.5, panelW - 1, boxH - 1, 'F');
          doc.setDrawColor(30, 41, 59);
          doc.rect(px + 0.5, centerY - (boxH/2) + 0.5, panelW - 1, boxH - 1, 'S');
          
          // Slider Arrow
          doc.setDrawColor(148, 163, 184);
          doc.setLineWidth(0.2);
          const arrowY = centerY;
          doc.line(px + 5, arrowY, px + panelW - 5, arrowY);
          if (i >= Math.ceil(sections/2)) {
            doc.line(px + 5, arrowY, px + 7, arrowY - 2);
            doc.line(px + 5, arrowY, px + 7, arrowY + 2);
          } else {
            doc.line(px + panelW - 5, arrowY, px + panelW - 7, arrowY - 2);
            doc.line(px + panelW - 5, arrowY, px + panelW - 7, arrowY + 2);
          }
        }

        // Dimensions
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text(w.toString(), centerX, centerY - (boxH/2) - 2, { align: "center" });
        doc.text(h.toString(), centerX + (boxW/2) + 2, centerY, { align: "left" });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(`AREA: ${(w*h).toFixed(0)} SQ FT²`, centerX, centerY + (boxH/2) + 8, { align: "center" });
      };

      // Table Header
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPos, 190, 10);
      
      const cols = [
        { label: "Type", x: margin, w: 75 },
        { label: "Width", x: margin + 75, w: 18 },
        { label: "Height", x: margin + 93, w: 18 },
        { label: "ft²", x: margin + 111, w: 18 },
        { label: "Unit price Rs.", x: margin + 129, w: 25 },
        { label: "Qt.", x: margin + 154, w: 12 },
        { label: "Subtotal Rs.", x: margin + 166, w: 24 }
      ];

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      cols.forEach(c => {
        doc.text(c.label, c.x + (c.w/2), yPos + 6, { align: "center" });
        if (c.x > margin) doc.line(c.x, yPos, c.x, yPos + 10);
      });

      yPos += 10;

      (quote.items || []).forEach((item, index) => {
        const itemH = 65;
        if (yPos + itemH > 280) {
           doc.setFontSize(7);
           doc.setTextColor(150, 150, 150);
           doc.text(`Page 1 of 2`, 105, 285, { align: "center" });
           doc.addPage();
           drawPageBorder(doc);
           yPos = 20;
        }

        // Main Box
        doc.setDrawColor(120, 120, 120);
        doc.rect(margin, yPos, 190, itemH);
        
        // Header split
        doc.setDrawColor(120, 120, 120);
        doc.line(margin + 75, yPos, margin + 75, yPos + itemH); // Extended all the way down
        doc.line(margin + 93, yPos, margin + 93, yPos + 10);
        doc.line(margin + 111, yPos, margin + 111, yPos + 10);
        doc.line(margin + 129, yPos, margin + 129, yPos + 10);
        doc.line(margin + 154, yPos, margin + 154, yPos + 10);
        doc.line(margin + 166, yPos, margin + 166, yPos + 10);
        doc.line(margin + 75, yPos + 10, 200, yPos + 10);

        // Header Background for values (Removed to prevent overlapping lines)

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(item.width.toString(), margin + 75 + 9, yPos + 6, { align: "center" });
        doc.text(item.height.toString(), margin + 93 + 9, yPos + 6, { align: "center" });
        doc.text((item.width * item.height).toFixed(2), margin + 111 + 9, yPos + 6, { align: "center" });
        doc.text(safeCurrency(item.rate || 0), margin + 129 + 12.5, yPos + 6, { align: "center" });
        doc.text(item.qty.toString(), margin + 154 + 6, yPos + 6, { align: "center" });
        doc.text(safeCurrency(item.total || 0), margin + 166 + 12, yPos + 6, { align: "center" });

        // Item ID numbers
        doc.setFontSize(7);
        doc.setTextColor(200, 200, 200);
        doc.text((index + 1).toString(), margin + 1.5, yPos + 3.5);
        doc.text((index + 1).toString(), margin + 75 - 4, yPos + 3.5);

        // Drawing schematic
        drawWindowSchematic(doc, margin + 5, yPos + 5, item.width, item.height, item.sections || 2);
        
        // Specs
        const specX = margin + 80;
        let specY = yPos + 18;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`P${index + 1}`, specX, specY);
        
        specY += 5;
        doc.text(item.series || item.name || "Gaudani - 32MM SLIDING SERIES", specX, specY);
        
        specY += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Desc:", specX, specY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(item.description || "2T/2P Sliding", specX + 10, specY);
        
        if (item.tracks) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("Tracks:", specX + 50, specY);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(item.tracks, specX + 60, specY);
        }
        
        specY += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Glass:", specX, specY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(item.glass || "11.52mm ST-187 Clear", specX + 10, specY);

        if (item.colorCoating) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("Color:", specX + 50, specY);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(item.colorCoating, specX + 60, specY);
        }

        specY += 8;
        doc.setDrawColor(120, 120, 120);
        doc.rect(specX, specY - 4, 100, 6);
        doc.setFont("helvetica", "normal");
        doc.text(`Rubber and brush: ${item.rubberColor || 'Black'}`, specX + 2, specY);
        const rColor = (item.rubberColor || 'Black').toLowerCase();
        if (rColor === 'white') {
          doc.setFillColor(255, 255, 255);
        } else if (rColor === 'grey' || rColor === 'gray') {
          doc.setFillColor(150, 150, 150);
        } else {
          doc.setFillColor(0, 0, 0);
        }
        doc.rect(specX + 85, specY - 3, 12, 4, 'FD');

        specY += 8;
        doc.setFont("helvetica", "bold");
        doc.text(item.hardware?.toUpperCase() || "MULTI POINT LOCKING", specX, specY);
        
        if (item.panelCost) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text("Panel Cost:", specX + 50, specY);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(safeCurrency(item.panelCost) + " Rs.", specX + 65, specY);
        }

        yPos += itemH;
      });

      // --- TOTALS ---
      yPos += 10;
      const totalColX = 130;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      doc.text("Total area:", totalColX, yPos);
      doc.text(quote.items.reduce((acc, i) => acc + (i.width * i.height * i.qty), 0).toFixed(2) + " ft²", 200, yPos, { align: "right" });
      
      yPos += 6;
      doc.text("Subtotal", totalColX, yPos);
      doc.text(safeCurrency(quote.subtotal || 0) + " Rs.", 200, yPos, { align: "right" });

      if (quote.applyGst) {
        yPos += 6;
        doc.text(`GST ${quote.gstRate}%`, totalColX, yPos);
        doc.text(safeCurrency(quote.gstAmount || 0) + " Rs.", 200, yPos, { align: "right" });
      }

      yPos += 8;
      doc.setFontSize(12);
      doc.text("Total", totalColX, yPos);
      doc.text(safeCurrency(quote.grandTotal || 0) + " Rs.", 200, yPos, { align: "right" });

      // Footer P1
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page 1 of 2`, 105, 285, { align: "center" });

      // --- T&C PAGE ---
      doc.addPage();
      drawPageBorder(doc);
      yPos = 20;
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("TERMS AND CONDITIONS", 105, yPos, { align: "center" });

      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");

      const terms = [
        "100% Advance Payment to be made while placing the order.",
        "Any replacement or removal of windows will be charged Extra.",
        "Pre & Post inspection of the site will be done by both client and us.",
        "Quotation has to be checked and verified by the client.",
        "Once the quotation is finalized and order placed, no changes are permitted.",
        "Rates will be re-calculated if there is a variation in height or width more than 150mm after site inspection.",
        "Glass: There is no warranty for fragile material and protection for it will be done by client.",
        "There is no warranty for glass once installation is done.",
        "For manufacturing defect, client has to inform us within 48 hours after installation. After the time period, Silvercoin Door & Window System will be not liable for any defects.",
        "Scaffolding/Crane Service, electricity,storage for material and cleaning of glass & window will be under customer's scope.",
        "Any Damage or Breackage of Sill/Stone/Glass White will not be our responsibility.",
        "Transportation Charges will be additional(Extra) and comes under client's scope.",
        "Delivery time :- 40 - 60 days",
        "Quotation Validity :- 15 days"
      ];

      terms.forEach((term, i) => {
        doc.setTextColor(0, 0, 0);
        doc.text("•", margin + 5, yPos);
        const lines = doc.splitTextToSize(term, 175);
        doc.text(lines, margin + 12, yPos);
        yPos += (lines.length * 5) + 4;
      });

      doc.setTextColor(255, 0, 0);
      doc.text("**Above Mentioned Rates Does Not Include Mosquito Mesh**", margin + 5, yPos);

      // Signature boxes
      yPos = 245;
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, 190, 30);
      doc.line(margin + 95, yPos, margin + 95, yPos + 30);
      doc.line(margin, yPos + 10, margin + 190, yPos + 10);
      doc.line(margin, yPos + 20, margin + 190, yPos + 20);

      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("AGREED TO AND ACCEPTED BY:", margin + 3, yPos + 7);
      doc.text("AGREED TO AND ACCEPTED BY:", margin + 98, yPos + 7);
      doc.setFont("helvetica", "bold");
      doc.text(settings.features.companyName?.toUpperCase() || "PRINCE WINDOWS", margin + 98, yPos + 17);
      doc.setFont("helvetica", "normal");
      doc.text("SIGN:", margin + 3, yPos + 27);
      doc.text("SIGN:", margin + 98, yPos + 27);

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`${new Date().toLocaleString()}`, margin, 285);
      doc.text(`Page 2 of 2`, 105, 285, { align: "center" });
      // Generate explicit blob link to bypass browser UUID stripping
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${quote.quoteNumber || 'quotation'}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 200);
    } catch (err: any) {
      console.error("PDF Error:", err);
      alert(`Final PDF Error: "${err.message || 'Unknown'}"`);
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
        {/* PRINT HEADER */}
        <div className="hidden print:flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
           <div className="flex gap-6 items-center">
              {settings.features.companyLogo && (
                <img src={settings.features.companyLogo} alt="Logo" className="w-24 h-24 object-contain" />
              )}
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">{settings.features.companyName}</h1>
                <p className="text-slate-500 font-bold tracking-widest text-xs mt-1 uppercase">{settings.features.companyTagline}</p>
              </div>
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Quotation</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Ref: {quote.quoteNumber}</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">Date: {new Date(quote.date || Date.now()).toLocaleDateString()}</p>
           </div>
        </div>

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

            <div className="md:col-span-2">
              <Select 
                label="Linked Project / Site" 
                value={quote.projectId || ''}
                onChange={(e) => updateField('projectId', e.target.value)}
                disabled={isSaved}
              >
                <option value="">No Project (Standalone Quote)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
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
                    <th className="px-4 py-3 w-32 border-r border-slate-100">Production</th>
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
                        <td className="p-0 border-r border-slate-100 bg-slate-50/20">
                           <div className="flex flex-col items-center justify-center h-full px-2 py-1 gap-1">
                             <ProductionStatusBadge status={item.productionStatus || 'pending'} />
                             <select 
                               className="w-full text-[9px] font-bold bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 print:hidden"
                               value={item.productionStatus || 'pending'}
                               onChange={(e) => updateItem(index, 'productionStatus', e.target.value as ProductionStatus)}
                               disabled={isSaved}
                             >
                               <option value="pending">Pending</option>
                               <option value="manufacturing">Manufacturing</option>
                               <option value="done">Done</option>
                               <option value="dispatched">Dispatched</option>
                               <option value="reached">Reached</option>
                             </select>
                           </div>
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
          <Card className="relative w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Item Details & Specs</CardTitle>
              <p className="text-sm text-slate-500">Add detailed specifications and an image for {quote.items[editingItemIndex].name || 'this item'}.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Specifications</label>
                    <p className="text-[10px] text-slate-500 ml-1">Enter key-value pairs (e.g., "Glass: 5mm Clear") on new lines.</p>
                    <textarea
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 min-h-[200px] bg-slate-50/30 font-mono"
                      value={quote.items[editingItemIndex].description || ''}
                      onChange={(e) => updateItem(editingItemIndex, 'description', e.target.value)}
                      placeholder={`Glass: 5 mm Clear\nColor: White\nHandle: Sliding Touch Lock`}
                    />

                    <div className="pt-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Series</label>
                          <Input 
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].series || ''}
                            onChange={(e) => updateItem(editingItemIndex, 'series', e.target.value)}
                            placeholder="e.g. 32MM SLIDING"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Glass Type</label>
                          <Input 
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].glass || ''}
                            onChange={(e) => updateItem(editingItemIndex, 'glass', e.target.value)}
                            placeholder="e.g. 5mm Clear"
                          />
                       </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Hardware/Locking</label>
                          <Input 
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].hardware || ''}
                            onChange={(e) => updateItem(editingItemIndex, 'hardware', e.target.value)}
                            placeholder="e.g. Multi Point"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Rubber Color</label>
                          <Input 
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].rubberColor || ''}
                            onChange={(e) => updateItem(editingItemIndex, 'rubberColor', e.target.value)}
                            placeholder="e.g. Black"
                          />
                       </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tracks</label>
                          <Combobox
                            className="mt-1"
                            value={quote.items[editingItemIndex].tracks || ''}
                            onChange={(val) => updateItem(editingItemIndex, 'tracks', val)}
                            placeholder="e.g. 2 Track"
                            options={["1 Track", "2 Track", "2.5 Track", "3 Track"]}
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Color Coating</label>
                          <Combobox
                            className="mt-1"
                            value={quote.items[editingItemIndex].colorCoating || ''}
                            onChange={(val) => updateItem(editingItemIndex, 'colorCoating', val)}
                            placeholder="e.g. Powder Coated"
                            options={["Powder Coated Black", "Powder Coated White", "Anodized Silver", "Anodized Bronze", "Wooden Finish"]}
                          />
                       </div>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Panel Cost (₹)</label>
                          <Input 
                            type="number"
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].panelCost || ''}
                            onChange={(e) => updateItem(editingItemIndex, 'panelCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="e.g. 1500"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Window Sections</label>
                          <Select 
                            className="mt-1 h-10"
                            value={quote.items[editingItemIndex].sections || 2}
                            onChange={(e) => updateItem(editingItemIndex, 'sections', parseInt(e.target.value))}
                          >
                            <option value={2}>2 Sections (Standard)</option>
                            <option value={3}>3 Sections</option>
                            <option value={4}>4 Sections</option>
                          </Select>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Technical Preview</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[250px] bg-white relative overflow-hidden shadow-inner">
                      {quote.items[editingItemIndex].image ? (
                        <>
                          <img src={quote.items[editingItemIndex].image} alt="Product" className="object-contain h-full w-full absolute inset-0 p-4" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => updateItem(editingItemIndex, 'image', undefined)}>Remove Image</Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-6">
                           <WindowSchematic 
                             width={quote.items[editingItemIndex].width || 3} 
                             height={quote.items[editingItemIndex].height || 2} 
                             sections={quote.items[editingItemIndex].sections || 2}
                           />
                           
                           <div className="relative">
                             <Button variant="outline" size="sm" className="gap-2 bg-slate-50 border-slate-200">
                               <Plus className="w-4 h-4" /> Upload Custom Photo
                             </Button>
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                               onChange={(e) => handleImageUpload(e, editingItemIndex)}
                             />
                           </div>
                        </div>
                      )}
                    </div>
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
