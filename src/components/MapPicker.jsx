import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { LocationOn, MyLocation } from '@mui/icons-material';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

// Default center (Kathmandu, Nepal - change to your location)
const defaultCenter = {
  lat: 27.7172,
  lng: 85.3240,
};

export default function MapPicker({ open, onClose, onSave, initialMeetingPoint, initialDestination }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = useState(null);
  const [selectingFor, setSelectingFor] = useState('meetingPoint');
  const [meetingPoint, setMeetingPoint] = useState(initialMeetingPoint);
  const [destination, setDestination] = useState(initialDestination);
  const [directions, setDirections] = useState(null);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate route when both points are selected
  useEffect(() => {
    if (meetingPoint && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: { lat: meetingPoint.lat, lng: meetingPoint.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
          } else {
            console.error('Directions request failed:', status);
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [meetingPoint, destination]);

  const getShortAddress = (fullAddress) => {
    // Extract just the main place name (first part before comma)
    const parts = fullAddress.split(',');
    return parts[0].trim();
  };

  const handleMapClick = useCallback((e) => {
    const location = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const locationData = {
          address: getShortAddress(results[0].formatted_address),
          fullAddress: results[0].formatted_address,
          lat: location.lat,
          lng: location.lng,
        };

        if (selectingFor === 'meetingPoint') {
          setMeetingPoint(locationData);
        } else {
          setDestination(locationData);
        }
      }
    });
  }, [selectingFor]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map?.panTo(location);

          // Get address for current location
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const locationData = {
                address: getShortAddress(results[0].formatted_address),
                fullAddress: results[0].formatted_address,
                lat: location.lat,
                lng: location.lng,
              };

              if (selectingFor === 'meetingPoint') {
                setMeetingPoint(locationData);
              } else {
                setDestination(locationData);
              }
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your current location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleSave = () => {
    onSave({
      meetingPoint,
      destination,
    });
    onClose();
  };

  if (!isLoaded) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#7c3aed' }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Pick Locations on Map
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Click on the map to select locations
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Toggle between Meeting Point and Destination */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={selectingFor}
            exclusive
            onChange={(e, value) => value && setSelectingFor(value)}
            size="small"
            sx={{ bgcolor: '#f5f5f5' }}
          >
            <ToggleButton value="meetingPoint" sx={{ textTransform: 'none', px: 2 }}>
              <LocationOn sx={{ fontSize: 18, mr: 0.5, color: '#22c55e' }} />
              Meeting Point
            </ToggleButton>
            <ToggleButton value="destination" sx={{ textTransform: 'none', px: 2 }}>
              <LocationOn sx={{ fontSize: 18, mr: 0.5, color: '#ef4444' }} />
              Destination
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            size="small"
            startIcon={<MyLocation />}
            onClick={handleGetCurrentLocation}
            sx={{ textTransform: 'none', color: '#7c3aed' }}
          >
            Use My Location
          </Button>
        </Box>

        {/* Google Map */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={meetingPoint?.lat ? { lat: meetingPoint.lat, lng: meetingPoint.lng } : defaultCenter}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            scrollwheel: true,
          }}
        >
          {/* Show Route/Path if both points selected */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true, // We'll use our custom markers
                polylineOptions: {
                  strokeColor: '#7c3aed',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}

          {/* Meeting Point Marker */}
          {meetingPoint && (
            <Marker
              position={{ lat: meetingPoint.lat, lng: meetingPoint.lng }}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
              }}
              label={{
                text: 'A',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          )}

          {/* Destination Marker */}
          {destination && (
            <Marker
              position={{ lat: destination.lat, lng: destination.lng }}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
              label={{
                text: 'B',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          )}
        </GoogleMap>

        {/* Selected Locations Display */}
        <Box sx={{ mt: 2 }}>
          {meetingPoint && (
            <Box sx={{ mb: 1, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #22c55e' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: '#22c55e' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Meeting Point:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {meetingPoint.address}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {destination && (
            <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #ef4444' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: '#ef4444' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Destination:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {destination.address}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!meetingPoint || !destination}
          sx={{
            bgcolor: '#7c3aed',
            textTransform: 'none',
            px: 3,
            '&:hover': { bgcolor: '#6d28d9' },
          }}
        >
          Save Locations
        </Button>
      </DialogActions>
    </Dialog>
  );
}