import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  sendPasswordResetEmail,
  deleteUser,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Switch,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Lock,
  Notifications,
  DeleteForever,
  Logout,
  Edit,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';

export default function Settings() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit name
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password reset
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordEmailSent, setPasswordEmailSent] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification toggles
  const [notifSettings, setNotifSettings] = useState({
    rideUpdates: true,
    sosAlerts: true,
    verificationUpdates: true,
    newReviews: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Logout
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setNewName(data.name || user.displayName || '');
        // Load saved notification settings if they exist
        if (data.notificationSettings) {
          setNotifSettings(data.notificationSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── EDIT NAME ──
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setNameLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: newName.trim(),
      });
      setNameSuccess(true);
      setShowEditNameDialog(false);
      setTimeout(() => setNameSuccess(false), 3000);
      fetchUserData();
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setNameLoading(false);
    }
  };

  // ── PASSWORD RESET ──
  const handleSendPasswordReset = async () => {
    setPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordEmailSent(true);
    } catch (error) {
      console.error('Error sending password reset:', error);
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── NOTIFICATION TOGGLES ──
  const handleNotifToggle = (key) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: notifSettings,
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setNotifSaving(false);
    }
  };

  // ── DELETE ACCOUNT ──
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      // Delete Firestore user doc
      await updateDoc(doc(db, 'users', user.uid), { deleted: true });
      // Delete Firebase Auth account
      await deleteUser(user);
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── LOGOUT ──
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  const SectionTitle = ({ children }) => (
    <Typography variant="body2" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, mb: 1, px: 1, fontSize: '0.75rem' }}>
      {children}
    </Typography>
  );

  const SettingsRow = ({ icon, label, subtitle, onClick, rightElement, color = '#7c3aed', bgColor = '#f3e8ff' }) => (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 2,
        px: 2.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
        '&:hover': onClick ? { bgcolor: '#f8f5ff' } : {},
      }}
    >
      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{label}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: '#94a3b8' }}>{subtitle}</Typography>}
      </Box>
      {rightElement}
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 4 }}>

      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', borderRadius: '0 0 30px 30px', px: 3, pt: 3, pb: 5, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/profile')} sx={{ color: 'white', p: 0 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Settings</Typography>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -3, px: 2, position: 'relative', zIndex: 10 }}>

        {/* Profile summary */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: '#7c3aed', fontSize: '1.5rem', fontWeight: 700 }}>
              {(userData?.name || user?.displayName)?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {userData?.name || user?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                {user?.email}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Name saved success */}
        {nameSuccess && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }} icon={<CheckCircle />}>
            Display name updated successfully!
          </Alert>
        )}

        {/* Notification saved success */}
        {notifSaved && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }} icon={<CheckCircle />}>
            Notification settings saved!
          </Alert>
        )}

        {/* ── ACCOUNT SECTION ── */}
        <SectionTitle>Account</SectionTitle>
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3, overflow: 'hidden' }}>
          <SettingsRow
            icon={<Edit />}
            label="Edit Display Name"
            subtitle={userData?.name || user?.displayName || 'Tap to set your name'}
            onClick={() => setShowEditNameDialog(true)}
            rightElement={<ArrowBack sx={{ transform: 'rotate(180deg)', color: '#cbd5e1', fontSize: 20 }} />}
          />
          <Divider sx={{ mx: 2 }} />
          <SettingsRow
            icon={<Lock />}
            label="Change Password"
            subtitle="Send a password reset email"
            onClick={() => setShowPasswordDialog(true)}
            rightElement={<ArrowBack sx={{ transform: 'rotate(180deg)', color: '#cbd5e1', fontSize: 20 }} />}
          />
        </Card>

        {/* ── NOTIFICATIONS SECTION ── */}
        <SectionTitle>Notifications</SectionTitle>
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 2, overflow: 'hidden' }}>
          <SettingsRow
            icon={<Notifications />}
            label="Ride Updates"
            subtitle="When riders join or leave your ride"
            rightElement={
              <Switch
                checked={notifSettings.rideUpdates}
                onChange={() => handleNotifToggle('rideUpdates')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7c3aed' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7c3aed' } }}
              />
            }
          />
          <Divider sx={{ mx: 2 }} />
          <SettingsRow
            icon={<Warning />}
            label="SOS Alerts"
            subtitle="Emergency alerts from ride participants"
            color="#ef4444"
            bgColor="#fee2e2"
            rightElement={
              <Switch
                checked={notifSettings.sosAlerts}
                onChange={() => handleNotifToggle('sosAlerts')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ef4444' } }}
              />
            }
          />
          <Divider sx={{ mx: 2 }} />
          <SettingsRow
            icon={<CheckCircle />}
            label="Verification Updates"
            subtitle="Organizer verification status changes"
            color="#10b981"
            bgColor="#d1fae5"
            rightElement={
              <Switch
                checked={notifSettings.verificationUpdates}
                onChange={() => handleNotifToggle('verificationUpdates')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' } }}
              />
            }
          />
          <Divider sx={{ mx: 2 }} />
          <SettingsRow
            icon={<Info />}
            label="New Reviews"
            subtitle="When someone rates your ride"
            color="#f59e0b"
            bgColor="#fef3c7"
            rightElement={
              <Switch
                checked={notifSettings.newReviews}
                onChange={() => handleNotifToggle('newReviews')}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#f59e0b' } }}
              />
            }
          />
        </Card>

        <Button
          fullWidth variant="outlined"
          onClick={handleSaveNotifSettings}
          disabled={notifSaving}
          sx={{ borderColor: '#7c3aed', color: '#7c3aed', textTransform: 'none', fontWeight: 600, borderRadius: 3, py: 1.5, mb: 3, '&:hover': { bgcolor: '#f3e8ff', borderColor: '#6d28d9' } }}
        >
          {notifSaving ? <CircularProgress size={22} color="inherit" /> : 'Save Notification Settings'}
        </Button>

        {/* ── ABOUT SECTION ── */}
        <SectionTitle>About</SectionTitle>
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>App Name</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>SafaRide</Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Version</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>1.0.0</Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Developer</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>Samin Thapa</Typography>
          </Box>
          <Divider sx={{ mx: 2 }} />
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Built with</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>React + Firebase</Typography>
          </Box>
        </Card>

        {/* ── DANGER ZONE ── */}
        <SectionTitle>Account Actions</SectionTitle>
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 2, overflow: 'hidden' }}>
          <SettingsRow
            icon={<Logout />}
            label="Log Out"
            subtitle="Sign out of your account"
            color="#64748b"
            bgColor="#f1f5f9"
            onClick={() => setShowLogoutDialog(true)}
            rightElement={<ArrowBack sx={{ transform: 'rotate(180deg)', color: '#cbd5e1', fontSize: 20 }} />}
          />
          <Divider sx={{ mx: 2 }} />
          <SettingsRow
            icon={<DeleteForever />}
            label="Delete Account"
            subtitle="Permanently delete your account and data"
            color="#ef4444"
            bgColor="#fee2e2"
            onClick={() => setShowDeleteDialog(true)}
            rightElement={<ArrowBack sx={{ transform: 'rotate(180deg)', color: '#fca5a5', fontSize: 20 }} />}
          />
        </Card>
      </Container>

      {/* ── EDIT NAME DIALOG ── */}
      <Dialog open={showEditNameDialog} onClose={() => setShowEditNameDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Edit Display Name</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth autoFocus
            label="Display Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setShowEditNameDialog(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveName} disabled={nameLoading || !newName.trim()}
            sx={{ bgcolor: '#7c3aed', textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>
            {nameLoading ? <CircularProgress size={22} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── PASSWORD RESET DIALOG ── */}
      <Dialog open={showPasswordDialog} onClose={() => { setShowPasswordDialog(false); setPasswordEmailSent(false); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Change Password</Typography>
        </DialogTitle>
        <DialogContent>
          {passwordEmailSent ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>Email Sent!</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                A password reset link has been sent to <strong>{user?.email}</strong>. Check your inbox.
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
              We'll send a password reset link to <strong>{user?.email}</strong>. Click the link to set a new password.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setShowPasswordDialog(false); setPasswordEmailSent(false); }} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            {passwordEmailSent ? 'Close' : 'Cancel'}
          </Button>
          {!passwordEmailSent && (
            <Button variant="contained" onClick={handleSendPasswordReset} disabled={passwordLoading}
              sx={{ bgcolor: '#7c3aed', textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>
              {passwordLoading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Email'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── LOGOUT DIALOG ── */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <Logout sx={{ fontSize: 36, color: '#64748b' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Log Out?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>You'll need to log in again to access SafaRide.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => setShowLogoutDialog(false)} sx={{ flex: 1, color: '#64748b', textTransform: 'none', fontWeight: 600, py: 1.5, borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleLogout}
            sx={{ flex: 1, bgcolor: '#64748b', color: 'white', textTransform: 'none', fontWeight: 600, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#475569' } }}>
            Log Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── DELETE ACCOUNT DIALOG ── */}
      <Dialog open={showDeleteDialog} onClose={() => { setShowDeleteDialog(false); setDeletePassword(''); setDeleteError(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <DeleteForever sx={{ fontSize: 36, color: '#ef4444' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ef4444' }}>Delete Account</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2, textAlign: 'center' }}>
            This action is <strong>permanent</strong> and cannot be undone. All your data will be deleted. Enter your password to confirm.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{deleteError}</Alert>
          )}
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={() => { setShowDeleteDialog(false); setDeletePassword(''); setDeleteError(''); }}
            sx={{ flex: 1, color: '#64748b', textTransform: 'none', fontWeight: 600, py: 1.5, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeleteAccount} disabled={deleteLoading || !deletePassword}
            sx={{ flex: 1, bgcolor: '#ef4444', color: 'white', textTransform: 'none', fontWeight: 600, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#dc2626' }, '&:disabled': { bgcolor: '#fca5a5' } }}>
            {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}