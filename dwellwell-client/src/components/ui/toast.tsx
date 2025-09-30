//dwellwell-client/src/components/ui/toast.tsx
import { useToastStore } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";

/**
 * We keep visual styling token-friendly and expose `data-variant` for theme overrides.
 * Your theme can target:
 *   [data-variant="success|info|warning|destructive"] to change bg/border/text via CSS.
 */
const BASE =
  "w-80 rounded-lg p-4 shadow bg-surface border border-token text-body";

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 space-y-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={BASE}
            data-variant={toast.variant || "default"}
          >
            <div className="flex items-start justify-between">
              <div>
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.description && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-sm text-muted-foreground hover:text-body"
                aria-label="Dismiss notification"
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
