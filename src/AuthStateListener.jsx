// AuthStateListener.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './FireBaseConfig';

const AuthStateListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        navigate('/dashboard');
      } else {
        // User is signed out
        navigate('/');
      }
    });

    return unsubscribe;
  }, [navigate]);

  return null; // This component doesn't render any UI
};

export default AuthStateListener;
