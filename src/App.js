import React from 'react';
import { AppRouters } from './constants/router/AppRouters';
import { ThemeProvider } from './context/ThemeContext';
import GlobalSuccessToast from './components/common/GlobalSuccessToast';
import { AUTH_INVALID_EVENT, clearAuthSession, getSessionExpiration, loadAuthSession, saveAuthSession } from './services/Authentication/authSession';
export const AuthContext = React.createContext();

const getInitialState = () => {
  const session = loadAuthSession();
  return {
    isAuthenticated: Boolean(session),
    user: session?.user || {},
    studentProfiles: session?.studentProfiles || [],
    token: session?.token || '',
    expiresAt: session?.expiresAt,
  };
};

const initialStateAuth = getInitialState();

const reducerAuth = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      saveAuthSession(action.payload);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        studentProfiles: action.payload.studentProfiles || [],
        token: action.payload.token || '',
        expiresAt: action.payload.expiresAt,
      };
    case 'SELECT_STUDENT':
      saveAuthSession({ ...state, user: action.payload.user });
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      clearAuthSession();
      return {
        ...state,
        isAuthenticated: false,
        user: {},
        studentProfiles: [],
        token: '',
        expiresAt: undefined,
      };
    default:
      return state;
  }
};

function App() {
  const [stateAuth, dispatchAuth] = React.useReducer(
    reducerAuth,
    initialStateAuth
  );

  React.useEffect(() => {
    const handleInvalidSession = () => dispatchAuth({ type: 'LOGOUT' });
    window.addEventListener(AUTH_INVALID_EVENT, handleInvalidSession);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleInvalidSession);
  }, []);

  React.useEffect(() => {
    if (!stateAuth.isAuthenticated) return undefined;
    const expiresAt = getSessionExpiration({
      token: stateAuth.token,
      expiresAt: stateAuth.expiresAt,
    });
    if (!expiresAt) return undefined;
    const timeout = window.setTimeout(
      () => dispatchAuth({ type: 'LOGOUT' }),
      Math.max(0, expiresAt - Date.now())
    );
    return () => window.clearTimeout(timeout);
  }, [stateAuth.isAuthenticated, stateAuth.token, stateAuth.expiresAt]);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ stateAuth, dispatchAuth }}>
        <AppRouters />
        <GlobalSuccessToast />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
