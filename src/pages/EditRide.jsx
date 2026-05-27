import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  Save,
  CheckCircle,
} from '@mui/icons-material';

export default function EditRide() {
  const navigate = useNavigate();
  const { rideId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [ride, setRide] = useState(null);

  const rideTypes = [
    'Short Ride',
    'Long Ride',
    'Mountain Ride',
    'City Tour',
    'Highway Cruise',
    'Off-Road Adventure',
  ];

  // Fetch ride details on mount
  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        const rideDoc = await getDoc(doc(db, 'rides', rideId));
        if (rideDoc.exists()) {
          const rideData = rideDoc.data();

          // Check if current user is the organizer
          if (rideData.createdBy !== user?.uid) {
            setError('You do not have permission to edit this ride.');
            return;
          }

          setRide(rideData);
          setFormData({
            title: rideData.title,
            meetingPoint: rideData.meetingPoint,
            destination: rideData.destination,
            date: rideData.date,
            time: rideData.time,
            duration: rideData.duration,
            rideType: rideData.rideType,
            description: rideData.description || '',
          });

          // Set location data if available
          if (rideData.meetingPointCoords && rideData.destinationCoords) {
            setLocationData({
              meetingPoint: {
                lat: rideData.meetingPointCoords.lat,
                lng: rideData.meetingPointCoords.lng,
                address: rideData.meetingPoint,
              },
              destination: {
                lat: rideData.destinationCoords.lat,
                lng: rideData.destinationCoords.lng,
                address: rideData.destination,
              },
            });
          }
        } else {
          setError('Ride not found.');
        }
      } catch (error) {
        console.error('Error fetching ride:', error);
        setError('Failed to load ride details.');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId, user?.uid]);

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

    // Past date check (only if date was actually changed to past)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Ride date cannot be in the past. Please select a future date.');
      return;
    }

    if (!user) {
      setError('You must be logged in to edit a ride');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Update ride document in Firestore
      const updateData = {
        title: formData.title,
        meetingPoint: formData.meetingPoint,
        destination: formData.destination,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        rideType: formData.rideType,
        description: formData.description,
      };

      // Add coordinates if available
      if (locationData.meetingPoint) {
        updateData.meetingPointCoords = {
          lat: locationData.meetingPoint.lat,
          lng: locationData.meetingPoint.lng,
        };
      }
      if (locationData.destination) {
        updateData.destinationCoords = {
          lat: locationData.destination.lat,
          lng: locationData.destination.lng,
        };
      }

      await updateDoc(doc(db, 'rides', rideId), updateData);

      console.log('Ride updated successfully');

      // Show success dialog
      setShowSuccessDialog(true);

    } catch (error) {
      console.error('Error updating ride:', error);
      setError('Failed to update ride. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    navigate(`/ride-details/${rideId}`);
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
          onClick={() => navigate(`/ride-details/${rideId}`)}
          sx={{ color: 'white', mr: 2 }}
          disabled={saving}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Edit Ride
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              Update Map
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
                disabled={saving}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
              disabled={saving}
              sx={{
                bgcolor: '#f5f5f5',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Save Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={saving ? null : <Save />}
            disabled={saving}
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
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
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
            Ride Updated!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            Your ride details have been successfully updated.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            All participants will be notified of the changes.
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
            Back to Ride Details
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
