import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack,
  DirectionsBike,
  Person,
  Message,
  ChevronRight,
  Home as HomeIcon,
} from '@mui/icons-material';

export default function ChatList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [allRides, setAllRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Ongoing, 1: Upcoming, 2: Previous

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserRides(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Filter rides when tab changes
    filterRides();
  }, [activeTab, allRides]);

  const fetchUserRides = async (userId) => {
    try {
      setLoading(true);
      
      // Query all rides where user is participant or creator
      const ridesQuery = query(collection(db, 'rides'));
      const snapshot = await getDocs(ridesQuery);
      
      const userRides = [];
      
      snapshot.forEach((doc) => {
        const rideData = { id: doc.id, ...doc.data() };
        
        // Check if user is participant or creator
        const isCreator = rideData.createdBy === userId;
        const isParticipant = Array.isArray(rideData.participants) && 
                             rideData.participants.some(p => 
                               (typeof p === 'object' && p.userId === userId) || 
                               p === userId
                             );
        
        if (isCreator || isParticipant) {
          userRides.push(rideData);
        }
      });
      
      // Sort by date (newest first)
      userRides.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAllRides(userRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRides = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [];

    if (activeTab === 0) {
      // Ongoing rides
      filtered = allRides.filter(ride => ride.status === 'ongoing');
    } else if (activeTab === 1) {
      // Upcoming rides (future dates, not ongoing)
      filtered = allRides.filter(ride => {
        const rideDate = new Date(ride.date);
        return rideDate >= today && ride.status !== 'ongoing';
      });
    } else if (activeTab === 2) {
      // Previous rides (past dates or completed)
      filtered = allRides.filter(ride => {
        const rideDate = new Date(ride.date);
        return rideDate < today || ride.status === 'completed';
      });
    }

    setFilteredRides(filtered);
  };

  const getParticipantCount = (participants) => {
    if (!participants) return 0;
    return Array.isArray(participants) ? participants.length : 0;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        pb: 10,
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 3,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'white' }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Group Chats
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, ml: 6 }}>
          {allRides.length} {allRides.length === 1 ? 'conversation' : 'conversations'}
        </Typography>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ bgcolor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
        <Container maxWidth="sm">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#64748b',
              },
              '& .Mui-selected': {
                color: '#7c3aed',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#7c3aed',
                height: 3,
              },
            }}
          >
            <Tab 
              label={`Ongoing (${allRides.filter(r => r.status === 'ongoing').length})`} 
            />
            <Tab 
              label={`Upcoming (${allRides.filter(r => {
                const rideDate = new Date(r.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return rideDate >= today && r.status !== 'ongoing';
              }).length})`}
            />
            <Tab 
              label={`Previous (${allRides.filter(r => {
                const rideDate = new Date(r.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return rideDate < today || r.status === 'completed';
              }).length})`}
            />
          </Tabs>
        </Container>
      </Box>

      {/* Chat List */}
      <Container maxWidth="sm" sx={{ mt: 2, px: 2, pb: 3 }}>
        {filteredRides.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Message sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
              {activeTab === 0 && 'No Ongoing Rides'}
              {activeTab === 1 && 'No Upcoming Rides'}
              {activeTab === 2 && 'No Previous Rides'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {activeTab === 0 && 'No active rides at the moment'}
              {activeTab === 1 && 'Join a ride to start chatting!'}
              {activeTab === 2 && 'You haven\'t completed any rides yet'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredRides.map((ride) => (
              <Card
                key={ride.id}
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => navigate(`/chat/${ride.id}`)}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Ride Icon */}
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: activeTab === 0 ? '#dcfce7' : (activeTab === 1 ? '#f3e8ff' : '#f1f5f9'),
                        color: activeTab === 0 ? '#059669' : (activeTab === 1 ? '#7c3aed' : '#64748b'),
                      }}
                    >
                      <DirectionsBike sx={{ fontSize: 28 }} />
                    </Avatar>

                    {/* Ride Info */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {ride.title}
                        </Typography>
                        {ride.status === 'ongoing' && (
                          <Chip
                            label="LIVE"
                            size="small"
                            sx={{
                              height: 20,
                              bgcolor: '#10b981',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.7 },
                              },
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', mb: 0.5 }}>
                        Organizer: {ride.createdByName || 'Unknown'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person sx={{ fontSize: 14, color: '#7c3aed' }} />
                        <Typography variant="body2" sx={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600 }}>
                          {getParticipantCount(ride.participants)} participants
                        </Typography>
                      </Box>
                    </Box>

                    {/* Arrow & Badge */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <ChevronRight sx={{ color: '#cbd5e1', fontSize: 28 }} />
                      {/* Optional: Unread badge */}
                      {/* <Badge badgeContent={3} color="error" /> */}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
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
              <IconButton sx={{ color: '#7c3aed' }}>
                <Message />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>
                Chat
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Person />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Profile
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}