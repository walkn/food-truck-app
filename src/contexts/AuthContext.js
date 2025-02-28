import React, { createContext, useContext, useState, useEffect } from 'react';

// Placeholder for Firebase functions - we'll implement these later
const registerUser = async (email, password) => ({ user: null, error: null });
const signIn = async (email, password) => ({ user: null, error: null });
const signOut = async () => ({ error: null });
const subscribeToAuthChanges = (callback) => {
  callback(null);
  return () => {};
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = () => {};
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    register: registerUser,
    login: signIn,
    logout: signOut,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};