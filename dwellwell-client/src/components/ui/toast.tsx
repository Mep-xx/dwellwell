//dwellwell-client/src/components/ui/toast.tsx
import { useToastStore } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const VARIANT_STYLES: Record<string, string> = {
  default: "bg-white border border-gray-300 text-black",
  success: "bg-green-100 border border-green-500 text-green-800",
  warning: "bg-yellow-100 border border-yellow-500 text-yellow-800",
  info: "bg-blue-100 border border-blue-500 text-blue-800",
  destructive: "bg-red-100 border border-red-500 text-red-800",
};

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
            className={`rounded-lg p-4 w-80 shadow ${VARIANT_STYLES[toast.variant || "default"]}`}
          >
            <div className="flex justify-between items-start">
              <div>
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.description && (
                  <div className="text-sm mt-1">{toast.description}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-sm ml-4 text-gray-400 hover:text-gray-600"
              >
                ✖
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
