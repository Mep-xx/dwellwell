import { create } from 'zustand';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'info' | 'warning' | 'destructive';
};

type ToastStore = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast = { id, ...toast };
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after 4s
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const useToast = () => {
  const { addToast } = useToastStore();
  return {
    toast: addToast,
  };
};

export const toast = useToastStore.getState().addToast;
