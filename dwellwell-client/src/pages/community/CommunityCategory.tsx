// dwellwell-client/src/pages/community/CommunityCategory.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThreadComposer from "./components/ThreadComposer";
import ThreadRow from "./components/ThreadRow";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

export default function CommunityCategory() {
  const { categorySlug = "general" } = useParams();
  const params = useQuery();
  const [data, setData] = useState<any>({ items: [], page: 1, pageSize: 20, total: 0 });
  const [showCompose, setShowCompose] = useState(false);
  const [searchVal, setSearchVal] = useState<string>((params.q as string) ?? "");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await forumApi.threads({
        categorySlug,
        q: params.q,
        tag: params.tag,
        page: Number(params.page ?? 1),
      });
      setData(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to load threads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, params.q, params.tag, params.page]);

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

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.search = `?q=${encodeURIComponent(searchVal)}`;
        }}
      >
        <Input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search in category…"
        />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {err && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No threads yet.</div>
          ) : (
            data.items.map((t: any) => <ThreadRow key={t.id} t={t} />)
          )}
        </div>
      )}

      {showCompose && (
        <ThreadComposer
          categorySlug={categorySlug}
          onClose={() => {
            setShowCompose(false);
            fetch();
          }}
        />
      )}
    </div>
  );
}
