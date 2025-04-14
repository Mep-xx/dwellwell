import { useToastStore } from "./use-toast";
import { AnimatePresence, motion } from "framer-motion";

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border shadow rounded-lg p-4 w-80"
          >
            <div className="font-semibold">{toast.title}</div>
            <div className="text-sm text-gray-600">{toast.description}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs text-blue-500 mt-2"
            >
              Dismiss
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
