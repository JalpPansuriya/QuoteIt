import { useParams, useNavigate, Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Send, CreditCard, FileText, Download } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import type { InvoiceStatus } from '../../types';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, clients, payments, updateInvoice, settings, projects } = useStore();

  const invoice = invoices.find(inv => inv.id === id);
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;
  const invoicePayments = payments.filter(p => p.invoiceId === id).sort((a, b) => b.createdAt - a.createdAt);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-bold text-slate-900">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/billing')}>Back to Billing</Button>
      </div>
    );
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Sent': return 'bg-blue-100 text-blue-700';
      case 'Partially Paid': return 'bg-amber-100 text-amber-700';
      case 'Overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    updateInvoice(invoice.id, { status: newStatus });
  };

  const handlePdfExport = async () => {
    const loadScript = (src: string): Promise<void> => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = reject;
      document.body.appendChild(s);
    });
    
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      let yPos = 15;

      const safeCurrency = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

      const drawPageBorder = (d: any) => {
        d.setDrawColor(150, 150, 150);
        d.setLineWidth(0.3);
        d.rect(5, 5, 200, 287);
      };

      drawPageBorder(doc);

      const getImgInfo = (src: string): Promise<{w: number, h: number}> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = src;
        });
      };

      if (settings.features.companyLogo) {
        try {
          const dims = await getImgInfo(settings.features.companyLogo);
          let logoW = 25; let logoH = 25;
          if (dims.w > 0 && dims.h > 0) {
            const maxH = 20; const maxW = 50;
            const ratio = dims.w / dims.h;
            logoH = maxH; logoW = logoH * ratio;
            if (logoW > maxW) { logoW = maxW; logoH = logoW / ratio; }
          }
          doc.addImage(settings.features.companyLogo, 'PNG', margin, 10, logoW, logoH);
        } catch (e) {
          doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(settings.features.companyName || "Prince Windows", margin, yPos);
        }
      } else {
        doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(settings.features.companyName || "Prince Windows", margin, yPos);
      }

      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("INVOICE", 105, yPos + 5, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(settings.features.companyName || "Prince Windows", 200, yPos + 2, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text((settings.features.companyTagline || "WE MAKE WINDOWS"), 200, yPos + 7, { align: "right" });

      yPos += 15;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos, 200, yPos);

      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Invoice no.", margin, yPos);
      doc.text("Project name", margin, yPos + 5);
      doc.text("Client name", margin, yPos + 10);
      
      const project = invoice.projectId ? projects.find(p => p.id === invoice.projectId) : null;
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(": " + (invoice.invoiceNumber?.replace(/\D/g, '') || '0001'), margin + 25, yPos);
      doc.text(": " + (project?.name?.toUpperCase() || 'STANDALONE'), margin + 25, yPos + 5);
      doc.text(": " + (client?.name?.toUpperCase() || 'N/A'), margin + 25, yPos + 10);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Date: " + new Date(invoice.issueDate || Date.now()).toLocaleDateString('en-GB'), 200, yPos, { align: "right" });
      doc.text("Due Date: " + new Date(invoice.dueDate || Date.now()).toLocaleDateString('en-GB'), 200, yPos + 5, { align: "right" });

      yPos += 20;
      
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPos, 190, 10);
      
      const cols = [
        { label: "Description", x: margin, w: 100 },
        { label: "Qt.", x: margin + 100, w: 20 },
        { label: "Unit price Rs.", x: margin + 120, w: 35 },
        { label: "Total Rs.", x: margin + 155, w: 35 }
      ];

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      cols.forEach(c => {
        doc.text(c.label, c.x + (c.w/2), yPos + 6, { align: "center" });
        if (c.x > margin) doc.line(c.x, yPos, c.x, yPos + 10);
      });

      yPos += 10;

      (invoice.items || []).forEach((item, index) => {
        const itemH = 15;
        if (yPos + itemH > 280) {
           doc.setFontSize(7);
           doc.setTextColor(150, 150, 150);
           doc.text(`Page 1 of 2`, 105, 285, { align: "center" });
           doc.addPage();
           drawPageBorder(doc);
           yPos = 20;
        }

        doc.setDrawColor(120, 120, 120);
        doc.rect(margin, yPos, 190, itemH);
        
        doc.line(margin + 100, yPos, margin + 100, yPos + itemH);
        doc.line(margin + 120, yPos, margin + 120, yPos + itemH);
        doc.line(margin + 155, yPos, margin + 155, yPos + itemH);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        
        const descLines = doc.splitTextToSize(item.description || '-', 90);
        doc.text(descLines, margin + 5, yPos + 6);
        
        doc.text(item.quantity.toString(), margin + 100 + 10, yPos + 8, { align: "center" });
        doc.text(safeCurrency(item.unitPrice || 0), margin + 120 + 17.5, yPos + 8, { align: "center" });
        doc.text(safeCurrency(item.total || 0), margin + 155 + 17.5, yPos + 8, { align: "center" });

        doc.setFontSize(7);
        doc.setTextColor(200, 200, 200);
        doc.text((index + 1).toString(), margin + 1.5, yPos + 3.5);

        yPos += itemH;
      });

      yPos += 10;
      const totalColX = 130;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      doc.text("Subtotal", totalColX, yPos);
      doc.text(safeCurrency(invoice.subtotal || 0) + " Rs.", 200, yPos, { align: "right" });

      if (invoice.discountAmount > 0) {
        yPos += 6;
        doc.text("Discount", totalColX, yPos);
        doc.text("-" + safeCurrency(invoice.discountAmount || 0) + " Rs.", 200, yPos, { align: "right" });
      }

      if (invoice.taxAmount > 0) {
        yPos += 6;
        doc.text("GST", totalColX, yPos);
        doc.text(safeCurrency(invoice.taxAmount || 0) + " Rs.", 200, yPos, { align: "right" });
      }

      yPos += 8;
      doc.setFontSize(12);
      doc.text("Grand Total", totalColX, yPos);
      doc.text(safeCurrency(invoice.total || 0) + " Rs.", 200, yPos, { align: "right" });

      if (invoice.amountPaid > 0) {
        yPos += 6;
        doc.setFontSize(10);
        doc.setTextColor(22, 163, 74); // Green
        doc.text("Amount Paid", totalColX, yPos);
        doc.text(safeCurrency(invoice.amountPaid || 0) + " Rs.", 200, yPos, { align: "right" });
        
        yPos += 6;
        doc.setTextColor(220, 38, 38); // Red
        doc.text("Balance Due", totalColX, yPos);
        doc.text(safeCurrency(invoice.balanceDue || 0) + " Rs.", 200, yPos, { align: "right" });
      }

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page 1 of 2`, 105, 285, { align: "center" });

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

      terms.forEach((term) => {
        doc.setTextColor(0, 0, 0);
        doc.text("•", margin + 5, yPos);
        const lines = doc.splitTextToSize(term, 175);
        doc.text(lines, margin + 12, yPos);
        yPos += (lines.length * 5) + 4;
      });

      doc.setTextColor(255, 0, 0);
      doc.text("**Above Mentioned Rates Does Not Include Mosquito Mesh**", margin + 5, yPos);

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

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`${new Date().toLocaleString()}`, margin, 285);
      doc.text(`Page 2 of 2`, 105, 285, { align: "center" });

      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 200);
    } catch (err: any) {
      console.error("PDF Error:", err);
      alert(`Final PDF Error: "${err.message || 'Unknown'}"`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/billing')} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            {settings.features.companyLogo && (
              <img src={settings.features.companyLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white border border-slate-100 p-2 shadow-sm" />
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">{invoice.invoiceNumber}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">{client?.name || 'Unknown Client'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${statusColor(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total</p><p className="text-2xl font-black mt-1 text-slate-900">{formatCurrency(invoice.total)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Paid</p><p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(invoice.amountPaid)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Balance Due</p><p className="text-2xl font-black mt-1 text-red-600">{formatCurrency(invoice.balanceDue)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Due Date</p><p className="text-2xl font-black mt-1 text-slate-900">{format(invoice.dueDate, 'MMM dd, yyyy')}</p></CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {invoice.status === 'Draft' && <Button variant="primary" className="gap-2" onClick={() => handleStatusChange('Sent')}><Send className="w-4 h-4" /> Mark as Sent</Button>}
        {(invoice.status !== 'Paid') && <Link to={`/payments/new?invoiceId=${invoice.id}`}><Button variant="primary" className="gap-2"><CreditCard className="w-4 h-4" /> Record Payment</Button></Link>}
        {invoice.status === 'Sent' && <Button variant="outline" className="gap-2" onClick={() => handleStatusChange('Overdue')}>Mark Overdue</Button>}
        <Button variant="outline" className="gap-2" onClick={handlePdfExport}><Download className="w-4 h-4" /> Export PDF</Button>
      </div>

      {/* Line Items */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
              <tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50">
                <th className="px-6 py-4">#</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4">Rate</th><th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {invoice.items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50"><td className="px-6 py-4 text-slate-400">{idx + 1}</td><td className="px-6 py-4 font-medium">{item.description}</td><td className="px-6 py-4">{item.quantity}</td><td className="px-6 py-4">{formatCurrency(item.unitPrice)}</td><td className="px-6 py-4 text-right font-bold">{formatCurrency(item.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 p-6 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Discount</span><span className="font-bold">−{formatCurrency(invoice.discountAmount)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Tax</span><span className="font-bold">{formatCurrency(invoice.taxAmount)}</span></div>
          <div className="flex justify-between text-lg pt-2 border-t border-slate-100"><span className="font-black">Grand Total</span><span className="font-black">{formatCurrency(invoice.total)}</span></div>
        </div>
      </Card>

      {/* Payments */}
      <div><h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4">Payment History</h2>
        <Card><div className="overflow-x-auto"><table className="w-full text-left border-collapse">
          <thead className="border-b border-slate-200"><tr className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50"><th className="px-6 py-4">Date</th><th className="px-6 py-4">Method</th><th className="px-6 py-4">Reference</th><th className="px-6 py-4 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {invoicePayments.length === 0 ? (<tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No payments recorded yet.</td></tr>) : (
              invoicePayments.map(p => (<tr key={p.id} className="hover:bg-slate-50"><td className="px-6 py-4">{format(p.paymentDate, 'MMM dd, yyyy')}</td><td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">{p.paymentMethod}</span></td><td className="px-6 py-4 text-slate-500">{p.referenceNumber || '—'}</td><td className="px-6 py-4 text-right font-bold text-green-700">{formatCurrency(p.amount)}</td></tr>))
            )}
          </tbody>
        </table></div></Card>
      </div>
    </div>
  );
}
