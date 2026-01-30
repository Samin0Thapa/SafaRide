import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  MyLocation,
} from '@mui/icons-material';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '12px',
};

export default function RouteMapViewer({ open, onClose, meetingPoint, destination, meetingPointCoords, destinationCoords }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [map, setMap] = useState(null);
  const [directions, setDirections] = useState(null);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calculate route when dialog opens
  useEffect(() => {
    if (open && meetingPointCoords && destinationCoords && isLoaded) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: { lat: meetingPointCoords.lat, lng: meetingPointCoords.lng },
          destination: { lat: destinationCoords.lat, lng: destinationCoords.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            setDirections(result);
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );
    }
  }, [open, meetingPointCoords, destinationCoords, isLoaded]);

  // Center map to show both markers
  useEffect(() => {
    if (map && meetingPointCoords && destinationCoords) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: meetingPointCoords.lat, lng: meetingPointCoords.lng });
      bounds.extend({ lat: destinationCoords.lat, lng: destinationCoords.lng });
      map.fitBounds(bounds);
    }
  }, [map, meetingPointCoords, destinationCoords]);

  const handleCenterMap = () => {
    if (map && meetingPointCoords && destinationCoords) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: meetingPointCoords.lat, lng: meetingPointCoords.lng });
      bounds.extend({ lat: destinationCoords.lat, lng: destinationCoords.lng });
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#7c3aed' }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // Default center if no coordinates
  const defaultCenter = meetingPointCoords || { lat: 27.7172, lng: 85.3240 };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 3 }}>
        {/* Header with Center Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Route Map
          </Typography>
          <Button
            onClick={handleCenterMap}
            size="small"
            startIcon={<MyLocation />}
            sx={{
              textTransform: 'none',
              color: '#7c3aed',
              fontWeight: 600,
            }}
          >
            Center
          </Button>
        </Box>

        {/* Google Map */}
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            scrollwheel: true,
          }}
        >
          {/* Show Route/Path */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#7c3aed',
                  strokeWeight: 6,
                  strokeOpacity: 0.8,
                },
              }}
            />
          )}

          {/* Meeting Point Marker */}
          {meetingPointCoords && (
            <Marker
              position={{ lat: meetingPointCoords.lat, lng: meetingPointCoords.lng }}
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
          {destinationCoords && (
            <Marker
              position={{ lat: destinationCoords.lat, lng: destinationCoords.lng }}
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

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#7c3aed',
            py: 1.5,
            mt: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { bgcolor: '#6d28d9' },
          }}
        >
          Close
        </Button>
      </Box>
    </Dialog>
  );
}