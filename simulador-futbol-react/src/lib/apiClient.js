const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function parseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

export async function apiFetch(path, options = {}, token) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await parseBody(response).catch(() => null);

  if (!response.ok) {
    const message = data?.error || response.statusText || 'Error en la solicitud';
    throw new Error(message);
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
