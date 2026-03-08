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
} from '@mui/material';
import {
  ArrowBack,
  DirectionsBike,
  Person,
  Message,
  ChevronRight,
} from '@mui/icons-material';

export default function ChatList() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserRides(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

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
      
      setRides(userRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantCount = (participants) => {
    if (!participants) return 0;
    return Array.isArray(participants) ? participants.length : 0;
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
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 4,
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
          {rides.length} {rides.length === 1 ? 'conversation' : 'conversations'}
        </Typography>
      </Box>

      {/* Chat List */}
      <Container maxWidth="sm" sx={{ mt: -2, px: 2, pb: 3 }}>
        {rides.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Message sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#64748b', mb: 1 }}>
              No Chats Yet
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Join a ride to start chatting with fellow riders!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rides.map((ride) => (
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
                        bgcolor: '#f3e8ff',
                        color: '#7c3aed',
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
    </Box>
  );
}