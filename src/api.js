import { loadAuth, clearAuth } from './auth';

// The server address comes from the environment (.env locally, an environment variable on Render).
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5082';

// An error that keeps the HTTP status, so a screen can react differently to 409, 401, 404...
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// The one function that talks to the server. Every screen uses it, so the token header
// and the error handling are written once.
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};

  const auth = loadAuth();
  if (auth) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    // fetch fails only when there is no answer at all (server down / CORS / no network).
    throw new ApiError(0, 'Cannot reach the server. If it was asleep, it is waking up – try again in a minute.');
  }

  // A token that the server rejected (expired / invalid) -> log out and tell the App.
  if (response.status === 401 && auth) {
    clearAuth();
    window.dispatchEvent(new Event('auth-expired'));
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(response.status, data));
  }
  return data;
}

// The server answers errors as ProblemDetails:
//   { detail: "..." }                          - from a Service (Result.Fail)
//   { errors: { Email: ["..."] }, title: "..." } - automatic 400 of [ApiController] (Data Annotations)
function errorMessage(status, data) {
  if (data?.detail) return data.detail;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  if (data?.title) return data.title;
  return `Error ${status}`;
}

// Dates arrive in UTC; they are turned into local time only for display.
export function formatDate(utc) {
  return new Date(utc).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatTime(utc) {
  return new Date(utc).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatPrice(price) {
  return `₪${Number(price).toLocaleString('en-US')}`;
}
