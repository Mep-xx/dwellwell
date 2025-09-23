//dwellwell-client/src/pages/community/components/ThreadRow.tsx
import { Link } from "react-router-dom";

export default function ThreadRow({ t }: { t: any }) {
  return (
    <div className="flex gap-4 p-4 border rounded-xl bg-background">
      <div className="flex flex-col items-center w-12">
        <div className="text-sm">{t.score}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/community/thread/${t.id}`} className="font-semibold hover:underline truncate">{t.title}</Link>
          {t.type !== "discussion" && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">{t.type}</span>}
          {t.status !== "open" && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">{t.status}</span>}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          in <Link className="underline" to={`/community/${t.category.slug}`}>{t.category.name}</Link> • {t.commentCount} replies • updated {new Date(t.lastPostAt ?? t.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
