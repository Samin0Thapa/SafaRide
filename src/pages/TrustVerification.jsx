import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Star,
  Security,
  DirectionsBike,
  CheckCircle,
  Flag,
  Percent,
  Check,
} from '@mui/icons-material';

export default function TrustVerification() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
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
          isOrganizer: false,
          totalRides: 47,
          completedRides: 45,
          organizedRides: 12,
          completionRate: 92,
          rating: 4.8,
          memberSince: '2026',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
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
        pb: 3,
      }}
    >
      {/* Small Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 6,
          color: 'white',
        }}
      >
        {/* Back Button + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/profile')}
            sx={{ color: 'white', p: 0 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Trust and Verification
          </Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>
        {/* Main White Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            {/* Security Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 2,
              }}
            >
              <Security sx={{ fontSize: 40, color: '#7c3aed' }} />
            </Box>

            {/* User Name */}
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              {userData?.displayName || user?.displayName || 'User'}
            </Typography>

            {/* Member Since */}
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              Member since {userData?.memberSince || '2026'}
            </Typography>

            {/* Rating Card */}
            <Card
              sx={{
                bgcolor: '#f3e8ff',
                borderRadius: 3,
                mb: 2,
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>
                  Trust Score
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  {userData?.rating || 4.8}/5
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      sx={{
                        fontSize: 24,
                        color: star <= 4 ? '#fbbf24' : '#cbd5e1',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Verification Status Card */}
            <Card
              sx={{
                bgcolor: userData?.verified ? '#dcfce7' : '#f1f5f9',
                borderRadius: 3,
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: userData?.verified ? 0 : 0.5 }}>
                  {userData?.verified ? (
                    <CheckCircle sx={{ fontSize: 20, color: '#16a34a' }} />
                  ) : (
                    <Security sx={{ fontSize: 20, color: '#64748b' }} />
                  )}
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: userData?.verified ? '#16a34a' : '#64748b',
                    }}
                  >
                    {userData?.verified ? 'Verified' : 'Not Verified'}
                  </Typography>
                </Box>
                {!userData?.verified && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      display: 'block',
                      textAlign: 'center',
                    }}
                  >
                    Request organizer verification
                  </Typography>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Rides and Statistics Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, px: 1 }}>
          Rides and Statistics
        </Typography>

        {/* Statistics Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          {/* Total Rides */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <DirectionsBike sx={{ fontSize: 24, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {userData?.totalRides || 47}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Total Rides
              </Typography>
            </CardContent>
          </Card>

          {/* Completed Rides */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <CheckCircle sx={{ fontSize: 24, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {userData?.completedRides || 45}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Completed Rides
              </Typography>
            </CardContent>
          </Card>

          {/* Organized Rides */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <Flag sx={{ fontSize: 24, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {userData?.organizedRides || 12}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Organized
              </Typography>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <Percent sx={{ fontSize: 24, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {userData?.completionRate || 92}%
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Completion Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Build Your Trust Score Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, px: 1 }}>
          Build Your Trust Score
        </Typography>

        {/* Tips Card */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Check sx={{ fontSize: 16, color: '#7c3aed' }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Complete your rides
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Check sx={{ fontSize: 16, color: '#7c3aed' }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Get positive ratings
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              >
                <Check sx={{ fontSize: 16, color: '#7c3aed' }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Verify your identity
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Request Organizer Role Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={() => navigate('/verification-form')}
          sx={{
            bgcolor: '#7c3aed',
            color: 'white',
            py: 1.75,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 3,
            boxShadow: 'none',
            mb: 1.5,
            '&:hover': {
              bgcolor: '#6d28d9',
            },
          }}
        >
          Request Organizer Role
        </Button>

        {/* Footer Text */}
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            textAlign: 'center',
            display: 'block',
            px: 2,
            lineHeight: 1.5,
          }}
        >
          Verified organizers can create rides and gain community trust.
        </Typography>
      </Container>
    </Box>
  );
}