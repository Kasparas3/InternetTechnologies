// app.js — tiny API helper shared by login.html and index.html.
// All HTTP calls in the app go through the `api(...)` function below,
// which automatically attaches the JWT token as the Authorization header.

// The base URL of our API. Since the backend also serves this HTML file,
// it's the same origin, so a relative path is enough — no CORS needed.
const API_BASE = '/api';

// Small wrapper around fetch() that:
//   1. Prepends the API base URL
//   2. Adds the Authorization: Bearer <token> header from localStorage
//   3. Parses the JSON response
//   4. Throws an Error if the status is not 2xx
async function api(path, { method = 'GET', body, query } = {}) {
  // Build URL with optional query string.
  let url = API_BASE + path;
  if (query) {
    const params = new URLSearchParams(query);
    url += '?' + params.toString();
  }

  // Build headers. Always JSON; add Authorization if we have a token.
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 means our token expired / is invalid → kick back to login.
  if (res.status === 401) {
    localStorage.removeItem('token');
    if (!location.pathname.endsWith('login.html')) {
      location.href = 'login.html';
    }
    throw new Error('Not authenticated');
  }

  // 204 No Content (used by DELETE) has no body.
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
