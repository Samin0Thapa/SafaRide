import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  Schedule,
  Person,
  DirectionsBike,
  FilterList,
  CheckCircle,
  ArrowForward,
  Chat,
  Home,
  Badge as BadgeIcon,
} from '@mui/icons-material';

export default function JoinRide() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All Rides');
  const [userRole, setUserRole] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  const rideTypes = [
    'All Rides',
    'Short Ride',
    'Long Ride',
    'Mountain Ride',
    'City Tour',
    'Highway Cruise',
    'Off-Road Adventure',
  ];

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (selectedFilter === 'All Rides') {
      setFilteredRides(rides);
    } else {
      setFilteredRides(rides.filter(ride => ride.rideType === selectedFilter));
    }
  }, [selectedFilter, rides]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both upcoming AND ongoing rides
      const ridesData = [];
      
      // Get upcoming rides
      const upcomingQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'upcoming')
      );
      const upcomingSnapshot = await getDocs(upcomingQuery);
      upcomingSnapshot.forEach((doc) => {
        ridesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Get ongoing rides
      const ongoingQuery = query(
        collection(db, 'rides'),
        where('status', '==', 'ongoing')
      );
      const ongoingSnapshot = await getDocs(ongoingQuery);
      ongoingSnapshot.forEach((doc) => {
        ridesData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setRides(ridesData);
      setFilteredRides(ridesData);
      
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError(`Failed to load rides: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    handleFilterClose();
  };

  const handleViewDetails = (rideId) => {
    navigate(`/ride-details/${rideId}`);
  };

  const getRideTypeColor = (type) => {
    const colors = {
      'Short Ride': '#3b82f6',
      'Long Ride': '#8b5cf6',
      'Mountain Ride': '#059669',
      'City Tour': '#f59e0b',
      'Highway Cruise': '#ef4444',
      'Off-Road Adventure': '#84cc16',
    };
    return colors[type] || '#7c3aed';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          py: 2,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Join a Ride
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleFilterClick}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
          }}
        >
          <Badge badgeContent={selectedFilter === 'All Rides' ? 0 : '1'} color="error">
            <FilterList />
          </Badge>
        </IconButton>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        {rideTypes.map((type) => (
          <MenuItem
            key={type}
            onClick={() => handleFilterSelect(type)}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: selectedFilter === type ? 600 : 400 }}>
              {type}
            </Typography>
            {selectedFilter === type && (
              <CheckCircle sx={{ fontSize: 20, color: '#7c3aed', ml: 2 }} />
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Content */}
      <Container maxWidth="sm" sx={{ py: 3, px: 2, flex: 1, pb: 10 }}>
        {/* Active Filter Display */}
        {selectedFilter !== 'All Rides' && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Filtered by:
            </Typography>
            <Chip
              label={selectedFilter}
              onDelete={() => setSelectedFilter('All Rides')}
              sx={{
                bgcolor: getRideTypeColor(selectedFilter),
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: 'white',
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#7c3aed' }} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" sx={{ color: '#ef4444', mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchRides}
              sx={{
                bgcolor: '#7c3aed',
                '&:hover': { bgcolor: '#6d28d9' },
                textTransform: 'none',
              }}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRides.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <DirectionsBike sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
              {selectedFilter === 'All Rides' 
                ? 'No rides available' 
                : `No ${selectedFilter}s available`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
              {selectedFilter === 'All Rides' 
                ? 'Be the first to create a ride!' 
                : 'Try a different filter or create a ride!'}
            </Typography>
            {(userRole === 'organizer' || userRole === 'admin') && (
              <Button
                variant="contained"
                onClick={() => navigate('/create-ride')}
                sx={{
                  bgcolor: '#7c3aed',
                  '&:hover': { bgcolor: '#6d28d9' },
                  textTransform: 'none',
                  mt: 2,
                }}
              >
                Create a Ride
              </Button>
            )}
          </Box>
        )}

        {/* Rides List */}
        {!loading && !error && filteredRides.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {filteredRides.map((ride) => (
              <Card
                key={ride.id}
                sx={{
                  borderRadius: 4,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(124,58,237,0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Top Section: Icon + Title + Participants */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        minWidth: 56,
                        borderRadius: 3,
                        bgcolor: '#f3e8ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DirectionsBike sx={{ fontSize: 32, color: '#7c3aed' }} />
                    </Box>

                    {/* Title and Route */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#1e293b',
                          fontSize: '1.1rem',
                          mb: 0.5,
                        }}
                      >
                        {ride.title}
                      </Typography>

                      {/* Route: Meeting Point → Destination */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b', 
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ride.meetingPoint}
                        </Typography>
                        <ArrowForward sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#64748b', 
                            fontSize: '0.9rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ride.destination}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Participants */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        bgcolor: '#f0f9ff',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 2,
                        height: 'fit-content',
                      }}
                    >
                      <Person sx={{ fontSize: 18, color: '#3b82f6' }} />
                      <Typography variant="body2" sx={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 600 }}>
                        {ride.participants?.length || 0}/{ride.maxParticipants || 10}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Date & Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <CalendarToday sx={{ fontSize: 16, color: '#7c3aed' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {formatDate(ride.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Schedule sx={{ fontSize: 16, color: '#7c3aed' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {formatTime(ride.time)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Bottom Section: Ride Type + Status + View Details Button */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    {/* Left: Ride Type + Status Badge */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={ride.rideType}
                        sx={{
                          bgcolor: getRideTypeColor(ride.rideType),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          height: 32,
                          borderRadius: 2,
                        }}
                      />

                      {/* ONGOING BADGE */}
                      {ride.status === 'ongoing' && (
                        <Chip
                          label="Ongoing"
                          sx={{
                            bgcolor: '#f59e0b',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            height: 32,
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Box>

                    {/* View Details Button */}
                    <Button
                      variant="contained"
                      onClick={() => handleViewDetails(ride.id)}
                      sx={{
                        bgcolor: '#7c3aed',
                        color: 'white',
                        px: 3,
                        py: 1,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 3,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: '#6d28d9',
                          boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                        },
                      }}
                    >
                      View Details
                    </Button>
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
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Home />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Home
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#7c3aed' }}>
                <DirectionsBike />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>
                Rides
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => alert('Chat - Coming Soon!')}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Badge badgeContent={2} color="error">
                  <Chat />
                </Badge>
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
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