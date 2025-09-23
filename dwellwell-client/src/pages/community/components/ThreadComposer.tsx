//dwellwell-client/src/pages/community/components/ThreadComposer.tsx
import { useEffect, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ThreadComposer({ categorySlug, onClose }: { categorySlug: string; onClose: () => void }) {
  const [cats, setCats] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"discussion" | "bug" | "tip" | "correction">("discussion");
  const [body, setBody] = useState("");

  useEffect(() => {
    forumApi.categories().then((cs) => {
      setCats(cs);
      const c = cs.find((x: any) => x.slug === categorySlug) ?? cs[0];
      if (c?.id) setCategoryId(c.id);
    });
  }, [categorySlug]);

  async function submit() {
    await forumApi.createThread({ categoryId: categoryId!, title, type, body });
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New thread</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="text-sm">Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full rounded border p-2">
            {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <label className="text-sm">Type</label>
          <select value={type} onChange={e => setType(e.target.value as any)} className="w-full rounded border p-2">
            <option value="discussion">Discussion</option>
            <option value="bug">Bug</option>
            <option value="tip">Tip</option>
            <option value="correction">Correction</option>
          </select>

          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Describe your issue/tip…" value={body} onChange={e => setBody(e.target.value)} rows={8} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={!title || !body}>Post</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
