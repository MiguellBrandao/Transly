import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export const api = {
  async get(endpoint: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async post(endpoint: string, data?: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async put(endpoint: string, data: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async delete(endpoint: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async upload(endpoint: string, formData: FormData, onProgress?: (progress: number) => void) {
    const headers = await getAuthHeader();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('POST', `${API_URL}${endpoint}`);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value as string);
      });

      xhr.send(formData);
    });
  },
};

