import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, generateInvoiceNumber } from '../../lib/utils';
import type { Invoice, InvoiceLineItem } from '../../types';

export default function InvoiceBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const { quotes, clients, invoices, addInvoice, updateQuote } = useStore();
  const sourceQuote = quoteId ? quotes.find(q => q.id === quoteId) : null;
  const lastInvNum = invoices.length > 0 ? [...invoices].sort((a, b) => b.createdAt - a.createdAt)[0].invoiceNumber : undefined;

  const [clientId, setClientId] = useState(sourceQuote?.clientId || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; });
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (sourceQuote) {
      return sourceQuote.items.map(qi => ({ id: uuidv4(), description: qi.name + (qi.description ? ` — ${qi.description}` : ''), productId: qi.productId, quantity: qi.qty, unitPrice: qi.rate, total: qi.total }));
    }
    return [{ id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }];
  });

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };
  const addItem = () => setItems(prev => [...prev, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  const removeItem = (id: string) => { if (items.length <= 1) return; setItems(prev => prev.filter(i => i.id !== id)); };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const disc = Math.min(parseFloat(discountAmount) || 0, subtotal); // clamp discount to subtotal
  const taxableAmount = subtotal - disc;
  const taxAmount = taxableAmount * (parseFloat(taxRate) || 0) / 100;
  const total = taxableAmount + taxAmount;

  const handleSave = () => {
    if (!clientId) return;
    const invoice: Invoice = { id: uuidv4(), quoteId: sourceQuote?.id, clientId, invoiceNumber: generateInvoiceNumber(lastInvNum), status: 'Draft', issueDate: new Date(issueDate).getTime(), dueDate: new Date(dueDate).getTime(), subtotal, taxAmount, discountAmount: disc, total, amountPaid: 0, balanceDue: total, notes, items, createdAt: Date.now(), updatedAt: Date.now() };
    addInvoice(invoice);
    if (sourceQuote) updateQuote(sourceQuote.id, { status: 'Invoiced', convertedToInvoiceId: invoice.id });
    navigate(`/billing/${invoice.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/billing')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">New Invoice</h1>
          <p className="text-slate-500 mt-1">{sourceQuote ? `Converting from ${sourceQuote.quoteNumber}` : 'Create a new invoice.'}</p>
        </div>
      </div>
      <Card><CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Select Client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Issue Date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-6">
        <h3 className="font-bold text-slate-900 mb-4">Line Items</h3>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                {idx === 0 && <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>}
                <input className="flex h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Item description" />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Qty</label>}
                <input type="number" className="flex h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rate (₹)</label>}
                <input type="number" className="flex h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-2">
                {idx === 0 && <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total</label>}
                <div className="h-10 flex items-center px-3 bg-slate-50 rounded border border-slate-200 text-sm font-bold">{formatCurrency(item.total)}</div>
              </div>
              <div className="col-span-1 flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={addItem}><Plus className="w-3 h-3" /> Add Line Item</Button>
      </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><Input label="Notes" placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} /></CardContent></Card>
        <Card><CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">{formatCurrency(subtotal)}</span></div>
          <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">Discount (₹)</span><input type="number" className="w-24 h-8 rounded border border-slate-300 bg-white px-2 text-sm text-right" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} /></div>
          <div className="flex items-center justify-between gap-4"><span className="text-sm text-slate-500">GST (%)</span><input type="number" className="w-24 h-8 rounded border border-slate-300 bg-white px-2 text-sm text-right" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Tax Amount</span><span className="font-bold">{formatCurrency(taxAmount)}</span></div>
          <div className="flex justify-between text-lg border-t border-slate-200 pt-4"><span className="font-black text-slate-900">Grand Total</span><span className="font-black text-slate-900">{formatCurrency(total)}</span></div>
        </CardContent></Card>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/billing')}>Cancel</Button>
        <Button variant="primary" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Create Invoice</Button>
      </div>
    </div>
  );
}
