//dwellwell-client/src/pages/community/TrackableTipsCard.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Link } from "react-router-dom";

export default function TrackableTipsCard({ trackableId }: { trackableId: string }) {
  const [tips, setTips] = useState<any[]>([]);
  useEffect(() => { forumApi.tipsForTrackable(trackableId, 3).then(setTips); }, [trackableId]);

  if (!tips.length) return null;
  return (
    <div className="rounded-xl border p-4">
      <div className="font-semibold">Community Tips</div>
      <div className="mt-2 space-y-2">
        {tips.map(t => (
          <Link key={t.id} to={`/community/thread/${t.id}`} className="block">
            <div className="rounded-md p-3 hover:bg-muted/40">
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{t.posts?.[0]?.body}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-right mt-2">
        <Link to={`/community/trackable-corrections?tag=${trackableId}`} className="text-sm underline">See more</Link>
      </div>
    </div>
  );
}
