import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

const toastState: ToastState = {
  toasts: [],
};

const listeners: Set<(state: ToastState) => void> = new Set();

function emitChange() {
  listeners.forEach((listener) => listener(toastState));
}

let toastCount = 0;

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE;
  return toastCount.toString();
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = genId();
  const newToast: Toast = {
    ...toast,
    id,
    duration: toast.duration ?? 5000,
  };

  toastState.toasts = [...toastState.toasts, newToast];
  emitChange();

  // Auto remove after duration
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }

  return id;
}

function removeToast(id: string) {
  toastState.toasts = toastState.toasts.filter((toast) => toast.id !== id);
  emitChange();
}

export function useToast() {
  const [state, setState] = useState<ToastState>(toastState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    return addToast(props);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    removeToast(toastId);
  }, []);

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
}
