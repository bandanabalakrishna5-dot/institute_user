import React from 'react';
import { AppRouters } from './constants/router/AppRouters';
import { ThemeProvider } from './context/ThemeContext';
import secureLocalStorage from 'react-secure-storage';
export const AuthContext = React.createContext();

const USER_STORAGE_KEY = 'institute-user-session';
const PROFILES_STORAGE_KEY = 'institute-student-profiles';

const getStoredValue = (secureKey, fallbackKey) => {
  try {
    const secureValue = secureLocalStorage.getItem(secureKey);
    if (secureValue && secureValue !== 'undefined' && secureValue !== 'null') return secureValue;
  } catch (error) {
    // Android WebView storage keys can change after an app process restart.
  }
  return localStorage.getItem(fallbackKey);
};

const getInitialState = () => {
  const userData = getStoredValue('user', USER_STORAGE_KEY);
  const profilesData = getStoredValue('studentProfiles', PROFILES_STORAGE_KEY);
  let user = {};
  let isAuthenticated = false;

  if (userData && userData !== 'undefined' && userData !== 'null') {
    try {
      const parsedUser =
        typeof userData === 'string' ? JSON.parse(userData) : userData;
      if (parsedUser && Object.keys(parsedUser).length > 0) {
        user = parsedUser;
        isAuthenticated = true;
      }
    } catch (e) {
      user = {};
      isAuthenticated = false;
    }
  }

  return {
    isAuthenticated,
    user,
    studentProfiles: (() => {
      try {
        return profilesData
          ? (typeof profilesData === 'string' ? JSON.parse(profilesData) : profilesData)
          : [];
      } catch (e) {
        return [];
      }
    })(),
  };
};

const initialStateAuth = getInitialState();

const reducerAuth = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      secureLocalStorage.setItem('user', JSON.stringify(action.payload.user));
      secureLocalStorage.setItem('studentProfiles', JSON.stringify(action.payload.studentProfiles || []));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(action.payload.user));
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(action.payload.studentProfiles || []));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        studentProfiles: action.payload.studentProfiles || [],
      };
    case 'SELECT_STUDENT':
      secureLocalStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(action.payload.user));
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
