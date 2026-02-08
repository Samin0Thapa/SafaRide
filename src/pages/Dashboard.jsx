import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Add,
  PersonAdd,
  ContactEmergency,
  Chat,
  DirectionsBike,
  Home as HomeIcon,
  Message,
  Person,
  Notifications,
  ArrowForward,
  Logout,
  VerifiedUser,
} from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch user role on component mount
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateRideClick = async () => {
    try {
      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;

      if (role === 'rider') {
        // Show verification required dialog
        setShowVerificationDialog(true);
      } else if (role === 'organizer' || role === 'admin') {
        // Allow create ride
        navigate('/create-ride');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          overflow: 'auto',
        }}
      >
        {/* Purple Header Card */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            borderRadius: '0 0 30px 30px',
            px: 3,
            pt: `calc(env(safe-area-inset-top) + 8px)`,
            pb: 3,
            color: 'white',
          }}
        >
          {/* Profile + Notification Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            {/* Left: Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  border: '3px solid rgba(255,255,255,0.3)',
                  bgcolor: '#fff',
                  color: '#7c3aed',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                }}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Welcome back,
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {user?.displayName || 'Rider'}
                </Typography>
                {/* Show badge if organizer or admin */}
                {(userRole === 'organizer' || userRole === 'admin') && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <VerifiedUser sx={{ fontSize: 16, color: '#22c55e' }} />
                    <Typography variant="caption" sx={{ color: '#dcfce7', fontWeight: 600 }}>
                      {userRole === 'admin' ? 'Admin' : 'Verified Organizer'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right: Notification + Logout */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconButton
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              <IconButton
                onClick={handleLogout}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Logout />
              </IconButton>
            </Box>
          </Box>

          {/* Stats Row with Purple Boxes */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', gap: 2 }}>
            <Box
              sx={{
                textAlign: 'center',
                bgcolor: 'rgba(167, 139, 250, 0.3)',
                borderRadius: 3,
                py: 2,
                px: 3,
                flex: 1,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Rides
              </Typography>
            </Box>
            <Box
              sx={{
                textAlign: 'center',
                bgcolor: 'rgba(167, 139, 250, 0.3)',
                borderRadius: 3,
                py: 2,
                px: 3,
                flex: 1,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                5.0
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Rating
              </Typography>
            </Box>
            <Box
              sx={{
                textAlign: 'center',
                bgcolor: 'rgba(167, 139, 250, 0.3)',
                borderRadius: 3,
                py: 2,
                px: 3,
                flex: 1,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Badges
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 2, flex: 1 }}>
          {/* Create & Join Ride Cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {/* Create Ride */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={handleCreateRideClick}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                  }}
                >
                  <Add sx={{ fontSize: 30, color: '#7c3aed' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Create Ride
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Organize a new ride
                </Typography>
              </CardContent>
            </Card>

            {/* Join Ride */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={() => navigate('/join-ride')}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                  }}
                >
                  <PersonAdd sx={{ fontSize: 30, color: '#7c3aed' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Join Ride
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Find rides nearby
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Emergency Contacts Card */}
          <Card
            sx={{
              borderRadius: 4,
              mb: 2,
              bgcolor: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
            onClick={() => alert('Emergency Contacts - Coming Soon!')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ContactEmergency sx={{ fontSize: 26 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Emergency SOS
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                      Activate emergency alert
                    </Typography>
                  </Box>
                </Box>
                <ArrowForward sx={{ fontSize: 28 }} />
              </Box>
            </CardContent>
          </Card>

          {/* Group Chat Card */}
          <Card
            sx={{
              borderRadius: 4,
              mb: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)' },
            }}
            onClick={() => alert('Group Chat - Coming Soon!')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: '#f3e8ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Chat sx={{ fontSize: 26, color: '#7c3aed' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Group Chat
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      Connect with riders
                    </Typography>
                  </Box>
                </Box>
                <Badge badgeContent={3} color="error">
                  <Box sx={{ width: 24, height: 24 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>

          {/* Recent Rides Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Recent Rides
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#7c3aed',
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View All
            </Typography>
          </Box>

          {/* Placeholder for rides */}
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No recent rides yet
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Bottom Navigation */}
      <Box
        sx={{
          bgcolor: 'white',
          borderTop: '1px solid #e5e7eb',
          py: 1.5,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#7c3aed' }}>
                <HomeIcon />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#7c3aed', fontWeight: 600 }}>
                Home
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }} onClick={() => navigate('/join-ride')}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <DirectionsBike />
              </IconButton>
              <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                Rides
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <IconButton sx={{ color: '#94a3b8' }}>
                <Badge badgeContent={2} color="error">
                  <Message />
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

      {/* Verification Required Dialog */}
      <Dialog
        open={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 2,
            py: 1,
            maxWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
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
            <VerifiedUser sx={{ fontSize: 50, color: '#7c3aed' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Organizer Verification Required
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            You need to be a verified organizer to create rides.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Get verified to organize group rides and build your community!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
          <Button
            onClick={() => setShowVerificationDialog(false)}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowVerificationDialog(false);
              navigate('/become-organizer');
            }}
            sx={{
              bgcolor: '#7c3aed',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            Request Organizer Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}