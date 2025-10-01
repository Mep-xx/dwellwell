// dwellwell-client/src/components/features/GlobalTaskDrawer.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TaskDrawer from "./TaskDrawer";

export default function GlobalTaskDrawer() {
  const loc = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(loc.search);
  const taskId = params.get("taskId") || undefined;

  const handleClose = () => {
    const next = new URLSearchParams(loc.search);
    next.delete("taskId");
    navigate({ pathname: loc.pathname, search: next.toString() }, { replace: true });
  };

  useEffect(() => {
    if (!taskId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [taskId]);

  return (
    <TaskDrawer taskId={taskId} open={!!taskId} onOpenChange={(v) => !v && handleClose()} />
  );
}
