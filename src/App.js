import React from 'react';
import { AppRouters } from './constants/router/AppRouters';
import { ThemeProvider } from './context/ThemeContext';
import AppUpdateSnackbar from './components/common/AppUpdateSnackbar';
import {
  clearStoredAuthentication,
  restoreAuthentication,
  saveAuthentication,
} from './services/Authentication/sessionStorage';
export const AuthContext = React.createContext();

const initialStateAuth = restoreAuthentication();

const reducerAuth = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      saveAuthentication(action.payload.user, action.payload.studentProfiles || []);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        studentProfiles: action.payload.studentProfiles || [],
      };
    case 'SELECT_STUDENT':
      saveAuthentication(action.payload.user, state.studentProfiles || []);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      clearStoredAuthentication();
      return {
        ...state,
        isAuthenticated: false,
        user: {},
        studentProfiles: [],
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
    const invalidateSession = () => dispatchAuth({ type: 'LOGOUT' });
    window.addEventListener('institute-auth-invalid', invalidateSession);
    return () => window.removeEventListener('institute-auth-invalid', invalidateSession);
  }, []);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ stateAuth, dispatchAuth }}>
        <AppRouters />
        <AppUpdateSnackbar />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
