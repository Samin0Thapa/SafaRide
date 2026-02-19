import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Warning,
  MyLocation,
  Person,
  DirectionsBike,
  Notifications,
} from '@mui/icons-material';

export default function EmergencySOS() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleHoldStart = () => {
    setIsHolding(true);
    setHoldProgress(0);

    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    // Activation after 2 seconds
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
    // TODO: Trigger SOS alert to all participants via Firestore
    console.log('🚨 SOS ACTIVATED! Notifying all participants...');
    
    setIsHolding(false);
    setHoldProgress(0);
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Navigate back after activation
    setTimeout(() => {
      navigate(-1);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

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
        {/* Warning Card */}
        <Card
          sx={{
            borderRadius: 6,
            mb: 3,
            borderLeft: '6px solid #D32F2F',
            boxShadow: '0 4px 20px rgba(211, 47, 47, 0.1)',
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
                  Activating SOS will immediately notify all ride participants and your emergency contacts. Use only in genuine emergencies.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Status Dashboard - Dual Column */}
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

          {/* Emergency Contacts */}
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
                <Person sx={{ fontSize: 28, color: '#7c3aed' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Contacts
              </Typography>
              <Typography variant="caption" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                3 Linked
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Hero Action - SOS Button */}
        <Card
          sx={{
            borderRadius: 6,
            mb: 3,
            boxShadow: '0 8px 32px rgba(211, 47, 47, 0.15)',
          }}
        >
          <CardContent sx={{ py: 5, px: 3, textAlign: 'center' }}>
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
                cursor: 'pointer',
                userSelect: 'none',
                mb: 3,
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
                  stroke="#D32F2F"
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
                  bgcolor: isHolding ? '#B71C1C' : '#D32F2F',
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
                  <Notifications sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {isHolding ? 'Activating...' : 'Hold to'}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {isHolding ? `${Math.floor((holdProgress / 100) * 2)}s` : 'Activate'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {isHolding ? 'Release to cancel activation' : 'Press and hold for 2 seconds'}
            </Typography>
          </CardContent>
        </Card>

        {/* Who Will Be Notified */}
        <Card
          sx={{
            borderRadius: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
              Who will be notified
            </Typography>

            {/* Ride Participants */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                  All Ride Participants
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Currently 5 riders in your group
                </Typography>
              </Box>
            </Box>

            {/* Emergency Contacts */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#ec4899',
                }}
              >
                <Person sx={{ fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Your Emergency Contacts
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  3 contacts will receive SMS alerts
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}