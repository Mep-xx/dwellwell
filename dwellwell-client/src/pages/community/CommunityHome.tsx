//dwellwell-client/src/pages/CommunityHome.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";
// icon set (lucide-react)
import { MessageCircle, Bug, Lightbulb, Wrench } from "lucide-react";

const categoryMeta: Record<string, { icon: ReactNode; bg: string; ring: string }> = {
  "general": { icon: <MessageCircle size={16} />, bg: "bg-blue-50", ring: "ring-blue-200" },
  "bug-reports": { icon: <Bug size={16} />, bg: "bg-red-50", ring: "ring-red-200" },
  "tips-and-tricks": { icon: <Lightbulb size={16} />, bg: "bg-amber-50", ring: "ring-amber-200" },
  "trackable-corrections": { icon: <Wrench size={16} />, bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

export default function CommunityHome() {
  const [cats, setCats] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    forumApi.categories().then(setCats);
    forumApi.recent(6).then(setRecent);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    // Global search: jump to General with ?q=... (or you could build a /community/search route)
    nav(`/community/general?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">DwellWell Community</h1>

      {/* Search */}
      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search threads..." />
        {/* removed the 'Enter' button; submit via Enter key */}
      </form>

      {/* Category grid with color + icon */}
      <div className="grid sm:grid-cols-2 gap-4">
        {cats.map(c => {
          const meta = categoryMeta[c.slug] ?? { icon: <MessageCircle size={16}/>, bg: "bg-gray-50", ring: "ring-gray-200" };
          return (
            <Link key={c.id} to={`/community/${c.slug}`} className={`block rounded-xl border p-4 hover:shadow-sm ring-1 ${meta.ring} ${meta.bg}`}>
              <div className="flex items-center gap-2 font-semibold">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
                  {meta.icon}
                </span>
                {c.name}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent threads */}
      <div className="pt-4 space-y-3">
        <div className="text-sm uppercase text-muted-foreground">Recent activity</div>
        {recent.map((t) => (
          <Link key={t.id} to={`/community/thread/${t.id}`} className="block rounded-xl border p-3 hover:bg-muted/40">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground">
                  in <span className="underline">{t.category.name}</span> • {t.commentCount} replies • updated {new Date(t.lastPostAt ?? Date.now()).toLocaleString()}
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
