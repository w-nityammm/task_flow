'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const icons = {
    success: <CheckCircle size={16} className="shrink-0" />,
    error: <AlertCircle size={16} className="shrink-0" />,
    info: <CheckCircle size={16} className="shrink-0" />,
  };

  const colors = {
    success: 'border-[hsl(var(--success))] text-[hsl(var(--success))]',
    error: 'border-[hsl(var(--danger))] text-[hsl(var(--danger))]',
    info: 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass rounded-xl px-4 py-3 flex items-center gap-3 border animate-fade-in shadow-lg ${colors[t.type]}`}
          >
            {icons[t.type]}
            <span className="text-sm text-[hsl(var(--text))] flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-[hsl(var(--text-dim))] hover:text-[hsl(var(--text))] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
