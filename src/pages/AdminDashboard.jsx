import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Person,
  DirectionsBike,
  Schedule,
  VerifiedUser,
  Logout,
  Close,
  CalendarToday,
  Phone,
  Badge,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    pendingRequests: 0,
    verifiedOrganizers: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedOrganizers, setApprovedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showRequestDetailsDialog, setShowRequestDetailsDialog] = useState(false);
  const [showApprovedOrganizersDialog, setShowApprovedOrganizersDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Fetch total rides
      const ridesSnapshot = await getDocs(collection(db, 'rides'));
      const totalRides = ridesSnapshot.size;

      // Fetch pending verification requests
      const pendingQuery = query(
        collection(db, 'verificationRequests'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingRequestsData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch verified organizers
      const organizersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'organizer')
      );
      const organizersSnapshot = await getDocs(organizersQuery);
      const organizersData = organizersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      const verifiedOrganizers = organizersSnapshot.size;

      setStats({
        totalUsers,
        totalRides,
        pendingRequests: pendingRequestsData.length,
        verifiedOrganizers,
      });
      setPendingRequests(pendingRequestsData);
      setApprovedOrganizers(organizersData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      // Update verification request status
      await updateDoc(doc(db, 'verificationRequests', selectedRequest.id), {
        status: 'approved',
        approvedAt: new Date(),
      });

      // Update user role to 'organizer'
      await updateDoc(doc(db, 'users', selectedRequest.userId), {
        role: 'organizer',
        verified: true,
      });

      console.log('Request approved successfully');
      
      // Refresh data
      await fetchDashboardData();
      
      // Close dialog
      setShowRequestDetailsDialog(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      // Update verification request status
      await updateDoc(doc(db, 'verificationRequests', selectedRequest.id), {
        status: 'rejected',
        rejectedAt: new Date(),
      });

      console.log('Request rejected successfully');
      
      // Refresh data
      await fetchDashboardData();
      
      // Close dialog
      setShowRequestDetailsDialog(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
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
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 6,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              SafaRide Management Portal
            </Typography>
          </Box>
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

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>
        {/* Stats Cards - 2x2 Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mb: 3,
          }}
        >
          {/* Total Users */}
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <Person sx={{ fontSize: 26, color: '#4f46e5' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {stats.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Total Users
              </Typography>
            </CardContent>
          </Card>

          {/* Total Rides */}
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: '#f3e8ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <DirectionsBike sx={{ fontSize: 26, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {stats.totalRides.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Total Rides
              </Typography>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <Schedule sx={{ fontSize: 26, color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {stats.pendingRequests}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Pending Requests
              </Typography>
            </CardContent>
          </Card>

          {/* Verified Organizers */}
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: '#d1fae5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                <VerifiedUser sx={{ fontSize: 26, color: '#10b981' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {stats.verifiedOrganizers}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Verified Organizers
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* View Approved Organizers Button */}
        <Button
          fullWidth
          variant="contained"
          startIcon={<VerifiedUser />}
          onClick={() => setShowApprovedOrganizersDialog(true)}
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            py: 1.75,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 3,
            mb: 3,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            '&:hover': {
              bgcolor: '#059669',
            },
          }}
        >
          View Approved Organizers List
        </Button>

        {/* Pending Verification Requests Section */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Pending Verification Requests
            </Typography>
            <Box
              sx={{
                bgcolor: '#f3e8ff',
                color: '#7c3aed',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {stats.pendingRequests} Pending
            </Box>
          </Box>

          {/* Pending Requests List */}
          {pendingRequests.length === 0 ? (
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  No pending verification requests
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingRequests.map((request) => (
                <Card
                  key={request.id}
                  sx={{
                    borderRadius: 4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: '#7c3aed',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                        }}
                      >
                        {request.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                          {request.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {request.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {request.experience || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {formatDate(request.createdAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleViewDetails(request)}
                      sx={{
                        bgcolor: '#7c3aed',
                        color: 'white',
                        py: 1.5,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 3,
                        '&:hover': {
                          bgcolor: '#6d28d9',
                        },
                      }}
                    >
                      👁️ View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {/* Request Details Dialog */}
      <Dialog
        open={showRequestDetailsDialog}
        onClose={() => setShowRequestDetailsDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Request Details
            </Typography>
            <IconButton
              onClick={() => setShowRequestDetailsDialog(false)}
              size="small"
              sx={{ color: '#64748b' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        {selectedRequest && (
          <DialogContent sx={{ px: 3, py: 2 }}>
            {/* Profile Section */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#7c3aed',
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: '0 auto',
                  mb: 1.5,
                }}
              >
                {selectedRequest.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {selectedRequest.name || 'Unknown'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                {selectedRequest.email || 'No email'}
              </Typography>
            </Box>

            {/* Stats Section */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                bgcolor: '#f8fafc',
                borderRadius: 3,
                p: 2,
                mb: 3,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed', mb: 0.5 }}>
                  4.8
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Trust Score
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4f46e5', mb: 0.5 }}>
                  47
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Total Rides
                </Typography>
              </Box>
            </Box>

            {/* Details List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Phone */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Phone
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {selectedRequest.phone || 'N/A'}
                </Typography>
              </Box>

              {/* Experience */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Experience
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {selectedRequest.experience || 'N/A'}
                </Typography>
              </Box>

              {/* License No. */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  License No.
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {selectedRequest.licenseNumber || 'N/A'}
                </Typography>
              </Box>

              {/* Motorcycle */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Motorcycle
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {selectedRequest.motorcycleModel || 'N/A'}
                </Typography>
              </Box>

              {/* Request Date */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Request Date
                </Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                  {formatDate(selectedRequest.createdAt)}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={handleReject}
            disabled={actionLoading}
            sx={{
              flex: 1,
              color: '#ef4444',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#fef2f2',
              },
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            onClick={handleApprove}
            disabled={actionLoading}
            sx={{
              flex: 1,
              bgcolor: '#10b981',
              color: 'white',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#059669',
              },
            }}
          >
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approved Organizers Dialog */}
      <Dialog
        open={showApprovedOrganizersDialog}
        onClose={() => setShowApprovedOrganizersDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            m: 2,
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Approved Organizers
            </Typography>
            <IconButton
              onClick={() => setShowApprovedOrganizersDialog(false)}
              size="small"
              sx={{ color: '#64748b' }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 2, py: 0 }}>
          {approvedOrganizers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VerifiedUser sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                No approved organizers yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
              {approvedOrganizers.map((organizer) => (
                <Card
                  key={organizer.id}
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: '#10b981',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                        }}
                      >
                        {organizer.name?.charAt(0)?.toUpperCase() || 'O'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, fontSize: '1rem' }}>
                          {organizer.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {organizer.email || 'No email'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          bgcolor: '#d1fae5',
                          color: '#10b981',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <VerifiedUser sx={{ fontSize: 14 }} />
                        Verified
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        sx={{
                          flex: 1,
                          color: '#7c3aed',
                          py: 1,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: '#f3e8ff',
                          },
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        sx={{
                          flex: 1,
                          color: '#ef4444',
                          py: 1,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: '#fef2f2',
                          },
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}