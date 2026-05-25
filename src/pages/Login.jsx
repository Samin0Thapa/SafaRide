import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  MarkEmailRead,
  EmailOutlined,
} from '@mui/icons-material';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification wall state
  const [showVerificationWall, setShowVerificationWall] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  // Keep credentials in a ref so we can re-authenticate for resend (never persisted)
  const tempCredsRef = useRef({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setError('');
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (e) {
      setError('Could not send reset email. Check the address.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // ── EMAIL VERIFICATION GATE ──────────────────────────────────────────
      if (!userCredential.user.emailVerified) {
        // Sign them back out immediately — unverified users cannot enter the app
        await signOut(auth);
        // Store credentials in memory only (for the resend button this session)
        tempCredsRef.current = { email: formData.email, password: formData.password };
        setShowVerificationWall(true);
        setLoading(false);
        return;
      }
      // ────────────────────────────────────────────────────────────────────

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend verification — re-signs in briefly, sends email, signs out again
  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const { email, password } = tempCredsRef.current;
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setResendSuccess(true);
    } catch (e) {
      console.error('Resend error:', e);
    } finally {
      setResendLoading(false);
    }
  };

  // Go back to login form and clear wall
  const handleBackToLogin = () => {
    setShowVerificationWall(false);
    setResendSuccess(false);
    setFormData({ email: tempCredsRef.current.email, password: '' });
    tempCredsRef.current = { email: '', password: '' };
  };

  // ── VERIFICATION WALL SCREEN ─────────────────────────────────────────────
  if (showVerificationWall) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
        <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 3, px: 3 }}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton onClick={handleBackToLogin} sx={{ mr: 2, color: '#1e293b' }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Verify Your Email
            </Typography>
          </Box>

          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MarkEmailRead sx={{ fontSize: 52, color: '#7c3aed' }} />
            </Box>
          </Box>

          {/* Message */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', textAlign: 'center', mb: 1 }}>
            Check your inbox
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mb: 0.5 }}>
            A verification link was sent to:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, color: '#7c3aed', textAlign: 'center', mb: 1, wordBreak: 'break-all' }}>
            {tempCredsRef.current.email}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mb: 3, lineHeight: 1.6 }}>
            You must click the verification link in that email before you can log in.{' '}
            <strong>Check your spam/junk folder</strong> if you don't see it.
          </Typography>

          {/* Resend success */}
          {resendSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Verification email resent! Check your inbox (and spam folder).
            </Alert>
          )}

          {/* Resend button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleResend}
            disabled={resendLoading}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              py: 1.75,
              mb: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: '#6d28d9' },
              '&:disabled': { bgcolor: '#cbd5e1' },
              minHeight: 48,
            }}
          >
            {resendLoading ? <CircularProgress size={24} color="inherit" /> : '📧 Resend Verification Email'}
          </Button>

          {/* Already verified? Try logging in */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleBackToLogin}
            sx={{
              color: '#7c3aed',
              borderColor: '#7c3aed',
              py: 1.75,
              mb: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(124,58,237,0.05)', borderColor: '#6d28d9' },
              minHeight: 48,
            }}
          >
            ✅ I've verified — Back to Login
          </Button>

          {/* Use different email */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Wrong email?{' '}
              <Typography
                component="span"
                sx={{ color: '#7c3aed', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => navigate('/signup')}
              >
                Sign up with a different email
              </Typography>
            </Typography>
          </Box>

        </Container>
      </Box>
    );
  }

  // ── NORMAL LOGIN FORM ────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 3, px: 3 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2, color: '#1e293b' }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Login
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TextField
            fullWidth label="Email" name="email" type="email"
            value={formData.email} onChange={handleChange}
            required disabled={loading}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            fullWidth label="Password" name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password} onChange={handleChange}
            required disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <Typography
            variant="body2" onClick={handleForgotPassword}
            sx={{ color: '#7c3aed', cursor: 'pointer', textAlign: 'right', mb: 2, '&:hover': { textDecoration: 'underline' } }}
          >
            Forgot password?
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            sx={{
              bgcolor: '#7c3aed', color: 'white', py: 1.75, mb: 2,
              fontSize: '1rem', fontWeight: 600, textTransform: 'none', borderRadius: 2,
              '&:hover': { bgcolor: '#6d28d9' },
              '&:disabled': { bgcolor: '#cbd5e1' },
              minHeight: 48,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Don't have an account?{' '}
              <Typography
                component="span"
                sx={{ color: '#7c3aed', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => navigate('/signup')}
              >
                Create Account
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
