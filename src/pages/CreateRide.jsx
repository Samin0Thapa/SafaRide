import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import MapPicker from '../components/MapPicker';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Map as MapIcon,
  AddCircleOutline,
  CheckCircle,
} from '@mui/icons-material';

export default function CreateRide() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [formData, setFormData] = useState({
    title: '',
    meetingPoint: '',
    destination: '',
    date: '',
    time: '',
    duration: '',
    rideType: 'Short Ride',
    description: '',
  });
  const [locationData, setLocationData] = useState({
    meetingPoint: null,
    destination: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const rideTypes = [
    'Short Ride',
    'Long Ride',
    'Mountain Ride',
    'City Tour',
    'Highway Cruise',
    'Off-Road Adventure',
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handlePickOnMap = () => {
    setShowMapPicker(true);
  };

  const handleMapSave = (locations) => {
    setLocationData(locations);
    setFormData({
      ...formData,
      meetingPoint: locations.meetingPoint?.address || '',
      destination: locations.destination?.address || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.meetingPoint || !formData.destination || 
        !formData.date || !formData.time || !formData.duration) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a ride');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create ride document in Firestore
      const rideData = {
        title: formData.title,
        meetingPoint: formData.meetingPoint,
        destination: formData.destination,
        // Store coordinates if available
        meetingPointCoords: locationData.meetingPoint ? {
          lat: locationData.meetingPoint.lat,
          lng: locationData.meetingPoint.lng,
        } : null,
        destinationCoords: locationData.destination ? {
          lat: locationData.destination.lat,
          lng: locationData.destination.lng,
        } : null,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        rideType: formData.rideType,
        description: formData.description,
        createdBy: user.uid,
        createdByName: user.displayName || 'Anonymous',
        createdByEmail: user.email,
        participants: [user.uid],
        status: 'upcoming',
        createdAt: serverTimestamp(),
        maxParticipants: 10,
      };

      const docRef = await addDoc(collection(db, 'rides'), rideData);
      
      console.log('Ride created successfully with ID:', docRef.id);
      
      // Show success dialog
      setShowSuccessDialog(true);
      
    } catch (error) {
      console.error('Error creating ride:', error);
      setError('Failed to create ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'white',
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
        }}
      >
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{ color: 'white', mr: 2 }}
          disabled={loading}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Create New Ride
        </Typography>
      </Box>

      {/* Content */}
      <Container maxWidth="sm" sx={{ py: 3, px: 2, bgcolor: 'white', minHeight: 'calc(100vh - 64px)' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Ride Title */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
              Ride Title
            </Typography>
            <TextField
              fullWidth
              name="title"
              placeholder="e.g., Weekend Mountain Ride"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Meeting Point */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
              Meeting Point
            </Typography>
            <TextField
              fullWidth
              name="meetingPoint"
              placeholder="Enter location or pick on map"
              value={formData.meetingPoint}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: '#22c55e' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Destination */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
              Destination
            </Typography>
            <TextField
              fullWidth
              name="destination"
              placeholder="Enter destination or pick on map"
              value={formData.destination}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn sx={{ color: '#ef4444' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Pick on Map Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              onClick={handlePickOnMap}
              disabled={loading}
              sx={{
                bgcolor: '#7c3aed',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#6d28d9',
                },
              }}
            >
              Pick on Map
            </Button>
          </Box>

          {/* Date and Time */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Date
              </Typography>
              <TextField
                fullWidth
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                sx={{
                  bgcolor: '#f5f5f5',
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Time
              </Typography>
              <TextField
                fullWidth
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
                sx={{
                  bgcolor: '#f5f5f5',
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Box>
          </Box>

          {/* Duration and Ride Type */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Duration
              </Typography>
              <TextField
                fullWidth
                name="duration"
                placeholder="e.g., 3 hours"
                value={formData.duration}
                onChange={handleChange}
                disabled={loading}
                sx={{
                  bgcolor: '#f5f5f5',
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                Ride Type
              </Typography>
              <TextField
                fullWidth
                select
                name="rideType"
                value={formData.rideType}
                onChange={handleChange}
                disabled={loading}
                sx={{
                  bgcolor: '#f5f5f5',
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              >
                {rideTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
              Description (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="description"
              placeholder="Add details about the ride, stops, difficulty level..."
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Create Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={loading ? null : <AddCircleOutline />}
            disabled={loading}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              py: 1.75,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 3,
              mb: 3,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
              '&:disabled': {
                bgcolor: '#cbd5e1',
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Ride'}
          </Button>
        </Box>
      </Container>

      {/* Map Picker Dialog */}
      <MapPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSave={handleMapSave}
        initialMeetingPoint={locationData.meetingPoint}
        initialDestination={locationData.destination}
      />

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 2,
            py: 1,
            maxWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: 50, color: '#22c55e' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Ride Created!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            Your ride has been successfully created.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Other riders can now see and join your ride!
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCloseSuccessDialog}
            sx={{
              bgcolor: '#7c3aed',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            Back to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}