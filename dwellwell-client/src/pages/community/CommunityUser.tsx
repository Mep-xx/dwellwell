//dwellwell-client/src/pages/community/CommunityUser.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { forumApi } from "@/utils/apiForum";

export default function CommunityUser() {
  const { userId = "" } = useParams();
  const [data, setData] = useState<any>(null);
  useEffect(() => { forumApi.profile(userId).then(setData); }, [userId]);
  if (!data) return null;
  const { user, rep, threads, posts } = data;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        {user.avatarUrl ? <img src={user.avatarUrl} className="h-12 w-12 rounded-full" /> :
          <div className="h-12 w-12 rounded-full bg-muted" />}
        <div>
          <div className="font-semibold">{user.email}</div>
          <div className="text-sm text-muted-foreground">Lv {rep.level} • {rep.totalXP} XP</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm uppercase text-muted-foreground mb-2">Recent threads</div>
          <div className="space-y-2">
            {threads.map((t: any) => (
              <Link
                key={t.id}
                className="block border rounded p-2 bg-white shadow-sm hover:bg-muted/20"
                to={`/community/thread/${t.id}`}
              >
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">in {t.category.name} • ▲ {t.score} • {new Date(t.lastPostAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm uppercase text-muted-foreground mb-2">Recent replies</div>
          <div className="space-y-2">
            {posts.map((p: any) => (
              <Link
                key={p.id}
                className="block border rounded p-2 bg-white shadow-sm hover:bg-muted/20"
                to={`/community/thread/${p.threadId}`}
              >
                <div className="font-medium line-clamp-1">{p.thread?.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
