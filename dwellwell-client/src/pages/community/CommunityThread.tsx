// dwellwell-client/src/pages/community/CommunityThread.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserChip from "./components/UserChip";

export default function CommunityThread() {
  const { threadId = "" } = useParams();
  const [data, setData] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const canReply = useMemo(() => reply.trim().length > 0, [reply]);

  const fetch = () => {
    setLoading(true);
    setErr(null);
    forumApi
      .getThread(threadId)
      .then(setData)
      .catch((e: any) => setErr(e?.response?.data?.message ?? e?.message ?? "Failed to load thread."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 space-y-4">
        <div className="h-20 rounded-2xl border bg-muted/30 animate-pulse" />
        <div className="h-40 rounded-2xl border bg-muted/30 animate-pulse" />
      </div>
    );
  }
  if (err) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { thread, rep } = data;

  async function sendReply() {
    if (!canReply) return;
    await forumApi.createPost(thread.id, reply.trim());
    setReply("");
    fetch();
  }

  async function upvoteThread() {
    await forumApi.vote({ threadId: thread.id, value: 1 });
    fetch();
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center w-12">
          <button
            onClick={upvoteThread}
            aria-label="Upvote this thread"
            className="rounded px-2 py-1 hover:bg-muted/30"
          >
            ▲
          </button>
          <div className="text-sm">{thread.score}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">
            <Link className="underline" to="/community">
              Community
            </Link>{" "}
            /{" "}
            <Link className="underline" to={`/community/${thread.category.slug}`}>
              {thread.category.name}
            </Link>
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{thread.title}</h1>
            {thread.type !== "discussion" && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                {thread.type}
              </span>
            )}
            {thread.status !== "open" && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                {thread.status}
              </span>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            in {thread.category.name} • {new Date(thread.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {thread.posts.map((p: any) => (
          <div key={p.id} className="border rounded-2xl p-4 bg-card shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <UserChip user={p.author} rep={rep[p.author.id] ?? { level: 1, totalXP: 0 }} />
              <div className="flex items-center gap-2">
                {p.isAnswer && (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                    Accepted
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert mt-2 whitespace-pre-wrap break-words">
              {p.body}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => forumApi.vote({ postId: p.id, value: 1 }).then(fetch)}
                className="rounded px-2 py-1 hover:bg-muted/30"
                aria-label={`Upvote post, current score ${p.score}`}
              >
                ▲ {p.score}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-2xl p-4 bg-card shadow-sm">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply…"
          rows={5}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              sendReply();
            }
          }}
        />
        <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
          <span>
            Tip: Press <kbd className="border px-1 rounded">Ctrl</kbd>/<kbd className="border px-1 rounded">⌘</kbd>+
            <kbd className="border px-1 rounded">Enter</kbd> to reply.
          </span>
          <Button onClick={sendReply} disabled={!canReply}>
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
