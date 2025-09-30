// dwellwell-client/src/pages/community/components/ThreadRow.tsx
import { Link, useNavigate } from "react-router-dom";
import { memo, useMemo } from "react";

type Thread = {
  id: string;
  title: string;
  score: number;
  commentCount: number;
  status?: "open" | "resolved" | "closed" | string;
  category: { slug: string; name: string };
  createdAt?: string;
  lastPostAt?: string | null;
};

const statusClasses: Record<string, string> = {
  open: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100",
  resolved: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100",
  closed: "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100",
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
}

function ThreadRowBase({ t }: { t: Thread }) {
  const nav = useNavigate();
  const badgeClass = useMemo(
    () => statusClasses[t.status ?? "open"] ?? statusClasses.open,
    [t.status]
  );

  return (
    <div className="flex gap-4 p-4 border rounded-2xl bg-white shadow-sm hover:bg-muted/10 transition">
      <div className="flex flex-col items-center w-12 text-sm text-muted-foreground">
        <div className="font-semibold leading-none">▲ {t.score ?? 0}</div>
        <div className="leading-none mt-1">{t.commentCount ?? 0}💬</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/community/thread/${t.id}`}
            className="font-semibold hover:underline truncate"
            title={t.title}
          >
            {t.title}
          </Link>
          {t.status && t.status !== "open" && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${badgeClass}`}>
              {t.status}
            </span>
          )}
        </div>

        <div className="text-sm text-muted-foreground mt-1 truncate">
          in{" "}
          <Link className="underline" to={`/community/${t.category.slug}`}>
            {t.category.name}
          </Link>{" "}
          • {t.commentCount ?? 0} replies • updated{" "}
          {fmtDate(t.lastPostAt ?? t.createdAt)}
        </div>
      </div>

      <button
        className="text-sm underline px-2 py-1 rounded hover:bg-muted/20"
        onClick={() => nav(-1)}
        aria-label="Go back"
        type="button"
      >
        Back
      </button>
    </div>
  );
}

export default memo(ThreadRowBase);
