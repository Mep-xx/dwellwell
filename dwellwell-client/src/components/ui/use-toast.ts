
import { create } from "zustand";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
};

type ToastState = {
  toasts: Toast[];
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (t: Toast) => {
  useToastStore.getState().addToast({ ...t, id: crypto.randomUUID() });
};
