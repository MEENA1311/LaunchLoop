
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // VITE_API_URL should be:
  // https://launch-loop-8oxi.vercel.app/api
  //
  // If the caller passes /api/auth/login, remove the duplicate /api.
  const cleanPath = path.startsWith('/api')
    ? path.slice(4)
    : path;

  const url = `${API_URL}${cleanPath}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !path.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const get = path =>
  api(path, { method: 'GET' });

export const post = (path, body) =>
  api(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });

export const put = (path, body) =>
  api(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

export const patch = (path, body) =>
  api(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

export const del = path =>
  api(path, { method: 'DELETE' });

export const upload = (path, formData) => {
  return api(path, {
    method: 'POST',
    body: formData
  });
};
