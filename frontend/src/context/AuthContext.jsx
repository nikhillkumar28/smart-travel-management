import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/auth.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'journo_travel_token';
const LEGACY_TOKEN_KEY = 'ai_travel_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    getCurrentUser(savedToken)
      .then(({ user: currentUser }) => {
        setToken(savedToken);
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function authenticate(authRequest) {
    const data = await authRequest();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user),
    login: (credentials) => authenticate(() => loginUser(credentials)),
    register: (credentials) => authenticate(() => registerUser(credentials)),
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
