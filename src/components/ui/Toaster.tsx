import React from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';

export const Toaster: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border
            animate-in slide-in-from-right-full duration-300
            ${n.type === 'success' ? 'bg-white border-green-100 text-green-700' : 
              n.type === 'error' ? 'bg-white border-red-100 text-red-700' : 
              n.type === 'delete' ? 'bg-slate-900 border-slate-800 text-white' :
              'bg-white border-blue-100 text-blue-700'}
          `}
        >
          <div className={`p-1.5 rounded-lg ${
            n.type === 'success' ? 'bg-green-50' : 
            n.type === 'error' ? 'bg-red-50' : 
            n.type === 'delete' ? 'bg-slate-800' :
            'bg-blue-50'
          }`}>
            {n.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {n.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {n.type === 'delete' && <Trash2 className="w-4 h-4 text-red-400" />}
            {n.type === 'info' && <Info className="w-4 h-4" />}
          </div>
          
          <span className="text-sm font-bold tracking-tight">{n.message}</span>
          
          <button 
            onClick={() => removeNotification(n.id)}
            className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      ))}
    </div>
  );
};
