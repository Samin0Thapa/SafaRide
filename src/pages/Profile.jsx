import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
} from '@mui/icons-material';

export default function Profile() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchRecentRides();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        // Create default user data if doesn't exist
        setUserData({
          displayName: user.displayName || 'User',
          email: user.email,
          verified: false,
          totalRides: 0,
          totalKm: 0,
          totalHours: 0,
          groups: 0,
          rating: 5.0,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRides = async () => {
    try {
      const ridesQuery = query(
        collection(db, 'rides'),
        where('participants', 'array-contains', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const snapshot = await getDocs(ridesQuery);
      const rides = [];
      snapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() });
      });
      setRecentRides(rides);
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Purple Header with Profile Info */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 8,
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Settings & Logout Icons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'white' }}
          >
            <ChevronRight sx={{ transform: 'rotate(180deg)' }} />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton sx={{ color: 'white' }}>
              <Settings />
            </IconButton>
            <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
              <Logout />
            </IconButton>
          </Box>
        </Box>

        {/* Profile Photo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
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

        {/* User Name */}
        <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 0.5 }}>
          {userData?.displayName || user?.displayName || 'User'}
        </Typography>

        {/* Rating */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <Star sx={{ fontSize: 18, color: '#fbbf24' }} />
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {userData?.rating || 5.0}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            • {userData?.totalRides || 0} rides
          </Typography>
        </Box>

        {/* Verified Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            icon={<Shield sx={{ fontSize: 16, color: 'white' }} />}
            label={userData?.verified ? "Verified Rider" : "Not Verified"}
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
        {/* Stats Cards - Elevated in front of purple */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {userData?.totalRides || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Rides
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {userData?.totalKm || '0'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              KM
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {userData?.totalHours || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Hours
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: 'white',
              borderRadius: 3,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {userData?.groups || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Groups
            </Typography>
          </Box>
        </Box>

        {/* Trust & Verification Card */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
          }}
          onClick={() => navigate('/become-organizer')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield sx={{ fontSize: 24, color: '#7c3aed' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Trust & Verification
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                View trust score and request organizer role
              </Typography>
            </Box>
            <ChevronRight sx={{ color: '#cbd5e1' }} />
          </CardContent>
        </Card>

        {/* Emergency Contacts Card */}
        <Card
          sx={{
            mb: 2,
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
          }}
          onClick={() => alert('Emergency Contacts - Coming Soon!')}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ContactEmergency sx={{ fontSize: 24, color: '#ef4444' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Emergency Contacts
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Manage your emergency contact list
              </Typography>
            </Box>
            <ChevronRight sx={{ color: '#cbd5e1' }} />
          </CardContent>
        </Card>

        {/* Tab Selection */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={activeTab === 'recent' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('recent')}
            sx={{
              flex: 1,
              bgcolor: activeTab === 'recent' ? '#7c3aed' : 'transparent',
              color: activeTab === 'recent' ? 'white' : '#7c3aed',
              borderColor: '#7c3aed',
              py: 1.5,
              borderRadius: 5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: activeTab === 'recent' ? '#6d28d9' : 'rgba(124,58,237,0.05)',
                borderColor: '#7c3aed',
              },
            }}
          >
            Recent Rides
          </Button>
          <Button
            variant={activeTab === 'badges' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('badges')}
            sx={{
              flex: 1,
              bgcolor: activeTab === 'badges' ? '#7c3aed' : 'transparent',
              color: activeTab === 'badges' ? 'white' : '#7c3aed',
              borderColor: '#7c3aed',
              py: 1.5,
              borderRadius: 5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: activeTab === 'badges' ? '#6d28d9' : 'rgba(124,58,237,0.05)',
                borderColor: '#7c3aed',
              },
            }}
          >
            Badges
          </Button>
        </Box>

        {/* Recent Rides Content */}
        {activeTab === 'recent' && (
          <Box sx={{ mb: 8 }}>
            {recentRides.length > 0 ? (
              recentRides.map((ride) => (
                <Card
                  key={ride.id}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
                  }}
                  onClick={() => navigate(`/ride-details/${ride.id}`)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {ride.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} sx={{ fontSize: 16, color: '#fbbf24' }} />
                        ))}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {formatDate(ride.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {ride.createdByName}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, mb: 10 }}>
                <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No recent rides yet
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Badges Content */}
        {activeTab === 'badges' && (
          <Box sx={{ textAlign: 'center', py: 4, mb: 10 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No badges earned yet
            </Typography>
          </Box>
        )}
      </Container>

      {/* Bottom Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'white',
          borderTop: '1px solid #e5e7eb',
          py: 1.5,
          zIndex: 1000,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box 
              sx={{ textAlign: 'center', cursor: 'pointer' }} 
              onClick={() => navigate('/dashboard')}
            >
              <IconButton sx={{ color: '#94a3b8' }}>
                <HomeIcon />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Home
              </Typography>
            </Box>
            <Box 
              sx={{ textAlign: 'center', cursor: 'pointer' }} 
              onClick={() => navigate('/join-ride')}
            >
              <IconButton sx={{ color: '#94a3b8' }}>
                <DirectionsBike />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Rides
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Message />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Chat
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#7c3aed' }}>
                <Person />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>
                Profile
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}