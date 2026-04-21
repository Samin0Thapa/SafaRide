import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Settings,
  Star,
  Shield,
  ContactEmergency,
  ChevronRight,
  Home as HomeIcon,
  DirectionsBike,
  Message,
  Person,
  CalendarToday,
  LocationOn,
  Logout,
  EmojiEvents,
} from '@mui/icons-material';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [totalRides, setTotalRides] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchRecentRides();
      fetchTotalRides();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        setUserData({
          displayName: user.displayName || 'User',
          email: user.email,
          verified: false,
          rating: null,
          totalReviews: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRides = async () => {
    try {
      const allRidesSnap = await getDocs(collection(db, 'rides'));
      let count = 0;
      allRidesSnap.forEach((d) => {
        const ride = d.data();
        const isCreator = ride.createdBy === user.uid;
        const isParticipant = Array.isArray(ride.participants) &&
          ride.participants.some(p =>
            (typeof p === 'object' && p.userId === user.uid) || p === user.uid
          );
        if (isCreator || isParticipant) count++;
      });
      setTotalRides(count);
    } catch (error) {
      console.error('Error counting rides:', error);
    }
  };

  const fetchRecentRides = async () => {
    try {
      const allRidesSnap = await getDocs(collection(db, 'rides'));
      const userRides = [];
      allRidesSnap.forEach((d) => {
        const ride = { id: d.id, ...d.data() };
        const isCreator = ride.createdBy === user.uid;
        const isParticipant = Array.isArray(ride.participants) &&
          ride.participants.some(p =>
            (typeof p === 'object' && p.userId === user.uid) || p === user.uid
          );
        if (isCreator || isParticipant) userRides.push(ride);
      });
      userRides.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentRides(userRides.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recent rides:', error);
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>

      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3, pt: 3, pb: 8,
          color: 'white',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ color: 'white' }}>
            <ChevronRight sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Settings icon now navigates to /settings */}
            <IconButton onClick={() => navigate('/settings')} sx={{ color: 'white' }}>
              <Settings />
            </IconButton>
            <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
              <Logout />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: 100, height: 100,
              border: '4px solid white',
              bgcolor: '#fff',
              color: '#7c3aed',
              fontSize: '2.5rem',
              fontWeight: 700,
            }}
          >
            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
          {userData?.name || userData?.displayName || user?.displayName || 'User'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <Star sx={{ fontSize: 18, color: '#fbbf24' }} />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {userData?.rating ? userData.rating.toFixed(1) : 'No rating yet'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            • {totalRides} rides
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            icon={<Shield sx={{ fontSize: 16, color: 'white' }} />}
            label={userData?.verified ? 'Verified Rider' : 'Not Verified'}
            sx={{
              bgcolor: userData?.verified ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              color: 'white',
              fontWeight: 600,
              border: userData?.verified ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)',
            }}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: -5, px: 2, pb: 10, flex: 1, position: 'relative', zIndex: 10 }}>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          {[
            { value: totalRides, label: 'Rides' },
            { value: userData?.rating ? userData.rating.toFixed(1) : '—', label: 'Rating' },
            { value: userData?.totalReviews || 0, label: 'Reviews' },
            { value: userData?.role === 'organizer' || userData?.role === 'admin' ? '✓' : '—', label: 'Organizer' },
          ].map((stat) => (
            <Box key={stat.label} sx={{ flex: 1, bgcolor: 'white', borderRadius: 3, p: 2, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Trust & Verification Card */}
        <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } }} onClick={() => navigate('/become-organizer')}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield sx={{ fontSize: 24, color: '#7c3aed' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>Trust & Verification</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>View trust score and request organizer role</Typography>
            </Box>
            <ChevronRight sx={{ color: '#cbd5e1' }} />
          </CardContent>
        </Card>

        {/* Emergency Contacts Card */}
        <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } }} onClick={() => navigate('/emergency-contacts')}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ContactEmergency sx={{ fontSize: 24, color: '#ef4444' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>Emergency Contacts</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Manage your emergency contact list</Typography>
            </Box>
            <ChevronRight sx={{ color: '#cbd5e1' }} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {['recent', 'badges'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'contained' : 'outlined'}
              onClick={() => setActiveTab(tab)}
              sx={{
                flex: 1,
                bgcolor: activeTab === tab ? '#7c3aed' : 'transparent',
                color: activeTab === tab ? 'white' : '#7c3aed',
                borderColor: '#7c3aed',
                py: 1.5, borderRadius: 5,
                textTransform: 'none', fontWeight: 600,
                '&:hover': { bgcolor: activeTab === tab ? '#6d28d9' : 'rgba(124,58,237,0.05)', borderColor: '#7c3aed' },
              }}
            >
              {tab === 'recent' ? 'Recent Rides' : 'Badges'}
            </Button>
          ))}
        </Box>

        {/* Recent Rides */}
        {activeTab === 'recent' && (
          <Box sx={{ mb: 8 }}>
            {recentRides.length > 0 ? recentRides.map((ride) => (
              <Card key={ride.id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' } }} onClick={() => navigate(`/ride-details/${ride.id}`)}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>{ride.title}</Typography>
                    <Chip
                      label={ride.status || 'upcoming'} size="small"
                      sx={{
                        bgcolor: ride.status === 'completed' ? '#dcfce7' : ride.status === 'ongoing' ? '#fef3c7' : '#f3e8ff',
                        color: ride.status === 'completed' ? '#059669' : ride.status === 'ongoing' ? '#d97706' : '#7c3aed',
                        fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(ride.date)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{ride.meetingPoint} → {ride.destination}</Typography>
                  </Box>
                </CardContent>
              </Card>
            )) : (
              <Box sx={{ textAlign: 'center', py: 4, mb: 10 }}>
                <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>No recent rides yet</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Badges */}
        {activeTab === 'badges' && (
          <Box sx={{ mb: 8 }}>
            {totalRides >= 1 && (
              <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmojiEvents sx={{ fontSize: 28, color: '#f59e0b' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>First Ride</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Completed your first ride</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            {totalRides >= 5 && (
              <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmojiEvents sx={{ fontSize: 28, color: '#7c3aed' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>Regular Rider</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Completed 5 rides</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            {userData?.verified && (
              <Card sx={{ mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield sx={{ fontSize: 28, color: '#10b981' }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>Verified Organizer</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Approved as a trusted organizer</Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            {totalRides < 1 && !userData?.verified && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EmojiEvents sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>No badges earned yet.</Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Complete rides to earn your first badge!</Typography>
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Bottom Navigation */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, bgcolor: 'white', borderTop: '1px solid #e5e7eb', py: 1.5, zIndex: 1000 }}>
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <IconButton sx={{ color: '#94a3b8' }}><HomeIcon /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Home</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/join-ride')}>
              <IconButton sx={{ color: '#94a3b8' }}><DirectionsBike /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Rides</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/chat')}>
              <IconButton sx={{ color: '#94a3b8' }}><Message /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>Chat</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#7c3aed' }}><Person /></IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>Profile</Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}