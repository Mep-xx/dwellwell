// dwellwell-client/src/pages/CommunityHome.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";
import { MessageCircle, Bug, Lightbulb, Wrench } from "lucide-react";

const categoryMeta: Record<string, { icon: ReactNode; bg: string; ring: string }> = {
  general: { icon: <MessageCircle size={16} />, bg: "bg-blue-50 dark:bg-blue-950/30", ring: "ring-blue-200 dark:ring-blue-800" },
  "bug-reports": { icon: <Bug size={16} />, bg: "bg-red-50 dark:bg-red-950/30", ring: "ring-red-200 dark:ring-red-800" },
  "tips-and-tricks": { icon: <Lightbulb size={16} />, bg: "bg-amber-50 dark:bg-amber-950/30", ring: "ring-amber-200 dark:ring-amber-800" },
  "trackable-corrections": { icon: <Wrench size={16} />, bg: "bg-emerald-50 dark:bg-emerald-950/30", ring: "ring-emerald-200 dark:ring-emerald-800" },
};

export default function CommunityHome() {
  const [cats, setCats] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([forumApi.categories(), forumApi.recent(6)])
      .then(([c, r]) => {
        setCats(c);
        setRecent(r);
      })
      .finally(() => setLoading(false));
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    nav(`/community/general?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">DwellWell Community</h1>

      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search threads..."
          aria-label="Search threads"
        />
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {(loading ? Array.from({ length: 4 }) : cats).map((c: any, i) => {
          if (loading) {
            return <div key={i} className="h-20 rounded-xl border bg-muted/30 animate-pulse" />;
          }
          const meta =
            categoryMeta[c.slug] ?? {
              icon: <MessageCircle size={16} />,
              bg: "bg-surface-alt dark:bg-slate-900/40",
              ring: "ring-gray-200 dark:ring-slate-800",
            };
          return (
            <Link
              key={c.id}
              to={`/community/${c.slug}`}
              className={`block rounded-xl border p-4 hover:shadow-sm ring-1 ${meta.ring} ${meta.bg}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-card dark:bg-slate-900 ring-1 ring-black/5">
                  {meta.icon}
                </span>
                {c.name}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 space-y-3">
        <div className="text-sm uppercase text-muted-foreground">Recent activity</div>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl border bg-muted/30 animate-pulse" />
            ))
          : recent.map((t) => (
              <Link
                key={t.id}
                to={`/community/thread/${t.id}`}
                className="block rounded-xl border p-3 bg-card shadow-sm hover:bg-muted/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      in <span className="underline">{t.category.name}</span> • {t.commentCount} replies • updated{" "}
                      {new Date(t.lastPostAt ?? Date.now()).toLocaleString()}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm text-muted-foreground">▲ {t.score}</div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
