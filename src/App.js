import React from 'react';
import { AppRouters } from './constants/router/AppRouters';
import { ThemeProvider } from './context/ThemeContext';
import secureLocalStorage from 'react-secure-storage';
export const AuthContext = React.createContext();

const USER_STORAGE_KEY = 'institute-user-session';
const PROFILES_STORAGE_KEY = 'institute-student-profiles';

const clearStoredAuthentication = () => {
  try {
    secureLocalStorage.removeItem('user');
    secureLocalStorage.removeItem('studentProfiles');
  } catch (error) {
    // Continue clearing the standard storage if secure storage is unavailable.
  }
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(PROFILES_STORAGE_KEY);
  sessionStorage.removeItem('institute-auth-token');
};

const getInitialState = () => {
  clearStoredAuthentication();
  return {
    isAuthenticated: false,
    user: {},
    studentProfiles: [],
  };
};

const initialStateAuth = getInitialState();

const reducerAuth = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      sessionStorage.setItem('institute-auth-token', action.payload.token || '');
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        studentProfiles: action.payload.studentProfiles || [],
      };
    case 'SELECT_STUDENT':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      secureLocalStorage.removeItem('user');
      secureLocalStorage.clear();
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(PROFILES_STORAGE_KEY);
      localStorage.clear();
      sessionStorage.removeItem('institute-auth-token');
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

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ stateAuth, dispatchAuth }}>
        <AppRouters />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
