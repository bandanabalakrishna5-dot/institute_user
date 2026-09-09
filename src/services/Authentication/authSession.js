import secureLocalStorage from 'react-secure-storage';

export const AUTH_SESSION_KEY = 'institute-user-session';
export const AUTH_INVALID_EVENT = 'institute-auth-invalid';

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(decodeURIComponent(atob(normalized).split('').map(
      (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
    ).join('')));
  } catch (_) {
    return null;
  }
};

export const getSessionToken = (session) =>
  session?.token || session?.user?.token || session?.user?.accessToken || session?.user?.access_token || '';

export const getSessionExpiration = (session) => {
  const tokenPayload = decodeJwtPayload(getSessionToken(session));
  return Number(session?.expiresAt || tokenPayload?.exp * 1000) || 0;
};

export const isSessionValid = (session) => {
  if (!session?.user || typeof session.user !== 'object' || !Object.keys(session.user).length) return false;

  const expiresAt = getSessionExpiration(session);
  return !expiresAt || expiresAt > Date.now();
};

export const saveAuthSession = ({ user, studentProfiles = [], token = '', expiresAt }) => {
  const session = { user, studentProfiles, token, expiresAt, savedAt: Date.now() };
  secureLocalStorage.setItem(AUTH_SESSION_KEY, session);
  return session;
};

export const loadAuthSession = () => {
  try {
    const session = secureLocalStorage.getItem(AUTH_SESSION_KEY);
    if (isSessionValid(session)) return session;
  } catch (_) {
    // A corrupted or unreadable session is treated as signed out.
  }
  clearAuthSession();
  return null;
};

export const clearAuthSession = () => {
  try {
    secureLocalStorage.removeItem(AUTH_SESSION_KEY);
    // Remove keys written by older releases without touching unrelated app data.
    secureLocalStorage.removeItem('user');
    secureLocalStorage.removeItem('studentProfiles');
  } catch (_) {
    // Storage may be unavailable in restricted/private browser contexts.
  }
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem('institute-student-profiles');
};

export const invalidateAuthSession = () => {
  clearAuthSession();
  window.dispatchEvent(new Event(AUTH_INVALID_EVENT));
};
