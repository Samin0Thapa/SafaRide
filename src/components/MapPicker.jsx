import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
  ToggleButtonGroup, ToggleButton, TextField,
  InputAdornment, List, ListItem, ListItemText, Paper,
} from '@mui/material';
import { LocationOn, MyLocation, Search } from '@mui/icons-material';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = { lat: 27.7172, lng: 85.3240 };
const LIBRARIES = ['places'];

export default function MapPicker({ open, onClose, onSave, initialMeetingPoint, initialDestination }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [selectingFor, setSelectingFor] = useState('meetingPoint');
  const [meetingPoint, setMeetingPoint] = useState(initialMeetingPoint);
  const [destination, setDestination] = useState(initialDestination);
  const [directions, setDirections] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceRef = useRef(null);

  const onLoad = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  useEffect(() => {
    setSearchText('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [selectingFor]);

  useEffect(() => {
    if (meetingPoint && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: meetingPoint.lat, lng: meetingPoint.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => setDirections(status === 'OK' ? result : null)
      );
    } else {
      setDirections(null);
    }
  }, [meetingPoint, destination]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places');
        const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
        });
        setSuggestions(result.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    }, 300);
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });

      const locationData = {
        address: place.displayName || place.formattedAddress.split(',')[0].trim(),
        fullAddress: place.formattedAddress,
        lat: place.location.lat(),
        lng: place.location.lng(),
      };

      if (selectingFor === 'meetingPoint') setMeetingPoint(locationData);
      else setDestination(locationData);

      map?.panTo({ lat: locationData.lat, lng: locationData.lng });
      map?.setZoom(15);

      setSearchText(locationData.address);
      setSuggestions([]);
      setShowDropdown(false);
    } catch (err) {
      console.error('Place fetch error:', err);
    }
  };

  const getShortAddress = (fullAddress) => fullAddress.split(',')[0].trim();

  const handleMapClick = useCallback((e) => {
    const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const locationData = {
          address: getShortAddress(results[0].formatted_address),
          fullAddress: results[0].formatted_address,
          lat: location.lat,
          lng: location.lng,
        };
        if (selectingFor === 'meetingPoint') setMeetingPoint(locationData);
        else setDestination(locationData);
      }
    });
  }, [selectingFor]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        map?.panTo(location);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const locationData = {
              address: getShortAddress(results[0].formatted_address),
              fullAddress: results[0].formatted_address,
              lat: location.lat,
              lng: location.lng,
            };
            if (selectingFor === 'meetingPoint') setMeetingPoint(locationData);
            else setDestination(locationData);
          }
        });
      },
      () => alert('Could not get your current location')
    );
  };

  const handleSave = () => {
    onSave({ meetingPoint, destination });
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
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Pick Locations on Map</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Search or click on the map to select locations
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Toggle */}
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

        {/* Search bar with dropdown */}
        <Box sx={{ position: 'relative', mb: 2, zIndex: 1300 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={selectingFor === 'meetingPoint' ? 'Search meeting point...' : 'Search destination...'}
            value={searchText}
            onChange={handleSearchChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'white',
                '&.Mui-focused fieldset': {
                  borderColor: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444',
                },
              },
            }}
          />

          {/* Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <Paper
              elevation={6}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1400,
                maxHeight: '220px',
                overflowY: 'auto',
                borderRadius: 2,
                mt: 0.5,
                border: '1px solid #e2e8f0',
              }}
            >
              <List dense disablePadding>
                {suggestions.map((suggestion, index) => {
                  const pred = suggestion.placePrediction;
                  return (
                    <ListItem
                      key={index}
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                      sx={{
                        py: 1,
                        px: 2,
                        cursor: 'pointer',
                        borderBottom: index < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                        '&:hover': { bgcolor: '#f8f5ff' },
                      }}
                    >
                      <LocationOn
                        sx={{
                          fontSize: 18,
                          color: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444',
                          mr: 1,
                          flexShrink: 0,
                        }}
                      />
                      <ListItemText
                        primary={pred.mainText?.toString() || ''}
                        secondary={pred.secondaryText?.toString() || ''}
                        primaryTypographyProps={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
                        secondaryTypographyProps={{ fontSize: '12px', color: '#94a3b8' }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          )}
        </Box>

        {/* Map */}
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
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: { strokeColor: '#7c3aed', strokeWeight: 5, strokeOpacity: 0.8 },
              }}
            />
          )}
          {meetingPoint && (
            <Marker
              position={{ lat: meetingPoint.lat, lng: meetingPoint.lng }}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
              label={{ text: 'A', color: 'white', fontWeight: 'bold' }}
            />
          )}
          {destination && (
            <Marker
              position={{ lat: destination.lat, lng: destination.lng }}
              icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
              label={{ text: 'B', color: 'white', fontWeight: 'bold' }}
            />
          )}
        </GoogleMap>

        {/* Selected locations */}
        <Box sx={{ mt: 2 }}>
          {meetingPoint && (
            <Box sx={{ mb: 1, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #22c55e' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: '#22c55e' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Meeting Point:</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{meetingPoint.address}</Typography>
                </Box>
              </Box>
            </Box>
          )}
          {destination && (
            <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #ef4444' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 20, color: '#ef4444' }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Destination:</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{destination.address}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!meetingPoint || !destination}
          sx={{ bgcolor: '#7c3aed', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#6d28d9' } }}
        >
          Save Locations
        </Button>
      </DialogActions>
    </Dialog>
  );
}