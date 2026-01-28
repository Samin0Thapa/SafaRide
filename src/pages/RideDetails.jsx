import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import RouteMapViewer from '../components/RouteMapViewer';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  CalendarToday,
  Schedule,
  DirectionsBike,
  AccessTime,
  Star,
  Person,
  Chat,
  Image as ImageIcon,
  Map as MapIcon,
  ChevronRight,
} from '@mui/icons-material';

export default function RideDetails() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMapViewer, setShowMapViewer] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      
      if (rideDoc.exists()) {
        setRide({ id: rideDoc.id, ...rideDoc.data() });
      } else {
        console.error('Ride not found');
      }
    } catch (error) {
      console.error('Error fetching ride:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Ride not found</Typography>
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
      {/* Purple Header with Gradient - Extended */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          pt: 2,
          pb: 8,
          px: 2,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={() => navigate('/join-ride')}
          sx={{ color: 'white', mb: 3 }}
        >
          <ArrowBack />
        </IconButton>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {ride.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOn sx={{ fontSize: 16 }} />
          <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.9rem' }}>
            {ride.meetingPoint} → {ride.destination}
          </Typography>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1, 
          px: 2, 
          mt: -4,
          pb: 12,
          overflowY: 'auto',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Main Info Card - Elevated */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            mb: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          {/* Date & Time Row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <CalendarToday sx={{ fontSize: 16, color: '#7c3aed' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  Date
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {ride.date}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Schedule sx={{ fontSize: 16, color: '#7c3aed' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  Time
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {formatTime(ride.time)}
              </Typography>
            </Box>
          </Box>

          {/* Duration & Type Row */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <AccessTime sx={{ fontSize: 16, color: '#7c3aed' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  Duration
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {ride.duration}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <DirectionsBike sx={{ fontSize: 16, color: '#7c3aed' }} />
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  Type
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {ride.rideType}
              </Typography>
            </Box>
          </Box>

          {/* Rating & Riders Row */}
          <Box sx={{ display: 'flex', gap: 3, pt: 2, borderTop: '1px solid #f1f5f9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star sx={{ fontSize: 20, color: '#f59e0b' }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                4.8
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Rating
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 20, color: '#7c3aed' }} />
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                {ride.participants?.length || 0}/{ride.maxParticipants || 10}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Riders
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* View Route Map Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            mb: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
          }}
          onClick={() => setShowMapViewer(true)}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapIcon sx={{ fontSize: 24, color: '#0284c7' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.25 }}>
              View Route Map
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              See pathway from meetup to destination
            </Typography>
          </Box>
          <ChevronRight sx={{ color: '#cbd5e1' }} />
        </Box>

        {/* Organizer Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            mb: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            Organizer
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#7c3aed',
                fontSize: '1.3rem',
                fontWeight: 700,
              }}
            >
              {ride.createdByName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.25 }}>
                {ride.createdByName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} sx={{ fontSize: 14, color: '#fbbf24' }} />
                ))}
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', ml: 0.5 }}>
                  4.8 • 52 rides
                </Typography>
              </Box>
            </Box>
            <IconButton
              sx={{
                bgcolor: '#f3e8ff',
                color: '#7c3aed',
                '&:hover': { bgcolor: '#e9d5ff' },
              }}
            >
              <Chat sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Participants Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            mb: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Participants ({ride.participants?.length || 0})
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#7c3aed',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View All
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <Avatar
                key={i}
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: '#7c3aed',
                  border: '3px solid white',
                  ml: i > 1 ? -1.5 : 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {String.fromCharCode(64 + i)}
              </Avatar>
            ))}
            {ride.participants?.length > 4 && (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: -1.5,
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.85rem' }}>
                  +{ride.participants.length - 4}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Ride Photos Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Ride Photos
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#7c3aed',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              + Add Photo
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: '#fafafa',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
              }}
            >
              <ImageIcon sx={{ fontSize: 32, color: '#cbd5e1' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
              No photos yet
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Add photos from your ride
            </Typography>
          </Box>
        </Box>

        {/* Description Card (if available) */}
        {ride.description && (
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 5,
              p: 2.5,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
              {ride.description}
            </Typography>
          </Box>
        )}
      </Container>

      {/* Bottom Action Buttons - Fixed */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'white',
          borderTop: '1px solid #e5e7eb',
          p: 2,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="sm" sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Chat />}
            sx={{
              flex: 1,
              color: '#7c3aed',
              borderColor: '#7c3aed',
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 4,
              borderWidth: 2,
              '&:hover': {
                borderColor: '#6d28d9',
                bgcolor: 'transparent',
                borderWidth: 2,
              },
            }}
          >
            Open Chat
          </Button>
          <Button
            variant="contained"
            startIcon={<Person />}
            sx={{
              flex: 1,
              bgcolor: '#7c3aed',
              color: 'white',
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              '&:hover': {
                bgcolor: '#6d28d9',
                boxShadow: '0 6px 16px rgba(124,58,237,0.4)',
              },
            }}
          >
            Join Ride
          </Button>
        </Container>
      </Box>

      {/* Route Map Viewer Dialog */}
      <RouteMapViewer
        open={showMapViewer}
        onClose={() => setShowMapViewer(false)}
        meetingPoint={ride.meetingPoint}
        destination={ride.destination}
        meetingPointCoords={ride.meetingPointCoords}
        destinationCoords={ride.destinationCoords}
      />
    </Box>
  );
}