import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedAdminRoute({ children }) {
  const [loading, setLoading] = useState(true); // stays true until Firebase confirms auth state
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // onAuthStateChanged fires once Firebase has restored the session from storage.
    // auth.currentUser is null synchronously on refresh — never read it outside this callback.
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // empty deps — runs once on mount, waits for Firebase

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
