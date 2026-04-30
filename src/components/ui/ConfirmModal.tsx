import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn(
          "p-8 text-white relative overflow-hidden",
          variant === 'danger' ? 'bg-rose-600' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-black/10 hover:bg-black/20 rounded-xl flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <h3 className="text-2xl font-black mt-6 tracking-tight relative z-10">{title}</h3>
        </div>
        
        <div className="p-8">
          <p className="text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
          
          <div className="flex gap-3 mt-10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl font-bold border-2 hover:bg-slate-50"
            >
              {cancelText}
            </Button>
            <Button 
              type="button" 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "flex-1 h-14 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95",
                variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 
                variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 
                'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              )}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
