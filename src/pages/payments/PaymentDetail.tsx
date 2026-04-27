import { useParams, useNavigate, Link } from 'react-router';
import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CreditCard, Download } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payments, invoices, clients } = useStore();

  const payment = payments.find(p => p.id === id);
  const invoice = payment ? invoices.find(i => i.id === payment.invoiceId) : null;
  const client = payment ? clients.find(c => c.id === payment.clientId) : null;

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CreditCard className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-xl font-bold text-slate-900">Payment not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/payments')}>Back to Payments</Button>
      </div>
    );
  }

  // Receipt PDF stub — scaffolded for future implementation
  const handleReceiptPdf = () => {
    alert('Receipt PDF generation coming in v2.1');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Payment Detail</h1>
          <p className="text-slate-500 mt-1">{format(payment.paymentDate, 'MMMM dd, yyyy')}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleReceiptPdf}><Download className="w-4 h-4" /> Receipt PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Payment Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Amount</span><span className="font-black text-xl text-green-700">{formatCurrency(payment.amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Method</span><span className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">{payment.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Reference</span><span className="font-mono text-sm">{payment.referenceNumber || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Date</span><span className="font-medium">{format(payment.paymentDate, 'MMM dd, yyyy')}</span></div>
            {payment.notes && <div className="pt-2 border-t border-slate-100"><p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-700">{payment.notes}</p></div>}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Related</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Invoice</span>{invoice ? <Link to={`/billing/${invoice.id}`} className="font-bold text-blue-600 hover:text-blue-800">{invoice.invoiceNumber}</Link> : <span>—</span>}</div>
            <div className="flex justify-between"><span className="text-slate-500 text-sm">Client</span><span className="font-medium">{client?.name || '—'}</span></div>
            {invoice && <>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Invoice Total</span><span className="font-bold">{formatCurrency(invoice.total)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Balance Due</span><span className={`font-bold ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(invoice.balanceDue)}</span></div>
            </>}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
