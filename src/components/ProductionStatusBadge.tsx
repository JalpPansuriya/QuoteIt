import React from 'react';
import { cn } from '../lib/utils';

export type ProductionStatus = 'pending' | 'manufacturing' | 'done' | 'dispatched' | 'reached';

interface ProductionStatusBadgeProps {
  status: ProductionStatus;
  className?: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  manufacturing: { label: 'Manufacturing', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  dispatched: { label: 'Dispatched', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  reached: { label: 'Reached', color: 'bg-purple-100 text-purple-700 border-purple-200' },
};

export const ProductionStatusBadge: React.FC<ProductionStatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all",
      config.color,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.label}
    </span>
  );
};
