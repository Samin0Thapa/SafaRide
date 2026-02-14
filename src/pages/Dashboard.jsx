import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  CircularProgress,
  Chip,
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
  CalendarToday,
  Schedule,
  Warning,
} from '@mui/icons-material';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [ongoingRides, setOngoingRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

  // Fetch ongoing rides where user is a participant
  useEffect(() => {
    const fetchOngoingRides = async () => {
      if (!user) {
        setLoadingRides(false);
        return;
      }

      try {
        setLoadingRides(true);
        
        // Query rides where status is 'ongoing'
        const ridesQuery = query(
          collection(db, 'rides'),
          where('status', '==', 'ongoing')
        );

        const querySnapshot = await getDocs(ridesQuery);
        const ridesData = [];

        querySnapshot.forEach((doc) => {
          const rideData = { id: doc.id, ...doc.data() };
          
          // Check if current user is a participant OR the organizer
          const isParticipant = rideData.participants?.some(p => p.userId === user.uid);
          const isOrganizer = rideData.createdBy === user.uid;
          
          if (isParticipant || isOrganizer) {
            ridesData.push(rideData);
          }
        });

        setOngoingRides(ridesData);
      } catch (error) {
        console.error('Error fetching ongoing rides:', error);
      } finally {
        setLoadingRides(false);
      }
    };

    fetchOngoingRides();
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data()?.role;

      if (role === 'rider') {
        setShowVerificationDialog(true);
      } else if (role === 'organizer' || role === 'admin') {
        navigate('/create-ride');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleSOSClick = (rideId) => {
    // Navigate to SOS page or trigger SOS
    alert('SOS functionality - Coming soon!');
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

          {/* Emergency SOS Card */}
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
            onClick={() => navigate('/emergency-contacts')}
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
                      Set up emergency contacts
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

          {/* Ongoing Rides Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Ongoing Rides
              </Typography>
              {ongoingRides.length > 0 && (
                <Chip
                  label={`${ongoingRides.length} Active`}
                  size="small"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#059669',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {/* Loading State */}
            {loadingRides && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#7c3aed' }} />
              </Box>
            )}

            {/* Empty State */}
            {!loadingRides && ongoingRides.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5 }}>
                  No ongoing rides
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Join a ride to see it here!
                </Typography>
              </Box>
            )}

            {/* Ongoing Rides List */}
            {!loadingRides && ongoingRides.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ongoingRides.map((ride) => (
                  <Card
                    key={ride.id}
                    sx={{
                      borderRadius: 4,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '2px solid #10b981',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Ride Title and Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                            {ride.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {ride.meetingPoint} → {ride.destination}
                          </Typography>
                        </Box>
                        <Chip
                          label="LIVE"
                          size="small"
                          sx={{
                            bgcolor: '#10b981',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            animation: 'pulse 2s infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.7 },
                            },
                          }}
                        />
                      </Box>

                      {/* Date, Time, Participants */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {ride.date}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {formatTime(ride.time)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 14, color: '#7c3aed' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            {ride.participants?.length || 0} riders
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => navigate(`/ride-details/${ride.id}`)}
                          sx={{
                            color: '#7c3aed',
                            borderColor: '#7c3aed',
                            py: 1.2,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 3,
                            borderWidth: 2,
                            '&:hover': {
                              borderColor: '#6d28d9',
                              bgcolor: 'transparent',
                              borderWidth: 2,
                            },
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Warning />}
                          onClick={() => handleSOSClick(ride.id)}
                          sx={{
                            bgcolor: '#ef4444',
                            color: 'white',
                            py: 1.2,
                            px: 2.5,
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 3,
                            boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                            '&:hover': {
                              bgcolor: '#dc2626',
                              boxShadow: '0 6px 16px rgba(239,68,68,0.4)',
                            },
                          }}
                        >
                          SOS
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
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