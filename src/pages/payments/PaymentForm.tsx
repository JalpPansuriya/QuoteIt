import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../lib/utils';
import type { Payment, PaymentMethod } from '../../types';

const METHODS: PaymentMethod[] = ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'];

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');
  const { invoices, clients, addPayment, user } = useStore();

  const invoice = invoiceIdParam ? invoices.find(i => i.id === invoiceIdParam) : null;
  const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;

  const [invoiceId, setInvoiceId] = useState(invoiceIdParam || '');
  const [amount, setAmount] = useState(invoice?.balanceDue?.toString() || '');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const selectedInvoice = invoices.find(i => i.id === invoiceId);

  const handleSave = () => {
    if (!invoiceId || !amount) return;
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const payment: Payment = {
      id: uuidv4(),
      invoiceId,
      clientId: inv.clientId,
      amount: parseFloat(amount),
      paymentMethod: method,
      referenceNumber: reference.trim() || undefined,
      paymentDate: new Date(paymentDate).getTime(),
      notes: notes.trim(),
      recordedBy: user?.id || '',
      createdAt: Date.now(),
    };
    addPayment(payment);
    navigate(`/billing/${invoiceId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Record Payment</h1>
          <p className="text-slate-500 mt-1">{invoice ? `For ${invoice.invoiceNumber} — ${client?.name}` : 'Log a payment against an invoice.'}</p>
        </div>
      </div>

      {selectedInvoice && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Invoice Total</p><p className="text-2xl font-black mt-1">{formatCurrency(selectedInvoice.total)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Already Paid</p><p className="text-2xl font-black mt-1 text-green-700">{formatCurrency(selectedInvoice.amountPaid)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Balance Due</p><p className="text-2xl font-black mt-1 text-red-600">{formatCurrency(selectedInvoice.balanceDue)}</p></CardContent></Card>
        </div>
      )}

      <Card><CardContent className="p-6 space-y-6">
        {!invoiceIdParam && (
          <Select label="Invoice" value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value); const inv = invoices.find(i => i.id === e.target.value); if (inv) setAmount(inv.balanceDue.toString()); }}>
            <option value="">— Select Invoice —</option>
            {invoices.filter(i => i.status !== 'Paid').map(i => <option key={i.id} value={i.id}>{i.invoiceNumber} — {formatCurrency(i.balanceDue)} due</option>)}
          </Select>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Input
              label="Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {selectedInvoice && parseFloat(amount) > selectedInvoice.balanceDue && (
              <p className="text-xs font-bold text-amber-600 mt-1">
                ⚠ Amount exceeds balance due ({formatCurrency(selectedInvoice.balanceDue)})
              </p>
            )}
          </div>
          <Select label="Payment Method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Payment Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Reference Number (Optional)" placeholder="e.g. TXN-12345" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Input label="Notes (Optional)" placeholder="Payment notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Record Payment</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}
