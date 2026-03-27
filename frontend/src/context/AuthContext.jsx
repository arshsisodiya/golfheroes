import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('golf_token');
    if (token) {
      api.get('/auth/me').then(u => setUser(u)).catch(() => localStorage.removeItem('golf_token')).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    localStorage.setItem('golf_token', token);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const { token, user } = await api.post('/auth/register', data);
    localStorage.setItem('golf_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('golf_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await api.get('/auth/me');
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
