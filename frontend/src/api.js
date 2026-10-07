// Single point of contact with the backend. Nothing else in the frontend
// should call fetch() directly — that's what makes it possible to add
// caching, retries, or auth headers here later without touching any UI code.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status} ${path}`);
  }
  return res.json();
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed: ${res.status} ${path}`);
  }
  return res.json();
}

export const api = {
  listAreas: (includeHistory = false) => getJson(`/api/areas${includeHistory ? '?includeHistory=true' : ''}`),
  getArea: (id) => getJson(`/api/areas/${encodeURIComponent(id)}`),
  getRainfall: () => getJson('/api/rainfall'),
  getSources: () => getJson('/api/sources'),
  runScenario: (payload) => postJson('/api/scenario', payload),
};

export { API_BASE };
