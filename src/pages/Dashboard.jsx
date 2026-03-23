import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add,
  PersonAdd,
  ContactEmergency,
  Chat,
  DirectionsBike,
  Home as HomeIcon,
  Message,
  Person,
  Notifications,
  ArrowForward,
  Logout,
  VerifiedUser,
  CalendarToday,
  Schedule,
  Warning,
  Close,
  NotificationsNone,
  DirectionsBike as RideIcon,
  Shield,
  Star,
  DoneAll,
} from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [ongoingRides, setOngoingRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Real stats
  const [totalRides, setTotalRides] = useState(0);
  const [userRating, setUserRating] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoadingRides(false);
      return;
    }
    fetchOngoingRides();
    fetchUserStats();
    subscribeToNotifications();
  }, [user]);

  // Real-time notifications listener
  const subscribeToNotifications = () => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((d) => {
        notifs.push({ id: d.id, ...d.data() });
      });

      // Sort by date newest first
      notifs.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });

    return unsubscribe;
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications
        .filter(n => !n.read)
        .forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotificationsDialog(true);
    // Mark all as read when opened
    if (unreadCount > 0) markAllAsRead();
  };

  const fetchOngoingRides = async () => {
    try {
      setLoadingRides(true);
      const ridesQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'ongoing')
      );
      const querySnapshot = await getDocs(ridesQuery);
      const ridesData = [];
      querySnapshot.forEach((doc) => {
        ridesData.push({ id: doc.id, ...doc.data() });
      });
      setOngoingRides(ridesData);
    } catch (error) {
      console.error('Error fetching ongoing rides:', error);
    } finally {
      setLoadingRides(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const allRidesSnap = await getDocs(collection(db, 'rides'));
      let rideCount = 0;
      allRidesSnap.forEach((d) => {
        const ride = d.data();
        const isCreator = ride.createdBy === user.uid;
        const isParticipant = Array.isArray(ride.participants) &&
          ride.participants.some(p =>
            (typeof p === 'object' && p.userId === user.uid) || p === user.uid
          );
        if (isCreator || isParticipant) rideCount++;
      });
      setTotalRides(rideCount);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role);
        setUserRating(data.rating || null);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateRideClick = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;
      if (role === 'rider') {
        setShowVerificationDialog(true);
      } else if (role === 'organizer' || role === 'admin') {
        navigate('/create-ride');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const formatNotifTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diff = now - date;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (e) {
      return '';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'ride_joined': return '👤';
      case 'ride_left': return '👋';
      case 'ride_started': return '🏍️';
      case 'ride_completed': return '✅';
      case 'ride_cancelled': return '❌';
      case 'sos_alert': return '🚨';
      case 'sos_resolved': return '✅';
      case 'verification_approved': return '✅';
      case 'verification_rejected': return '❌';
      case 'new_review': return '⭐';
      default: return '🔔';
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'sos_alert': return '#fef2f2';
      case 'ride_started': return '#f0fdf4';
      case 'ride_completed': return '#f0fdf4';
      case 'verification_approved': return '#f0fdf4';
      case 'ride_cancelled':
      case 'verification_rejected': return '#fef2f2';
      case 'new_review': return '#fefce8';
      default: return '#f3e8ff';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          overflow: 'auto',
        }}
      >
        {/* Purple Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            borderRadius: '0 0 30px 30px',
            px: 3,
            pt: `calc(env(safe-area-inset-top) + 8px)`,
            pb: 3,
            color: 'white',
          }}
        >
          {/* Profile + Notification Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  border: '3px solid rgba(255,255,255,0.3)',
                  bgcolor: '#fff',
                  color: '#7c3aed',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                }}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Welcome back,
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {user?.displayName || 'Rider'}
                </Typography>
                {(userRole === 'organizer' || userRole === 'admin') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <VerifiedUser sx={{ fontSize: 16, color: '#22c55e' }} />
                    <Typography variant="caption" sx={{ color: '#dcfce7', fontWeight: 600 }}>
                      {userRole === 'admin' ? 'Admin' : 'Verified Organizer'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              {/* Notification Bell — now works */}
              <IconButton
                onClick={handleOpenNotifications}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              <IconButton
                onClick={handleLogout}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          </Box>

          {/* Stats Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 2 }}>
            <Box sx={{ textAlign: 'center', bgcolor: 'rgba(167, 139, 250, 0.3)', borderRadius: 3, py: 2, px: 3, flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{totalRides}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Rides</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', bgcolor: 'rgba(167, 139, 250, 0.3)', borderRadius: 3, py: 2, px: 3, flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{userRating !== null ? userRating : '—'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Rating</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', bgcolor: 'rgba(167, 139, 250, 0.3)', borderRadius: 3, py: 2, px: 3, flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>0</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Badges</Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 2, flex: 1 }}>

          {/* Create & Join Ride Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Card sx={{ flex: 1, borderRadius: 4, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={handleCreateRideClick}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
                  <Add sx={{ fontSize: 30, color: '#7c3aed' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Create Ride</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Organize a new ride</Typography>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, borderRadius: 4, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }} onClick={() => navigate('/join-ride')}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
                  <PersonAdd sx={{ fontSize: 30, color: '#7c3aed' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Join Ride</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Find rides nearby</Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Emergency SOS Card */}
          <Card sx={{ borderRadius: 4, mb: 2, bgcolor: '#ef4444', color: 'white', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }} onClick={() => navigate('/emergency-contacts')}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ContactEmergency sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Emergency SOS</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>Set up emergency contacts</Typography>
                  </Box>
                </Box>
                <ArrowForward sx={{ fontSize: 28 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Group Chat Card */}
          <Card sx={{ borderRadius: 4, mb: 2, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }} onClick={() => navigate('/chat')}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Chat sx={{ fontSize: 26, color: '#7c3aed' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Group Chat</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Connect with riders</Typography>
                  </Box>
                </Box>
                <Badge badgeContent={3} color="error">
                  <Box sx={{ width: 24, height: 24 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>

          {/* Ongoing Rides Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Ongoing Rides</Typography>
              {ongoingRides.length > 0 && (
                <Chip label={`${ongoingRides.length} Active`} size="small" sx={{ bgcolor: '#dcfce7', color: '#059669', fontWeight: 600 }} />
              )}
            </Box>

            {loadingRides && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#7c3aed' }} />
              </Box>
            )}

            {!loadingRides && ongoingRides.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5 }}>No ongoing rides</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Join a ride to see it here!</Typography>
              </Box>
            )}

            {!loadingRides && ongoingRides.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ongoingRides.map((ride) => (
                  <Card key={ride.id} sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #10b981' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{ride.title}</Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{ride.meetingPoint} → {ride.destination}</Typography>
                        </Box>
                        <Chip label="LIVE" size="small" sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.7rem', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } } }} />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{ride.date}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{formatTime(ride.time)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{ride.participants?.length || 0} riders</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button fullWidth variant="outlined" onClick={() => navigate(`/ride-details/${ride.id}`)}
                          sx={{ color: '#7c3aed', borderColor: '#7c3aed', py: 1.2, fontSize: '0.9rem', fontWeight: 600, textTransform: 'none', borderRadius: 3, borderWidth: 2, '&:hover': { borderColor: '#6d28d9', bgcolor: 'transparent', borderWidth: 2 } }}>
                          View Details
                        </Button>

                        {(() => {
                          const isCreator = ride.createdBy === user?.uid;
                          const isParticipant = Array.isArray(ride.participants) &&
                            ride.participants.some(p => (typeof p === 'object' && p.userId === user?.uid) || p === user?.uid);
                          const canUseSOS = isCreator || isParticipant;

                          return canUseSOS ? (
                            <Button variant="contained" startIcon={<Warning />} onClick={() => navigate(`/emergency-sos/${ride.id}`)}
                              sx={{ bgcolor: '#ef4444', color: 'white', py: 1.2, px: 2.5, fontSize: '0.9rem', fontWeight: 700, textTransform: 'none', borderRadius: 3, boxShadow: '0 4px 12px rgba(239,68,68,0.3)', '&:hover': { bgcolor: '#dc2626' } }}>
                              SOS
                            </Button>
                          ) : (
                            <Button variant="contained" disabled startIcon={<Warning />}
                              sx={{ bgcolor: '#cbd5e1', color: '#64748b', py: 1.2, px: 2.5, fontSize: '0.9rem', fontWeight: 700, textTransform: 'none', borderRadius: 3, '&:disabled': { bgcolor: '#cbd5e1', color: '#64748b' } }}>
                              SOS
                            </Button>
                          );
                        })()}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* Bottom Navigation */}
      <Box sx={{ bgcolor: 'white', borderTop: '1px solid #e5e7eb', py: 1.5 }}>
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#7c3aed' }}><HomeIcon /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>Home</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }} onClick={() => navigate('/join-ride')}>
              <IconButton sx={{ color: '#94a3b8' }}><DirectionsBike /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Rides</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/chat')}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Badge badgeContent={2} color="error"><Message /></Badge>
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Chat</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <IconButton sx={{ color: '#94a3b8' }}><Person /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Profile</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── NOTIFICATIONS DIALOG ── */}
      <Dialog
        open={showNotificationsDialog}
        onClose={() => setShowNotificationsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            m: 2,
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} new`}
                  size="small"
                  sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {notifications.some(n => !n.read) && (
                <Button
                  size="small"
                  startIcon={<DoneAll sx={{ fontSize: 16 }} />}
                  onClick={markAllAsRead}
                  sx={{ textTransform: 'none', color: '#7c3aed', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton onClick={() => setShowNotificationsDialog(false)} size="small" sx={{ color: '#64748b' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 0, py: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsNone sx={{ fontSize: 70, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                No notifications yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Activity from your rides will appear here
              </Typography>
            </Box>
          ) : (
            <Box>
              {notifications.map((notif, index) => (
                <Box key={notif.id}>
                  <Box
                    onClick={() => markAsRead(notif.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      px: 3,
                      py: 2,
                      bgcolor: notif.read ? 'white' : '#faf5ff',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: '#f5f3ff' },
                      borderLeft: notif.read ? 'none' : '3px solid #7c3aed',
                    }}
                  >
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: getNotifColor(notif.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '1.3rem',
                      }}
                    >
                      {getNotifIcon(notif.type)}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notif.read ? 500 : 700,
                          color: '#1e293b',
                          mb: 0.25,
                          fontSize: '0.9rem',
                        }}
                      >
                        {notif.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontSize: '0.82rem',
                          mb: 0.5,
                          lineHeight: 1.4,
                        }}
                      >
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {formatNotifTime(notif.createdAt)}
                      </Typography>
                    </Box>

                    {/* Unread dot */}
                    {!notif.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#7c3aed',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      />
                    )}
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Required Dialog */}
      <Dialog
        open={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, px: 2, py: 1, maxWidth: '400px' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <VerifiedUser sx={{ fontSize: 50, color: '#7c3aed' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Organizer Verification Required
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            You need to be a verified organizer to create rides.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Get verified to organize group rides and build your community!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button onClick={() => setShowVerificationDialog(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained"
            onClick={() => { setShowVerificationDialog(false); navigate('/become-organizer'); }}
            sx={{ bgcolor: '#7c3aed', px: 3, py: 1.5, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#6d28d9' } }}>
            Request Organizer Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}