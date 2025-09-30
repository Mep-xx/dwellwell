//dwellwell-client/src/components/ui/use-toast.ts
import { create } from "zustand";

type Variant = "default" | "success" | "info" | "warning" | "destructive";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: Variant;
};

type ToastStore = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id =
      (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).slice(2)) as string;
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

// Convenience export, safe on both server and client
export const toast = (t: Omit<Toast, "id">) => useToastStore.getState().addToast(t);
