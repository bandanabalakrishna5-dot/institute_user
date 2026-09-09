import secureLocalStorage from 'react-secure-storage';

const SESSION_KEY = 'institute-user-session';
const PROFILES_KEY = 'institute-student-profiles';
const SECURE_SESSION_KEY = 'user';
const SECURE_PROFILES_KEY = 'studentProfiles';

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const getToken = (user = {}) =>
  user.token || user.accessToken || user.access_token || user.jwt || '';

const isTokenExpired = (token) => {
  if (!token || String(token).split('.').length !== 3) return false;
  try {
    const encodedPayload = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')));
    return Boolean(payload.exp && Date.now() >= Number(payload.exp) * 1000);
  } catch (error) {
    return true;
  }
};

export const clearStoredAuthentication = () => {
  try {
    secureLocalStorage.removeItem(SECURE_SESSION_KEY);
    secureLocalStorage.removeItem(SECURE_PROFILES_KEY);
  } catch (error) {
    // Standard storage is retained as a compatibility fallback.
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILES_KEY);
};

export const saveAuthentication = (user, studentProfiles = []) => {
  const session = { user, token: getToken(user), savedAt: Date.now() };
  try {
    secureLocalStorage.setItem(SECURE_SESSION_KEY, session);
    secureLocalStorage.setItem(SECURE_PROFILES_KEY, studentProfiles);
  } catch (error) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(PROFILES_KEY, JSON.stringify(studentProfiles));
  }
};

export const restoreAuthentication = () => {
  let session;
  let studentProfiles;
  try {
    session = secureLocalStorage.getItem(SECURE_SESSION_KEY);
    studentProfiles = secureLocalStorage.getItem(SECURE_PROFILES_KEY);
  } catch (error) {
    session = null;
  }

  session = session || parseJson(localStorage.getItem(SESSION_KEY), null);
  studentProfiles = Array.isArray(studentProfiles)
    ? studentProfiles
    : parseJson(localStorage.getItem(PROFILES_KEY), []);
  const user = session?.user || session;
  const token = session?.token || getToken(user);
  const validUser = user && user.usrid && ['STUDENT', 'STAFF', 'TRANSPORT'].includes(String(user.typ || '').toUpperCase());

  if (!validUser || isTokenExpired(token)) {
    clearStoredAuthentication();
    return { isAuthenticated: false, user: {}, studentProfiles: [] };
  }

  return { isAuthenticated: true, user, studentProfiles };
};

export const getStoredAccessToken = () => {
  try {
    const session = secureLocalStorage.getItem(SECURE_SESSION_KEY);
    return session?.token || getToken(session?.user || session);
  } catch (error) {
    return parseJson(localStorage.getItem(SESSION_KEY), null)?.token || '';
  }
};
