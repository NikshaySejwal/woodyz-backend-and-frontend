import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

const getAuthErrorMessage = (error, fallback) => {
  const responseError = error.response?.data;
  if (typeof responseError === 'string') return responseError;
  if (typeof responseError?.message === 'string') return responseError.message;
  if (typeof responseError?.error === 'string' && responseError.error !== 'Internal Server Error') {
    return responseError.error;
  }
  return fallback;
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Potentially verify token or fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { token } = response.data;
      localStorage.setItem('token', token);
      await fetchUserProfile();
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      return { success: false, error: getAuthErrorMessage(error, 'Login failed') };
    }
  };

  const signup = async (username, email, password) => {
    try {
      await api.post('/api/auth/signup', { username, email, password });
      // Optionally login automatically or redirect to login
      router.push('/auth/login');
      return { success: true };
    } catch (error) {
      console.error('Signup error', error);
      return { success: false, error: getAuthErrorMessage(error, 'Signup failed') };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
