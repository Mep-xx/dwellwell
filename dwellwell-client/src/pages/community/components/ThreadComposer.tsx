// dwellwell-client/src/pages/community/components/ThreadComposer.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Category = {
  id: string;
  slug: string;
  name: string;
};

export default function ThreadComposer({
  categorySlug,
  onClose,
}: {
  categorySlug: string;
  onClose: () => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type] = useState<"discussion">("discussion");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // Load categories + pick initial selection
  useEffect(() => {
    let mounted = true;
    forumApi
      .categories()
      .then((cs: Category[]) => {
        if (!mounted) return;
        setCats(cs);
        const found = cs.find((x) => x.slug === categorySlug) ?? cs[0];
        if (found?.id) setCategoryId(found.id);
      })
      .catch((e: any) => setErr(e?.message ?? "Failed to load categories."));
    return () => {
      mounted = false;
    };
  }, [categorySlug]);

  const canSubmit = useMemo(
    () => !!categoryId && title.trim().length > 0 && body.trim().length > 0 && !submitting,
    [categoryId, title, body, submitting]
  );

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      await forumApi.createThread({
        categoryId,
        title: title.trim(),
        type,
        body: body.trim(),
      });
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Failed to post thread.");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, categoryId, title, type, body, onClose]);

  // Keyboard: Cmd/Ctrl+Enter to submit
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl rounded-2xl p-0 overflow-hidden"
        onOpenAutoFocus={(e) => {
          // prevent default focus trap so we can focus title
          e.preventDefault();
          setTimeout(() => titleRef.current?.focus(), 10);
        }}
      >
        <DialogHeader>
          <div className="mb-2">
            <DialogTitle className="text-xl">Start a new thread</DialogTitle>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 pb-6">
          <div className="space-y-4" onKeyDown={onKeyDown}>
            {/* Error */}
            {err && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </div>
            )}

            {/* Category */}
            <div className="grid gap-2">
              <label htmlFor="tc-category" className="text-sm text-muted-foreground">
                Category
              </label>
              <select
                id="tc-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-invalid={!categoryId}
              >
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <label htmlFor="tc-title" className="text-sm text-muted-foreground">
                Title
              </label>
              <Input
                id="tc-title"
                ref={titleRef}
                placeholder="Clear, descriptive title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    bodyRef.current?.focus();
                  }
                }}
                aria-invalid={title.trim().length === 0}
              />
            </div>

            {/* Body */}
            <div className="grid gap-2">
              <label htmlFor="tc-body" className="text-sm text-muted-foreground">
                Details
              </label>
              <Textarea
                id="tc-body"
                ref={bodyRef}
                placeholder="Describe your issue, tip, or discussion topic…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                aria-invalid={body.trim().length === 0}
              />
              <div className="text-[11px] text-muted-foreground">
                Pro tip: press <kbd className="rounded border px-1">Ctrl</kbd>/
                <kbd className="rounded border px-1">⌘</kbd> + <kbd className="rounded border px-1">Enter</kbd> to post.
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSubmit}>
                {submitting ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
