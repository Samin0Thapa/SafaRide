import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { sendNotification } from '../services/notifications';
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
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  DirectionsBike,
  Schedule,
  VerifiedUser,
  Logout,
  Close,
  CalendarToday,
  CheckCircle,
  Cancel,
  ArrowForward,
  LocationOn,
  AccessTime,
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
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showRequestDetailsDialog, setShowRequestDetailsDialog] = useState(false);
  const [showApprovedOrganizersDialog, setShowApprovedOrganizersDialog] = useState(false);
  const [showOrganizerDetailsDialog, setShowOrganizerDetailsDialog] = useState(false);
  const [showRidesDialog, setShowRidesDialog] = useState(false);
  const [showRideDetailsDialog, setShowRideDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [ridesTab, setRidesTab] = useState(0); // 0 = upcoming, 1 = completed
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      const ridesSnapshot = await getDocs(collection(db, 'rides'));
      const totalRides = ridesSnapshot.size;

      // Separate upcoming and completed rides
      const upcoming = [];
      const completed = [];
      ridesSnapshot.forEach((d) => {
        const ride = { id: d.id, ...d.data() };
        if (ride.status === 'completed') completed.push(ride);
        else if (ride.status === 'upcoming' || ride.status === 'ongoing') upcoming.push(ride);
      });
      setUpcomingRides(upcoming);
      setCompletedRides(completed);

      const pendingQuery = query(
        collection(db, 'verificationRequests'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingRequestsData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const organizersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'organizer')
      );
      const organizersSnapshot = await getDocs(organizersQuery);
      const organizersData = organizersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStats({
        totalUsers,
        totalRides,
        pendingRequests: pendingRequestsData.length,
        verifiedOrganizers: organizersSnapshot.size,
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
      await updateDoc(doc(db, 'verificationRequests', selectedRequest.id), {
        status: 'approved',
        approvedAt: new Date(),
      });
      await updateDoc(doc(db, 'users', selectedRequest.userId), {
        role: 'organizer',
        verified: true,
      });
      await sendNotification(
        selectedRequest.userId,
        'verification_approved',
        '✅ Verification Approved!',
        'Congratulations! Your organizer verification has been approved. You can now create rides.',
        null
      );
      await fetchDashboardData();
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
      await updateDoc(doc(db, 'verificationRequests', selectedRequest.id), {
        status: 'rejected',
        rejectedAt: new Date(),
      });
      await sendNotification(
        selectedRequest.userId,
        'verification_rejected',
        '❌ Verification Rejected',
        'Your organizer verification request was rejected. You can reapply with updated documents.',
        null
      );
      await fetchDashboardData();
      setShowRequestDetailsDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveOrganizer = async (organizer) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', organizer.id), {
        role: 'rider',
        verified: false,
      });
      await fetchDashboardData();
      setShowApprovedOrganizersDialog(false);
      setShowOrganizerDetailsDialog(false);
      setSelectedOrganizer(null);
    } catch (error) {
      console.error('Error removing organizer:', error);
      alert('Failed to remove organizer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 3 }}>

      {/* Purple Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', borderRadius: '0 0 30px 30px', px: 3, pt: 3, pb: 6, color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Admin Dashboard</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>SafaRide Management Portal</Typography>
          </Box>
          <IconButton onClick={handleLogout} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
            <Logout />
          </IconButton>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <Person sx={{ fontSize: 26, color: '#4f46e5' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{stats.totalUsers.toLocaleString()}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Total Users</Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <DirectionsBike sx={{ fontSize: 26, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{stats.totalRides.toLocaleString()}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Total Rides</Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <Schedule sx={{ fontSize: 26, color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{stats.pendingRequests}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Pending Requests</Typography>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: '50%', bgcolor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <VerifiedUser sx={{ fontSize: 26, color: '#10b981' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{stats.verifiedOrganizers}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>Verified Organizers</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* View Approved Organizers Button */}
        <Button
          fullWidth variant="contained" startIcon={<VerifiedUser />}
          onClick={() => setShowApprovedOrganizersDialog(true)}
          sx={{ bgcolor: '#10b981', color: 'white', py: 1.75, fontSize: '1rem', fontWeight: 600, textTransform: 'none', borderRadius: 3, mb: 2, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', '&:hover': { bgcolor: '#059669' } }}
        >
          View Approved Organizers
        </Button>

        {/* View Rides Button */}
        <Button
          fullWidth variant="contained" startIcon={<DirectionsBike />}
          onClick={() => setShowRidesDialog(true)}
          sx={{ bgcolor: '#7c3aed', color: 'white', py: 1.75, fontSize: '1rem', fontWeight: 600, textTransform: 'none', borderRadius: 3, mb: 3, boxShadow: '0 4px 12px rgba(124,58,237,0.3)', '&:hover': { bgcolor: '#6d28d9' } }}
        >
          View Upcoming & Completed Rides
        </Button>

        {/* Pending Verification Requests */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Pending Verification Requests</Typography>
            <Box sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', px: 2, py: 0.5, borderRadius: 2, fontSize: '0.85rem', fontWeight: 600 }}>
              {stats.pendingRequests} Pending
            </Box>
          </Box>

          {pendingRequests.length === 0 ? (
            <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#64748b' }}>No pending verification requests</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingRequests.map((request) => (
                <Card key={request.id} sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: '#7c3aed', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>
                        {request.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.25, fontSize: '1rem' }}>
                          {request.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', wordBreak: 'break-all' }}>
                          {request.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{request.experience || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(request.createdAt)}</Typography>
                      </Box>
                    </Box>
                    <Button fullWidth variant="contained" onClick={() => handleViewDetails(request)}
                      sx={{ bgcolor: '#7c3aed', color: 'white', py: 1.5, fontSize: '0.95rem', fontWeight: 600, textTransform: 'none', borderRadius: 3, '&:hover': { bgcolor: '#6d28d9' } }}>
                      👁️ View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>

      {/* ── REQUEST DETAILS DIALOG ── */}
      <Dialog open={showRequestDetailsDialog} onClose={() => setShowRequestDetailsDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Request Details</Typography>
            <IconButton onClick={() => setShowRequestDetailsDialog(false)} size="small" sx={{ color: '#64748b' }}><Close /></IconButton>
          </Box>
        </DialogTitle>

        {selectedRequest && (
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#7c3aed', fontSize: '2rem', fontWeight: 700, margin: '0 auto', mb: 1.5 }}>
                {selectedRequest.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{selectedRequest.name || 'Unknown'}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', wordBreak: 'break-all', px: 1 }}>{selectedRequest.email || 'No email'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', bgcolor: '#f8fafc', borderRadius: 3, p: 2, mb: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed', mb: 0.5 }}>4.8</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Trust Score</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4f46e5', mb: 0.5 }}>47</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Rides</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Phone', value: selectedRequest.phone },
                { label: 'Experience', value: selectedRequest.experience },
                { label: 'License No.', value: selectedRequest.licenseNumber },
                { label: 'Motorcycle', value: selectedRequest.motorcycleModel },
                { label: 'Request Date', value: formatDate(selectedRequest.createdAt) },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', flexShrink: 0 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{item.value || 'N/A'}</Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button onClick={handleReject} disabled={actionLoading}
            sx={{ flex: 1, color: '#ef4444', py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#fef2f2' } }}>
            Reject
          </Button>
          <Button variant="contained" onClick={handleApprove} disabled={actionLoading}
            sx={{ flex: 1, bgcolor: '#10b981', color: 'white', py: 1.5, fontSize: '1rem', fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#059669' } }}>
            {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── APPROVED ORGANIZERS DIALOG ── */}
      <Dialog open={showApprovedOrganizersDialog} onClose={() => setShowApprovedOrganizersDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2, maxHeight: '80vh' } }}>
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Approved Organizers</Typography>
            <IconButton onClick={() => setShowApprovedOrganizersDialog(false)} size="small" sx={{ color: '#64748b' }}><Close /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 0 }}>
          {approvedOrganizers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <VerifiedUser sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748b' }}>No approved organizers yet</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 2 }}>
              {approvedOrganizers.map((organizer) => (
                <Card key={organizer.id} sx={{ borderRadius: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Fixed layout — no more cut-off badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Avatar sx={{ width: 48, height: 48, bgcolor: '#10b981', fontSize: '1.3rem', fontWeight: 700, flexShrink: 0 }}>
                        {organizer.name?.charAt(0)?.toUpperCase() || 'O'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                          {organizer.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {organizer.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Verified badge on its own row — never gets cut off */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#d1fae5', color: '#10b981', px: 1.5, py: 0.5, borderRadius: 2, mb: 1.5, width: 'fit-content' }}>
                      <VerifiedUser sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Verified Organizer</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" onClick={() => { setSelectedOrganizer(organizer); setShowOrganizerDetailsDialog(true); }}
                        sx={{ flex: 1, color: '#7c3aed', py: 1, fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#f3e8ff' } }}>
                        View Details
                      </Button>
                      <Button size="small" disabled={actionLoading} onClick={() => handleRemoveOrganizer(organizer)}
                        sx={{ flex: 1, color: '#ef4444', py: 1, fontSize: '0.85rem', fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#fef2f2' } }}>
                        {actionLoading ? <CircularProgress size={16} color="inherit" /> : 'Remove'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ORGANIZER DETAILS DIALOG ── */}
      <Dialog open={showOrganizerDetailsDialog} onClose={() => setShowOrganizerDetailsDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Organizer Details</Typography>
            <IconButton onClick={() => setShowOrganizerDetailsDialog(false)} size="small" sx={{ color: '#64748b' }}><Close /></IconButton>
          </Box>
        </DialogTitle>

        {selectedOrganizer && (
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#10b981', fontSize: '2rem', fontWeight: 700, margin: '0 auto', mb: 1.5 }}>
                {selectedOrganizer.name?.charAt(0)?.toUpperCase() || 'O'}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{selectedOrganizer.name || 'Unknown'}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', wordBreak: 'break-all', px: 1 }}>{selectedOrganizer.email || 'No email'}</Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#d1fae5', color: '#10b981', px: 2, py: 0.5, borderRadius: 2, fontSize: '0.8rem', fontWeight: 600, mt: 1 }}>
                <VerifiedUser sx={{ fontSize: 14 }} />
                Verified Organizer
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-around', bgcolor: '#f8fafc', borderRadius: 3, p: 2, mb: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed', mb: 0.5 }}>{selectedOrganizer.rating || 'N/A'}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Trust Score</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4f46e5', mb: 0.5 }}>{selectedOrganizer.totalReviews || 0}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Total Reviews</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Email', value: selectedOrganizer.email },
                { label: 'Role', value: selectedOrganizer.role },
                { label: 'Member Since', value: formatDate(selectedOrganizer.createdAt) },
                { label: 'Verified', value: '✓ Yes' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', flexShrink: 0 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ color: item.label === 'Verified' ? '#10b981' : '#1e293b', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{item.value || 'N/A'}</Typography>
                </Box>
              ))}
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button fullWidth variant="contained" onClick={() => setShowOrganizerDetailsDialog(false)}
            sx={{ bgcolor: '#7c3aed', py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── RIDES DIALOG (Upcoming + Completed tabs) ── */}
      <Dialog open={showRidesDialog} onClose={() => setShowRidesDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2, maxHeight: '85vh' } }}>
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Rides</Typography>
            <IconButton onClick={() => setShowRidesDialog(false)} size="small" sx={{ color: '#64748b' }}><Close /></IconButton>
          </Box>
          <Tabs
            value={ridesTab}
            onChange={(e, val) => setRidesTab(val)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
              '& .Mui-selected': { color: '#7c3aed' },
              '& .MuiTabs-indicator': { backgroundColor: '#7c3aed', height: 3 },
            }}
          >
            <Tab label={`Upcoming (${upcomingRides.length})`} />
            <Tab label={`Completed (${completedRides.length})`} />
          </Tabs>
        </DialogTitle>

        <DialogContent sx={{ px: 2, py: 2 }}>
          {(() => {
            const rides = ridesTab === 0 ? upcomingRides : completedRides;
            if (rides.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <DirectionsBike sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    {ridesTab === 0 ? 'No upcoming rides' : 'No completed rides'}
                  </Typography>
                </Box>
              );
            }
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {rides.map((ride) => (
                  <Card key={ride.id} sx={{ borderRadius: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: ridesTab === 0 ? '1px solid #e9d5ff' : '1px solid #d1fae5' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', flex: 1, mr: 1 }}>
                          {ride.title || 'Untitled Ride'}
                        </Typography>
                        <Chip
                          label={ride.status === 'ongoing' ? 'LIVE' : ride.status}
                          size="small"
                          sx={{
                            bgcolor: ride.status === 'ongoing' ? '#10b981' : ride.status === 'completed' ? '#d1fae5' : '#f3e8ff',
                            color: ride.status === 'ongoing' ? 'white' : ride.status === 'completed' ? '#059669' : '#7c3aed',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <LocationOn sx={{ fontSize: 14, color: '#7c3aed' }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                          {ride.meetingPoint} → {ride.destination}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{ride.date}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{formatTime(ride.time)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{ride.participants?.length || 0} riders</Typography>
                        </Box>
                      </Box>

                      <Button
                        fullWidth size="small" variant="outlined"
                        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                        onClick={() => { setSelectedRide(ride); setShowRideDetailsDialog(true); }}
                        sx={{ color: '#7c3aed', borderColor: '#7c3aed', textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.85rem', '&:hover': { bgcolor: '#f3e8ff', borderColor: '#6d28d9' } }}
                      >
                        View Full Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── RIDE DETAILS DIALOG ── */}
      <Dialog open={showRideDetailsDialog} onClose={() => setShowRideDetailsDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, m: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Ride Details</Typography>
            <IconButton onClick={() => setShowRideDetailsDialog(false)} size="small" sx={{ color: '#64748b' }}><Close /></IconButton>
          </Box>
        </DialogTitle>

        {selectedRide && (
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 1.5 }}>
                <DirectionsBike sx={{ fontSize: 36, color: '#7c3aed' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>{selectedRide.title}</Typography>
              <Chip
                label={selectedRide.status}
                size="small"
                sx={{
                  bgcolor: selectedRide.status === 'completed' ? '#d1fae5' : selectedRide.status === 'ongoing' ? '#10b981' : '#f3e8ff',
                  color: selectedRide.status === 'completed' ? '#059669' : selectedRide.status === 'ongoing' ? 'white' : '#7c3aed',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { label: 'Organizer', value: selectedRide.createdByName },
                { label: 'Meeting Point', value: selectedRide.meetingPoint },
                { label: 'Destination', value: selectedRide.destination },
                { label: 'Date', value: selectedRide.date },
                { label: 'Time', value: formatTime(selectedRide.time) },
                { label: 'Duration', value: selectedRide.duration },
                { label: 'Ride Type', value: selectedRide.rideType },
                { label: 'Participants', value: `${selectedRide.participants?.length || 0} riders` },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', flexShrink: 0 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, textAlign: 'right' }}>{item.value || 'N/A'}</Typography>
                </Box>
              ))}

              {selectedRide.description && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>Description</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, lineHeight: 1.5 }}>
                    {selectedRide.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button fullWidth variant="contained" onClick={() => setShowRideDetailsDialog(false)}
            sx={{ bgcolor: '#7c3aed', py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}