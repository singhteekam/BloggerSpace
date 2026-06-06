import { api } from "./client";

export type BlogForEdit = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  content: string;
  status: string;
  authorDetails?: {
    fullName?: string;
    userName?: string;
    email?: string;
  };
};

export type BlogWritePayload = {
  id?: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  userId: string;
  authorEmail: string;
};

export type BlogEditPayload = {
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
};

export const blogWriteApi = {
  checkTitle: (title: string, excludeId?: string) =>
    api.post<{ message: string }>("/api/blogs/isuniquetitle", { title, excludeId }),

  // Slug is the authoritative uniqueness check (/blogs/:slug must be unique).
  checkSlug: (slug: string, excludeId?: string) =>
    api.post<{ message: string }>("/api/blogs/isuniqueslug", { slug, excludeId }),

  generateAI: (title: string) =>
    api.post<{ html: string }>("/api/blogs/generateblog", { title }),

  create: (payload: BlogWritePayload) =>
    api.post<{ message: string }>("/api/blogs/newblog", payload, {
      params: { userId: payload.userId },
    }),

  saveDraft: (payload: BlogWritePayload) =>
    api.post<BlogForEdit>("/api/blogs/saveasdraft", payload, {
      params: { userId: payload.userId },
    }),

  getForEdit: (blogId: string) =>
    api.get<BlogForEdit>(`/api/blogs/editblog/${blogId}`),

  update: (blogId: string, payload: BlogEditPayload) =>
    api.put<{ message: string }>(`/api/blogs/editblog/save/${blogId}`, payload),

  updateDraft: (blogId: string, payload: BlogEditPayload) =>
    api.put<{ message: string }>(`/api/blogs/editblog/save/${blogId}?draft=true`, payload),
};
