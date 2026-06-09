import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for unauthorized events dispatched by the axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
    };
    const handleDeactivated = () => {
      setUser(null);
      window.location.href = '/login';
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:deactivated', handleDeactivated);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:deactivated', handleDeactivated);
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData, userRoles, rolesCount } = response.data;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const fullUserResponse = await axios.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fullUser = fullUserResponse.data.user;

        const finalRoles = (userRoles && userRoles.length > 0)
          ? userRoles
          : (fullUser.roles && fullUser.roles.length > 0)
          ? fullUser.roles
          : [fullUser.userType];

        const finalCount = rolesCount || finalRoles.length;
        const isDualRole = finalCount > 1;

        if (!isDualRole) {
          // Single role: set user immediately so App.jsx redirects to dashboard
          localStorage.setItem('user', JSON.stringify(fullUser));
          setUser(fullUser);
        }
        // Dual role: do NOT call setUser yet — App.jsx watches user state and would
        // redirect away from /login before the role-selection modal can render.
        // finalizeLogin() is called after the user picks a role.

        return { success: true, user: fullUser, userRoles: finalRoles, rolesCount: finalCount };
      } catch {
        const finalRoles = (userRoles && userRoles.length > 0) ? userRoles : [userData.userType];
        const isDualRole = (rolesCount || finalRoles.length) > 1;
        if (!isDualRole) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        return { success: true, user: userData, userRoles: finalRoles, rolesCount: rolesCount || finalRoles.length };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.response?.data?.message || 'Login failed' };
    }
  };

  // Called by Login.jsx after the user picks a role from the popup (dual-role users)
  const finalizeLogin = (userData, selectedRole) => {
    const userWithRole = { ...userData, userType: selectedRole };
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
  };

  const switchRole = (role) => {
    const updated = { ...user, userType: role };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user: newUser, success } = response.data;
      
      if (!token || !newUser) {
        return { success: false, error: 'Invalid registration response from server' };
      }
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch full user data
      try {
        const fullUserResponse = await axios.get('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fullUser = fullUserResponse.data.user;
        localStorage.setItem('user', JSON.stringify(fullUser));
        setUser(fullUser);
        return { success: true, user: fullUser };
      } catch {
        // Fallback to limited user data if me endpoint fails
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        return { success: true, user: newUser };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.response?.data?.error || error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (updatedData) => {
    // Preserve the currently active userType (role) — don't let DB primary role overwrite it.
    // e.g. a dual-role user logged in as 'worker' should stay as 'worker' after profile save.
    const updatedUser = { ...user, ...updatedData, userType: user.userType };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    finalizeLogin,
    register,
    logout,
    updateUser,
    switchRole,
    isAuthenticated: !!user,
    isWorker: user?.userType === 'worker',
    isEmployer: user?.userType === 'employer',
    isAdmin: user?.userType === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
