import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-rose-50 border-rose-300 text-rose-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-200 animate-in slide-in-from-top-4 ${bgColors[type]}`}
    >
      {icons[type]}
      <div className="flex-1 min-w-0 text-xs">
        {title && <div className="font-bold mb-0.5">{title}</div>}
        <div className="leading-relaxed opacity-90">{message}</div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="opacity-50 hover:opacity-100 p-0.5 rounded transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
