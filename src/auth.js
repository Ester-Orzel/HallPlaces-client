// Keeps the logged-in user (the server's AuthResponse: token, expiresAt, fullName, email, role) in localStorage,
// so a page refresh does not log the user out.
const STORAGE_KEY = 'hallplaces.auth';

export function saveAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

// Returns the saved user, or null if there is none or the token has already expired.
export function loadAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const auth = JSON.parse(raw);
    if (new Date(auth.expiresAt) <= new Date()) {
      clearAuth();
      return null;
    }
    return auth;
  } catch {
    clearAuth();
    return null;
  }
}
