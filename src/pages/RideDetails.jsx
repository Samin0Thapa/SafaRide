import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import RouteMapViewer from '../components/RouteMapViewer';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Fab,
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
  Close,
  CheckCircle,
  ExitToApp,
  PlayArrow,
  Cancel,
  CheckCircleOutline,
  Warning as WarningIcon,
} from '@mui/icons-material';

export default function RideDetails() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [user, setUser] = useState(null);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMapViewer, setShowMapViewer] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [showJoinSuccessDialog, setShowJoinSuccessDialog] = useState(false);
  const [showLeaveConfirmDialog, setShowLeaveConfirmDialog] = useState(false);
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false);
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false);
  const [showCompleteConfirmDialog, setShowCompleteConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchRideDetails();
  }, [rideId]);

  useEffect(() => {
    if (ride && user) {
      const participating = ride.participants?.some(p => p.userId === user.uid) || false;
      setIsParticipant(participating);
      
      const organizing = ride.createdBy === user.uid;
      setIsOrganizer(organizing);
    }
  }, [ride, user]);

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

  const handleJoinRide = async () => {
    if (!user) {
      alert('Please login to join this ride');
      return;
    }

    setActionLoading(true);
    try {
      const participantData = {
        userId: user.uid,
        name: user.displayName || 'Anonymous',
        email: user.email,
        joinedAt: new Date(),
      };

      const rideRef = doc(db, 'rides', rideId);
      const rideDoc = await getDoc(rideRef);
      
      if (!rideDoc.exists()) {
        alert('Ride not found');
        setActionLoading(false);
        return;
      }

      const currentRide = rideDoc.data();
      const currentParticipants = currentRide.participants || [];
      
      const alreadyJoined = currentParticipants.some(p => p.userId === user.uid);
      if (alreadyJoined) {
        alert('You have already joined this ride');
        setActionLoading(false);
        return;
      }

      const updatedParticipants = [...currentParticipants, participantData];

      await updateDoc(rideRef, {
        participants: updatedParticipants,
      });

      await fetchRideDetails();
      setShowJoinSuccessDialog(true);

    } catch (error) {
      console.error('Error joining ride:', error);
      alert(`Failed to join ride: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveRide = async () => {
    setShowLeaveConfirmDialog(false);
    setActionLoading(true);

    try {
      const updatedParticipants = ride.participants.filter(p => p.userId !== user.uid);

      await updateDoc(doc(db, 'rides', rideId), {
        participants: updatedParticipants,
      });

      await fetchRideDetails();

    } catch (error) {
      console.error('Error leaving ride:', error);
      alert('Failed to leave ride. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    setShowStartConfirmDialog(false);
    setActionLoading(true);

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'ongoing',
        startedAt: new Date(),
      });

      await fetchRideDetails();

    } catch (error) {
      console.error('Error starting ride:', error);
      alert('Failed to start ride. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    setShowCompleteConfirmDialog(false);
    setActionLoading(true);

    try {
      await updateDoc(doc(db, 'rides', rideId), {
        status: 'completed',
        completedAt: new Date(),
      });

      await fetchRideDetails();

    } catch (error) {
      console.error('Error completing ride:', error);
      alert('Failed to complete ride. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRide = async () => {
    setShowCancelConfirmDialog(false);
    setActionLoading(true);

    try {
      await deleteDoc(doc(db, 'rides', rideId));
      alert('Ride cancelled and deleted successfully!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error cancelling ride:', error);
      alert('Failed to cancel ride. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSOSClick = () => {
    alert('SOS Alert Sent! Emergency services have been notified.');
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

  const participantCount = ride.participants?.length || 0;
  const maxParticipants = ride.maxParticipants || 10;
  const isFull = participantCount >= maxParticipants;
  const rideStatus = ride.status || 'upcoming';

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
          zIndex: 1,
        }}
      >
        {/* Main Info Card */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 5,
            p: 2.5,
            mb: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
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
                {participantCount}/{maxParticipants}
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
              Participants ({participantCount})
            </Typography>
            {participantCount > 0 && (
              <Typography
                variant="body2"
                sx={{
                  color: '#7c3aed',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => setShowParticipantsDialog(true)}
              >
                View All
              </Typography>
            )}
          </Box>
          
          {participantCount === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#fafafa', borderRadius: 3 }}>
              <Person sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                No participants yet. Be the first to join!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {ride.participants.slice(0, 4).map((participant, index) => (
                <Avatar
                  key={index}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: '#7c3aed',
                    border: '3px solid white',
                    ml: index > 0 ? -1.5 : 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              ))}
              {participantCount > 4 && (
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
                    +{participantCount - 4}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Description Card */}
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

      {/* Floating SOS Button - Only for ongoing rides */}
      {rideStatus === 'ongoing' && (isParticipant || isOrganizer) && (
        <Fab
          onClick={handleSOSClick}
          sx={{
            position: 'fixed',
            bottom: 120,
            right: 20,
            bgcolor: '#ef4444',
            color: 'white',
            width: 70,
            height: 70,
            zIndex: 9998,
            '&:hover': {
              bgcolor: '#dc2626',
            },
            boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            SOS
          </Typography>
        </Fab>
      )}

      {/* Bottom Action Buttons */}
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
          zIndex: 9999,
        }}
      >
        <Container maxWidth="sm" sx={{ display: 'flex', gap: 2 }}>
          {/* ORGANIZER - Upcoming Ride */}
          {isOrganizer && rideStatus === 'upcoming' && (
            <>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => setShowCancelConfirmDialog(true)}
                disabled={actionLoading}
                sx={{
                  flex: 1,
                  color: '#ef4444',
                  borderColor: '#ef4444',
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 4,
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: '#dc2626',
                    bgcolor: 'transparent',
                    borderWidth: 2,
                  },
                }}
              >
                Cancel Ride
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setShowStartConfirmDialog(true)}
                disabled={actionLoading}
                sx={{
                  flex: 1,
                  bgcolor: '#10b981',
                  color: 'white',
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 4,
                  '&:hover': {
                    bgcolor: '#059669',
                  },
                }}
              >
                Start Ride
              </Button>
            </>
          )}

          {/* ORGANIZER - Ongoing Ride */}
          {isOrganizer && rideStatus === 'ongoing' && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<CheckCircleOutline />}
              onClick={() => setShowCompleteConfirmDialog(true)}
              disabled={actionLoading}
              sx={{
                bgcolor: '#7c3aed',
                color: 'white',
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 4,
                '&:hover': {
                  bgcolor: '#6d28d9',
                },
              }}
            >
              Complete Ride
            </Button>
          )}

          {/* PARTICIPANT - Upcoming Ride */}
          {!isOrganizer && rideStatus === 'upcoming' && (
            <>
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
              
              {isParticipant ? (
                <Button
                  variant="contained"
                  startIcon={<ExitToApp />}
                  onClick={() => setShowLeaveConfirmDialog(true)}
                  disabled={actionLoading}
                  sx={{
                    flex: 1,
                    bgcolor: '#ef4444',
                    color: 'white',
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 4,
                    '&:hover': {
                      bgcolor: '#dc2626',
                    },
                  }}
                >
                  Leave Ride
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Person />}
                  onClick={handleJoinRide}
                  disabled={actionLoading || isFull}
                  sx={{
                    flex: 1,
                    bgcolor: '#7c3aed',
                    color: 'white',
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 4,
                    '&:hover': {
                      bgcolor: '#6d28d9',
                    },
                    '&:disabled': {
                      bgcolor: '#cbd5e1',
                    },
                  }}
                >
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : isFull ? 'Ride Full' : 'Join Ride'}
                </Button>
              )}
            </>
          )}

          {/* PARTICIPANT - Ongoing Ride */}
          {!isOrganizer && rideStatus === 'ongoing' && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Chat />}
              sx={{
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
          )}

          {/* Completed Ride */}
          {rideStatus === 'completed' && (
            <Box sx={{ flex: 1, textAlign: 'center', py: 1 }}>
              <CheckCircleOutline sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                This ride has been completed
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Dialogs */}
      <RouteMapViewer
        open={showMapViewer}
        onClose={() => setShowMapViewer(false)}
        meetingPoint={ride.meetingPoint}
        destination={ride.destination}
        meetingPointCoords={ride.meetingPointCoords}
        destinationCoords={ride.destinationCoords}
      />

      <Dialog open={showJoinSuccessDialog} onClose={() => setShowJoinSuccessDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: '400px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 50, color: '#10b981' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>You're In!</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>You are now participating in this ride!</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={() => setShowJoinSuccessDialog(false)} sx={{ bgcolor: '#7c3aed', px: 4, py: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>Got it!</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showLeaveConfirmDialog} onClose={() => setShowLeaveConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: '400px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <ExitToApp sx={{ fontSize: 60, color: '#ef4444', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Leave This Ride?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Are you sure you want to leave this ride?</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button onClick={() => setShowLeaveConfirmDialog(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleLeaveRide} sx={{ bgcolor: '#ef4444', px: 3, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#dc2626' } }}>Leave Ride</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showStartConfirmDialog} onClose={() => setShowStartConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: '400px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <PlayArrow sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Start This Ride?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>This will mark the ride as ongoing.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button onClick={() => setShowStartConfirmDialog(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleStartRide} sx={{ bgcolor: '#10b981', px: 3, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#059669' } }}>Start Ride</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showCompleteConfirmDialog} onClose={() => setShowCompleteConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: '400px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <CheckCircleOutline sx={{ fontSize: 60, color: '#7c3aed', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Complete This Ride?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>This will mark the ride as completed.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button onClick={() => setShowCompleteConfirmDialog(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCompleteRide} sx={{ bgcolor: '#7c3aed', px: 3, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#6d28d9' } }}>Complete Ride</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showCancelConfirmDialog} onClose={() => setShowCancelConfirmDialog(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: '400px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <WarningIcon sx={{ fontSize: 60, color: '#ef4444', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Cancel & Delete Ride?</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>This will permanently delete the ride.</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button onClick={() => setShowCancelConfirmDialog(false)} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCancelRide} sx={{ bgcolor: '#ef4444', px: 3, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#dc2626' } }}>Delete Ride</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showParticipantsDialog} onClose={() => setShowParticipantsDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2, maxHeight: '70vh' } }}>
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Participants ({participantCount})</Typography>
            <IconButton onClick={() => setShowParticipantsDialog(false)} size="small" sx={{ color: '#64748b' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
            {ride.participants?.map((participant, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: participant.userId === user?.uid ? '#10b981' : '#7c3aed', fontSize: '1.2rem', fontWeight: 700 }}>
                    {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>{participant.name || 'Anonymous'}</Typography>
                      {participant.userId === user?.uid && (
                        <Box sx={{ bgcolor: '#dcfce7', color: '#10b981', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 600 }}>You</Box>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{participant.email || 'No email'}</Typography>
                  </Box>
                </Box>
                {index < ride.participants.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}