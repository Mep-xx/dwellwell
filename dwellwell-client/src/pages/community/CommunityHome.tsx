//dwellwell-client/src/pages/CommunityHome.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CommunityHome() {
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { forumApi.categories().then(setCats); }, []);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DwellWell Community</h1>
        <Link to="/community/general">
          <Button>Enter</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cats.map(c => (
          <Link key={c.id} to={`/community/${c.slug}`}>
            <div className="rounded-xl border p-4 hover:bg-muted/40">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-muted-foreground">{c.description ?? ""}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 pt-4">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search threads..." />
        <Link to={`/community/general?q=${encodeURIComponent(q)}`}>
          <Button variant="secondary">Search</Button>
        </Link>
      </div>
    </div>
  );
}
