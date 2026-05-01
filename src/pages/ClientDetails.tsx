import { useParams, Link, useNavigate } from 'react-router';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, 
  Package, 
  FileText, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  TrendingUp, 
  Wallet, 
  ShieldCheck,
  Download,
  ExternalLink,
  Clock,
  Edit2,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, projects, quotes, invoices, payments } = useStore();

  const client = clients.find(c => c.id === id);
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <p className="text-xl font-bold">Client not found</p>
        <Button variant="ghost" onClick={() => navigate('/clients')} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  // Data Aggregation
  const clientProjects = projects.filter(p => p.clientId === id);
  const clientQuotes = quotes.filter(q => q.clientId === id);
  const clientInvoices = invoices.filter(i => i.clientId === id);
  const clientPayments = payments.filter(p => p.clientId === id);

  const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);
  const totalInvoiced = clientInvoices.reduce((s, i) => s + i.total, 0);
  const ltv = totalInvoiced; // Lifetime Value is total invoiced
  const outstanding = Math.max(0, totalInvoiced - totalPaid);

  // Reliability Score Calculation (Simplified: percentage of invoiced amount paid)
  const reliabilityScore = totalInvoiced > 0 ? Math.min(100, (totalPaid / totalInvoiced) * 100) : 100;

  // Timeline items
  const timelineItems = [
    ...clientProjects.map(p => ({ type: 'project', date: p.createdAt, data: p as any })),
    ...clientQuotes.map(q => ({ type: 'quote', date: q.createdAt, data: q as any })),
    ...clientInvoices.map(i => ({ type: 'invoice', date: i.createdAt, data: i as any })),
    ...clientPayments.map(p => ({ type: 'payment', date: p.createdAt, data: p as any }))
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">{client.name}</h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Clock className="w-3.5 h-3.5" /> Customer since {format(client.createdAt, 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" /> Edit Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Contact Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-100 rounded-lg"><Phone className="w-4 h-4" /></div>
                  {client.phone || 'No phone provided'}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-2 bg-slate-100 rounded-lg"><Mail className="w-4 h-4" /></div>
                  {client.email || 'No email provided'}
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <div className="p-2 bg-slate-100 rounded-lg mt-0.5"><MapPin className="w-4 h-4" /></div>
                  <span className="leading-relaxed">{client.address || 'No address provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Card */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Financial Summary</h3>
            <Card className="bg-blue-600 text-white border-none shadow-xl shadow-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100 opacity-80">Lifetime Value</p>
                  <TrendingUp className="w-5 h-5 text-blue-200" />
                </div>
                <h4 className="text-3xl font-black">{formatCurrency(ltv)}</h4>
                <p className="text-xs text-blue-100/60 mt-2">Total invoiced amount to date</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border-rose-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-rose-500 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Outstanding</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(outstanding)}</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-green-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-500 mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reliability</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{reliabilityScore.toFixed(0)}%</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Document Repository */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Document Repository</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[...clientQuotes, ...clientInvoices].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).map((doc: any) => {
                  const isQuote = 'quoteNumber' in doc;
                  return (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isQuote ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{isQuote ? doc.quoteNumber : doc.invoiceNumber}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{format(doc.createdAt, 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`/print/${doc.id}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ExternalLink className="w-4 h-4" /></Button>
                        </a>
                      </div>
                    </div>
                  );
                })}
                {clientQuotes.length === 0 && clientInvoices.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">No documents found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {timelineItems.length === 0 ? (
                  <p className="text-center text-slate-400 py-12">No activity recorded yet.</p>
                ) : (
                  timelineItems.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Icon Dot */}
                      <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                        item.type === 'project' ? 'bg-blue-500' :
                        item.type === 'quote' ? 'bg-indigo-500' :
                        item.type === 'invoice' ? 'bg-emerald-500' :
                        'bg-amber-500'
                      }`}>
                        {item.type === 'project' && <Package className="w-3 h-3 text-white" />}
                        {item.type === 'quote' && <FileText className="w-3 h-3 text-white" />}
                        {item.type === 'invoice' && <FileText className="w-3 h-3 text-white" />}
                        {item.type === 'payment' && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>

                      <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-all hover:shadow-md cursor-default">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              item.type === 'project' ? 'bg-blue-50 text-blue-600' :
                              item.type === 'quote' ? 'bg-indigo-50 text-indigo-600' :
                              item.type === 'invoice' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              {item.type}
                            </span>
                            <h4 className="font-bold text-slate-900 mt-2">
                              {item.type === 'project' && item.data.name}
                              {item.type === 'quote' && `Quotation ${item.data.quoteNumber}`}
                              {item.type === 'invoice' && `Invoice ${item.data.invoiceNumber}`}
                              {item.type === 'payment' && `Payment Received: ${formatCurrency(item.data.amount)}`}
                            </h4>
                          </div>
                          <time className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {format(item.date, 'MMM dd, yyyy')}
                          </time>
                        </div>
                        
                        <div className="text-sm text-slate-500 mt-2 line-clamp-2">
                          {item.type === 'project' && `Location: ${item.data.location || 'N/A'} • Status: ${item.data.status}`}
                          {item.type === 'quote' && `Total: ${formatCurrency(item.data.grandTotal)} • Status: ${item.data.status}`}
                          {item.type === 'invoice' && `Total: ${formatCurrency(item.data.total)} • Status: ${item.data.status}`}
                          {item.type === 'payment' && `Method: ${item.data.paymentMethod} • Ref: ${item.data.referenceNumber || 'N/A'}`}
                        </div>

                        {item.type !== 'payment' && (
                          <Link 
                            to={item.type === 'project' ? `/projects/${item.data.id}` : (item.type === 'quote' ? `/quotes/${item.data.id}` : `/billing/${item.data.id}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mt-3 hover:text-blue-700"
                          >
                            View Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

