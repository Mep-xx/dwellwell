//dwellwell-client/src/pages/community/CommunityThread.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { forumApi } from "@/utils/apiForum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UserChip from "./components/UserChip";

export default function CommunityThread() {
  const { threadId = "" } = useParams();
  const [data, setData] = useState<any>(null);
  const [reply, setReply] = useState("");

  const fetch = () => forumApi.getThread(threadId).then(setData);
  useEffect(() => { fetch(); }, [threadId]);

  if (!data) return null;
  const { thread, rep } = data;

  async function sendReply() {
    await forumApi.createPost(thread.id, reply);
    setReply("");
    fetch();
  }

  async function upvoteThread() { await forumApi.vote({ threadId: thread.id, value: 1 }); fetch(); }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center w-12">
          <button onClick={upvoteThread} aria-label="upvote">▲</button>
          <div className="text-sm">{thread.score}</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{thread.title}</h1>
            {thread.type !== "discussion" && <span className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">{thread.type}</span>}
            {thread.status !== "open" && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">{thread.status}</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            in {thread.category.name} • {new Date(thread.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* OP + replies */}
      <div className="space-y-4">
        {thread.posts.map((p:any) => (
          <div key={p.id} className="border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <UserChip user={p.author} rep={rep[p.author.id] ?? { level: 1, totalXP: 0 }} />
              <div className="flex items-center gap-2">
                {p.isAnswer && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Accepted</span>}
                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert mt-2 whitespace-pre-wrap">{p.body}</div>

            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => forumApi.vote({ postId: p.id, value: 1 }).then(fetch)}>▲ {p.score}</button>
              {/* Admin-only accept action could be gated by role in your app */}
            </div>
          </div>
        ))}
      </div>

      {/* reply box */}
      <div className="border rounded-xl p-4">
        <Textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write a reply…" rows={5} />
        <div className="flex justify-end pt-2"><Button onClick={sendReply} disabled={!reply}>Reply</Button></div>
      </div>
    </div>
  );
}
