import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { loginCall } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Run once when app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    const { data } = await loginCall({ email, password });

    if (data?.success) {
      const userData = {
        name: data.user.name,
        email: data.user.email,
        role: data.user.role
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(userData);
    }

    return data;
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
