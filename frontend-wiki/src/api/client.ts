import { api } from './client';

// ... existing code ...

// Wiki Service Client
export const WikiApi = {
  // ... existing methods ...
  
  getPages: async () => {
    // Assuming the backend has a list endpoint. 
    // If not, we might need to implement it in the backend or use search as a fallback.
    // Let's assume GET /wiki/pages exists and returns a list.
    // If it doesn't, I'll need to check the backend code again.
    const response = await api.get('/wiki/pages'); 
    return response.data;
  },

  getPage: async (slug: string) => {
    const response = await api.get(`/wiki/pages/${slug}`);
    return response.data;
  },

  createPage: async (data: { slug: string; title: string; content: string; namespace?: string }) => {
    const response = await api.post('/wiki/pages', data);
    return response.data;
  },

  updatePage: async (slug: string, data: { content: string; version: number; commit_message?: string }) => {
    const response = await api.put(`/wiki/pages/${slug}`, data);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get('/wiki/search', { params: { q: query } });
    return response.data;
  }
};
