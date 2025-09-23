//dwellwell-client/src/utils/apiForum.ts
import { api } from "@/utils/api";

export const forumApi = {
  categories: () => api.get("/forum/categories").then(r => r.data.categories),

  threads: (p: { categorySlug?: string; tag?: string; q?: string; page?: number }) =>
    api.get("/forum/threads", { params: p }).then(r => r.data),

  createThread: (data: {
    categoryId: string; title: string; type?: "discussion"|"bug"|"tip"|"correction";
    body: string; trackableId?: string; taskTemplateId?: string; tags?: string[];
  }) => api.post("/forum/threads", data).then(r => r.data),

  getThread: (threadId: string) => api.get(`/forum/threads/${threadId}`).then(r => r.data),

  createPost: (threadId: string, body: string) =>
    api.post(`/forum/threads/${threadId}/posts`, { body }).then(r => r.data),

  updatePost: (postId: string, body: string) =>
    api.patch(`/forum/posts/${postId}`, { body }).then(r => r.data),

  vote: (payload: { threadId?: string; postId?: string; value: 1 | -1 }) =>
    api.post("/forum/votes", payload).then(r => r.data),

  // moderation (admin)
  acknowledge: (threadId: string) => api.post(`/forum/threads/${threadId}/acknowledge`),
  resolve: (threadId: string) => api.post(`/forum/threads/${threadId}/resolve`),
  accept: (postId: string) => api.post(`/forum/posts/${postId}/accept`),

  tipsForTrackable: (trackableId: string, limit = 3) =>
    api.get("/forum/tips", { params: { trackableId, limit } }).then(r => r.data.tips),
};
