//dwellwell-client/src/pages/community/CommunityCategory.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThreadComposer from "./components/ThreadComposer";
import ThreadRow from "./components/ThreadRow";
import { Link } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

export default function CommunityCategory() {
  const { categorySlug = "general" } = useParams();
  const params = useQuery();
  const [data, setData] = useState<any>({ items: [], page: 1, pageSize: 20, total: 0 });
  const [showCompose, setShowCompose] = useState(false);

  const fetch = () => forumApi.threads({ categorySlug, q: params.q, tag: params.tag, page: Number(params.page ?? 1) }).then(setData);

  useEffect(() => { fetch(); }, [categorySlug, params.q, params.tag, params.page]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link className="underline" to="/community">Community</Link>
          <span>/</span>
          <span className="capitalize">{categorySlug.replaceAll("-", " ")}</span>
        </div>
        <Button onClick={() => setShowCompose(true)}>New Thread</Button>
      </div>

      <div className="flex gap-2">
        <Input defaultValue={params.q ?? ""} placeholder="Search in category…" onKeyDown={(e: any) => {
          if (e.key === "Enter") window.location.search = `?q=${encodeURIComponent(e.currentTarget.value)}`;
        }} />
      </div>

      <div className="space-y-3">
        {data.items.map((t: any) => <ThreadRow key={t.id} t={t} />)}
      </div>

      {showCompose && <ThreadComposer categorySlug={categorySlug} onClose={() => { setShowCompose(false); fetch(); }} />}
    </div>
  );
}
