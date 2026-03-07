import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Warning,
  MyLocation,
  Person,
  DirectionsBike,
  Notifications,
  Phone,
  Close,
  Block,
} from '@mui/icons-material';

export default function EmergencySOS() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [user, setUser] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [sosActive, setSOSActive] = useState(false);
  const [showParticipantsDialog, setShowParticipantsDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  // Ride data
  const [activeRide, setActiveRide] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);

  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const beepIntervalRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        checkActiveRide(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [rideId]);

  const checkActiveRide = async (userId) => {
    try {
      setLoading(true);
      
      // If we have a rideId from URL params, use that specific ride
      if (rideId) {
        const rideDoc = await getDoc(doc(db, 'rides', rideId));
        
        if (!rideDoc.exists()) {
          console.log('Ride not found');
          setLoading(false);
          return;
        }

        const rideData = { id: rideDoc.id, ...rideDoc.data() };
        
        // Check if user is participant or creator
        const isCreator = rideData.createdBy === userId;
        const isParticipant = Array.isArray(rideData.participants) && 
                             rideData.participants.some(p => 
                               (typeof p === 'object' && p.userId === userId) || 
                               p === userId
                             );
        
        console.log('Checking ride access:');
        console.log('User ID:', userId);
        console.log('Is Creator:', isCreator);
        console.log('Is Participant:', isParticipant);
        console.log('Participants:', rideData.participants);
        
        if (isCreator || isParticipant) {
          setActiveRide(rideData);
          setIsParticipant(true);
          await fetchParticipants(rideData.participants || []);
        } else {
          setIsParticipant(false);
        }
      } else {
        // No rideId provided - check for any ongoing rides
        const ridesQuery = query(
          collection(db, 'rides'),
          where('status', '==', 'ongoing')
        );
        
        const snapshot = await getDocs(ridesQuery);
        
        let foundActiveRide = null;
        
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
            foundActiveRide = rideData;
          }
        });
        
        if (foundActiveRide) {
          setActiveRide(foundActiveRide);
          setIsParticipant(true);
          await fetchParticipants(foundActiveRide.participants || []);
        } else {
          setIsParticipant(false);
        }
      }
      
    } catch (error) {
      console.error('Error checking active ride:', error);
      setIsParticipant(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (participantsList) => {
    try {
      const participantsData = [];
      
      for (const participant of participantsList) {
        // Handle both string IDs and objects with userId
        const participantId = typeof participant === 'object' ? participant.userId : participant;
        
        if (participantId) {
          const userDoc = await getDoc(doc(db, 'users', participantId));
          if (userDoc.exists()) {
            participantsData.push({
              id: participantId,
              ...userDoc.data(),
            });
          }
        }
      }
      
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleHoldStart = () => {
    // Only allow if user is a participant
    if (!isParticipant) {
      return;
    }

    setIsHolding(true);
    setHoldProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    holdTimerRef.current = setTimeout(() => {
      handleSOSActivate();
    }, 2000);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleSOSActivate = () => {
    setSOSActive(true);
    startContinuousBeep();
    
    if (participants.length > 0) {
      setShowParticipantsDialog(true);
    }
    
    console.log('🚨 SOS ACTIVATED! Notifying all participants...');
    
    setIsHolding(false);
    setHoldProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleStopSOS = () => {
    setSOSActive(false);
    setShowParticipantsDialog(false);
    stopContinuousBeep();
    console.log('✅ SOS STOPPED');
    
    setTimeout(() => {
      navigate(-1);
    }, 500);
  };

  const handleShowContacts = (participant) => {
    setSelectedParticipant(participant);
    setShowContactsDialog(true);
  };

  const startContinuousBeep = () => {
  playBeepAndVibrate();
  beepIntervalRef.current = setInterval(() => {
    playBeepAndVibrate();
  }, 1000);
};

const stopContinuousBeep = () => {
  if (beepIntervalRef.current) {
    clearInterval(beepIntervalRef.current);
    beepIntervalRef.current = null;
  }
};

const playBeepAndVibrate = () => {
  // Play beep sound
  playBeep();
  
  // Vibrate phone (if supported)
  if ('vibrate' in navigator) {
    // Vibrate for 300ms
    navigator.vibrate(300);
  }
};

const playBeep = () => {
  try {
    // Create audio context only once
    if (!window.audioContext) {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioContext = window.audioContext;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 900; // High-pitched emergency beep
    gainNode.gain.value = 0.5; // Increased volume slightly
    
    const now = audioContext.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.3); // 0.3 second beep
  } catch (error) {
    console.error('Audio error:', error);
  }
};

  useEffect(() => {
  return () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      // Stop any ongoing vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(500);
      }
    }
  };
}, []);

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
        bgcolor: '#FFF5F5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Red Header */}
      <Box
        sx={{
          bgcolor: '#D32F2F',
          color: 'white',
          py: 2,
          px: 2,
          borderRadius: '0 0 24px 24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ color: 'white', mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Emergency SOS
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: 3, px: 2 }}>
        {/* Access Denied Alert - Show if NOT a participant */}
        {!isParticipant && (
          <Alert
            severity="error"
            icon={<Block />}
            sx={{
              mb: 3,
              borderRadius: 3,
              bgcolor: '#fef2f2',
              color: '#991b1b',
              border: '2px solid #fecaca',
              '& .MuiAlert-icon': {
                color: '#dc2626',
              },
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Access Restricted
            </Typography>
            <Typography variant="body2">
              You must be a participant in an active ride to use the Emergency SOS feature. Join a ride to enable this feature.
            </Typography>
          </Alert>
        )}

        {/* Warning Card */}
        <Card
          sx={{
            borderRadius: 6,
            mb: 3,
            borderLeft: '6px solid #D32F2F',
            boxShadow: '0 4px 20px rgba(211, 47, 47, 0.1)',
            opacity: !isParticipant ? 0.6 : 1,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: 2,
                  bgcolor: '#FFEBEE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Warning sx={{ fontSize: 28, color: '#D32F2F' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  Emergency Alert
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                  Activating SOS will immediately notify all ride participants and their emergency contacts. Use only in genuine emergencies.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Status Dashboard - Only show if participant */}
        {isParticipant && activeRide && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {/* GPS Status */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 6,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#E8F5E9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1.5,
                    position: 'relative',
                  }}
                >
                  <MyLocation sx={{ fontSize: 28, color: '#4CAF50' }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#4CAF50',
                      border: '2px solid white',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  GPS Status
                </Typography>
                <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  Live
                </Typography>
              </CardContent>
            </Card>

            {/* Ride Participants */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 6,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: '#F3E5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 1.5,
                  }}
                >
                  <DirectionsBike sx={{ fontSize: 28, color: '#7c3aed' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  Participants
                </Typography>
                <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                  {participants.length} Riders
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Hero Action - SOS Button */}
        <Card
          sx={{
            borderRadius: 6,
            mb: 3,
            boxShadow: sosActive 
              ? '0 8px 32px rgba(211, 47, 47, 0.4)' 
              : '0 8px 32px rgba(211, 47, 47, 0.15)',
            bgcolor: sosActive ? '#FFEBEE' : 'white',
            opacity: !isParticipant && !sosActive ? 0.5 : 1,
          }}
        >
          <CardContent sx={{ py: 5, px: 3, textAlign: 'center' }}>
            {!sosActive ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 4 }}>
                  Emergency Activation
                </Typography>

                {/* Circular SOS Button */}
                <Box
                  onMouseDown={handleHoldStart}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={handleHoldStart}
                  onTouchEnd={handleHoldEnd}
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    margin: '0 auto',
                    position: 'relative',
                    cursor: isParticipant ? 'pointer' : 'not-allowed',
                    userSelect: 'none',
                    mb: 3,
                    filter: !isParticipant ? 'grayscale(100%)' : 'none',
                  }}
                >
                  {/* Progress Ring */}
                  <svg
                    width="200"
                    height="200"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: 'rotate(-90deg)',
                    }}
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="95"
                      fill="none"
                      stroke="#FFEBEE"
                      strokeWidth="10"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="95"
                      fill="none"
                      stroke={isParticipant ? '#D32F2F' : '#cbd5e1'}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 95}`}
                      strokeDashoffset={`${2 * Math.PI * 95 * (1 - holdProgress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                  </svg>

                  {/* Inner Button */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 170,
                      height: 170,
                      borderRadius: '50%',
                      bgcolor: !isParticipant ? '#94a3b8' : (isHolding ? '#B71C1C' : '#D32F2F'),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: isHolding 
                        ? '0 12px 40px rgba(183, 28, 28, 0.5)' 
                        : '0 8px 32px rgba(211, 47, 47, 0.4)',
                      transition: 'all 0.2s',
                      transform: isHolding 
                        ? 'translate(-50%, -50%) scale(0.95)' 
                        : 'translate(-50%, -50%) scale(1)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      {!isParticipant ? (
                        <Block sx={{ fontSize: 36 }} />
                      ) : (
                        <Notifications sx={{ fontSize: 36 }} />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {!isParticipant ? 'Locked' : (isHolding ? 'Activating...' : 'Hold to')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {!isParticipant ? '' : (isHolding ? `${Math.floor((holdProgress / 100) * 2)}s` : 'Activate')}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {!isParticipant 
                    ? 'Join an active ride to enable SOS' 
                    : (isHolding ? 'Release to cancel activation' : 'Press and hold for 2 seconds')}
                </Typography>
              </>
            ) : (
              <>
                {/* SOS Active State */}
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: '#D32F2F',
                    margin: '0 auto',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 1s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                      '50%': {
                        transform: 'scale(1.1)',
                        opacity: 0.8,
                      },
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: 60, color: 'white' }} />
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 700, color: '#D32F2F', mb: 1 }}>
                  🚨 SOS ACTIVE
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
                  Emergency alert is broadcasting...
                </Typography>

                {/* View Participants Button */}
                {participants.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => setShowParticipantsDialog(true)}
                    sx={{
                      borderColor: '#7c3aed',
                      color: '#7c3aed',
                      mb: 3,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#6d28d9',
                        bgcolor: 'rgba(124,58,237,0.05)',
                      },
                    }}
                  >
                    View All Participants
                  </Button>
                )}

                {/* Stop SOS Button */}
                <Box
                  onClick={handleStopSOS}
                  sx={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    bgcolor: '#1e293b',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 8px 32px rgba(30, 41, 59, 0.4)',
                    '&:hover': {
                      bgcolor: '#334155',
                      transform: 'scale(0.95)',
                    },
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                    STOP
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Tap to Stop
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Tap the button above to stop the emergency alert
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        {/* Current Ride Info - Only show if participant */}
        {isParticipant && activeRide && (
          <Card
            sx={{
              borderRadius: 6,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                Current Ride
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#7c3aed',
                  }}
                >
                  <DirectionsBike sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {activeRide.title || 'Unnamed Ride'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {participants.length} participants in this ride
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Participants Dialog */}
      <Dialog
        open={showParticipantsDialog}
        onClose={() => setShowParticipantsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Ride Participants ({participants.length})
            </Typography>
            <IconButton
              onClick={() => setShowParticipantsDialog(false)}
              sx={{ color: '#64748b' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {participants.map((participant, index) => (
            <Box key={participant.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 2,
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#f3e8ff',
                    color: '#7c3aed',
                    fontWeight: 700,
                  }}
                >
                  {participant.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {participant.displayName || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {participant.email}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleShowContacts(participant)}
                  sx={{
                    bgcolor: '#7c3aed',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: '#6d28d9',
                    },
                  }}
                >
                  Contacts
                </Button>
              </Box>
              {index < participants.length - 1 && <Divider />}
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      {/* Emergency Contacts Dialog */}
      <Dialog
        open={showContactsDialog}
        onClose={() => setShowContactsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Emergency Contacts
            </Typography>
            <IconButton
              onClick={() => setShowContactsDialog(false)}
              sx={{ color: '#64748b' }}
            >
              <Close />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            {selectedParticipant?.displayName || 'User'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {selectedParticipant?.emergencyContacts?.length > 0 ? (
            selectedParticipant.emergencyContacts.map((contact, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    py: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: '#fee2e2',
                      color: '#ef4444',
                    }}
                  >
                    <Person sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {contact.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', mb: 0.5 }}>
                      {contact.relationship}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Phone sx={{ fontSize: 14, color: '#7c3aed' }} />
                      <Typography variant="body2" sx={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600 }}>
                        {contact.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    href={`tel:${contact.phone}`}
                    sx={{
                      bgcolor: '#dcfce7',
                      color: '#22c55e',
                      '&:hover': {
                        bgcolor: '#bbf7d0',
                      },
                    }}
                  >
                    <Phone />
                  </IconButton>
                </Box>
                {index < selectedParticipant.emergencyContacts.length - 1 && <Divider />}
              </Box>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Person sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No emergency contacts available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowContactsDialog(false)}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}