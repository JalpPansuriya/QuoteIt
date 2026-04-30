import { useStore } from '../../store/useStore';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import { Briefcase, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';

export default function ProjectProfitabilityReport() {
  const { projects, quotes, invoices, payments, clients } = useStore();

  const projectStats = projects.map(project => {
    const projectQuotes = quotes.filter(q => q.projectId === project.id && q.status === 'Approved');
    const projectInvoices = invoices.filter(i => i.projectId === project.id);
    const projectPayments = payments.filter(p => p.projectId === project.id);
    const client = clients.find(c => c.id === project.clientId);

    const totalQuoted = projectQuotes.reduce((sum, q) => sum + q.grandTotal, 0);
    const totalInvoiced = projectInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalCollected = projectPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = totalInvoiced - totalCollected;

    // Estimate progress based on invoices vs quoted
    const billingProgress = totalQuoted > 0 ? (totalInvoiced / totalQuoted) * 100 : 0;

    return {
      id: project.id,
      name: project.name,
      clientName: client?.name || 'Unknown',
      status: project.status,
      totalQuoted,
      totalInvoiced,
      totalCollected,
      outstanding,
      billingProgress,
      updatedAt: project.updatedAt
    };
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  const totalPortfolioValue = projectStats.reduce((sum, p) => sum + p.totalQuoted, 0);
  const totalInvoicedAll = projectStats.reduce((sum, p) => sum + p.totalInvoiced, 0);
  const totalCollectedAll = projectStats.reduce((sum, p) => sum + p.totalCollected, 0);
  const totalOutstandingAll = totalInvoicedAll - totalCollectedAll;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Project Profitability</h1>
          <p className="text-slate-500 mt-2 font-medium">Site-wise financial tracking and collection status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-b-4 border-b-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
              <Briefcase className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Portfolio Value</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalPortfolioValue)}</p>
            <p className="text-xs text-slate-500 mt-1">Total of all approved quotes</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-b-4 border-b-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Invoiced</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalInvoicedAll)}</p>
            <p className="text-xs text-slate-500 mt-1">{((totalInvoicedAll / totalPortfolioValue) * 100 || 0).toFixed(1)}% of portfolio</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-b-4 border-b-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-emerald-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Collected</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalCollectedAll)}</p>
            <p className="text-xs text-slate-500 mt-1">{((totalCollectedAll / totalInvoicedAll) * 100 || 0).toFixed(1)}% collection rate</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-b-4 border-b-rose-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 text-rose-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Outstanding</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalOutstandingAll)}</p>
            <p className="text-xs text-slate-500 mt-1">Pending from issued invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Project / Client</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Quoted Value</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoiced</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Collected</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Outstanding</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectStats.map(stat => (
                <tr key={stat.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stat.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{stat.clientName}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-700">{formatCurrency(stat.totalQuoted)}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-700">{formatCurrency(stat.totalInvoiced)}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-emerald-600">{formatCurrency(stat.totalCollected)}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`font-bold ${stat.outstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {formatCurrency(stat.outstanding)}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, stat.billingProgress)}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {stat.billingProgress.toFixed(0)}% Billed
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {projectStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No site data available for reporting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
