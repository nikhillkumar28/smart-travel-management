async function getErrorMessage(response, fallback) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data.message || fallback;
  }
  return (await response.text()) || fallback;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Authentication request failed.'));
  return response.json();
}

export function registerUser({ name, email, password }) {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function loginUser({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function getCurrentUser(token) {
  return request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}
