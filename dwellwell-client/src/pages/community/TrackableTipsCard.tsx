// dwellwell-client/src/pages/community/TrackableTipsCard.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Link } from "react-router-dom";

export default function TrackableTipsCard({ trackableId }: { trackableId: string }) {
  const [tips, setTips] = useState<any[] | null>(null);

  useEffect(() => {
    setTips(null);
    forumApi.tipsForTrackable(trackableId, 3).then(setTips);
  }, [trackableId]);

  if (!tips || tips.length === 0) {
    return tips === null ? (
      <div className="rounded-xl border p-4 bg-card shadow-sm">
        <div className="h-5 w-40 bg-muted/40 rounded animate-pulse" />
        <div className="mt-3 space-y-2">
          <div className="h-16 rounded-md bg-muted/30 animate-pulse" />
          <div className="h-16 rounded-md bg-muted/30 animate-pulse" />
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="rounded-xl border p-4 bg-card shadow-sm">
      <div className="font-semibold">Community Tips</div>
      <div className="mt-2 space-y-2">
        {tips.map((t) => (
          <Link key={t.id} to={`/community/thread/${t.id}`} className="block">
            <div className="rounded-md p-3 bg-card border hover:bg-muted/20">
              <div className="font-medium line-clamp-1" title={t.title}>{t.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">
                {t.posts?.[0]?.body ?? "Open to read more…"}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-right mt-2">
        <Link
          to={`/community/trackable-corrections?tag=${encodeURIComponent(trackableId)}`}
          className="text-sm underline"
        >
          See more
        </Link>
      </div>
    </div>
  );
}
