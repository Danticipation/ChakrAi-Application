import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast, type Toast } from "../../hooks/use-toast";

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2 w-full max-w-sm">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
};

interface ToastComponentProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'destructive':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (toast.variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'destructive':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 border rounded-lg shadow-lg transition-all duration-300 ease-in-out',
        getStyles()
      )}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs mt-1 opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export { ToastProvider, ToastComponent };
