import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress,
  ToggleButtonGroup, ToggleButton, TextField,
  InputAdornment, List, ListItem, ListItemText, Paper,
} from '@mui/material';
import { LocationOn, MyLocation, Search } from '@mui/icons-material';

// Fix default marker icons for Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Green marker for meeting point
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker for destination
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultCenter = [27.7172, 85.3240]; // Kathmandu

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to update map center
function MapController({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center]);
  return null;
}

export default function MapPicker({ open, onClose, onSave, initialMeetingPoint, initialDestination }) {
  const [selectingFor, setSelectingFor] = useState('meetingPoint');
  const [meetingPoint, setMeetingPoint] = useState(initialMeetingPoint || null);
  const [destination, setDestination] = useState(initialDestination || null);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setSearchText('');
    setSuggestions([]);
    setShowDropdown(false);
  }, [selectingFor]);

  // Search using Nominatim (OpenStreetMap free search)
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
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&countrycodes=np&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSuggestionClick = (suggestion) => {
    const locationData = {
      address: suggestion.display_name.split(',')[0].trim(),
      fullAddress: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };

    if (selectingFor === 'meetingPoint') {
      setMeetingPoint(locationData);
    } else {
      setDestination(locationData);
    }

    setMapCenter([locationData.lat, locationData.lng]);
    setSearchText(locationData.address);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Handle map click — reverse geocode using Nominatim
  const handleMapClick = async (latlng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      const locationData = {
        address: data.display_name.split(',')[0].trim(),
        fullAddress: data.display_name,
        lat: latlng.lat,
        lng: latlng.lng,
      };

      if (selectingFor === 'meetingPoint') {
        setMeetingPoint(locationData);
      } else {
        setDestination(locationData);
      }
    } catch (err) {
      // If reverse geocode fails just store coordinates
      const locationData = {
        address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
        fullAddress: `${latlng.lat}, ${latlng.lng}`,
        lat: latlng.lat,
        lng: latlng.lng,
      };
      if (selectingFor === 'meetingPoint') {
        setMeetingPoint(locationData);
      } else {
        setDestination(locationData);
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const locationData = {
            address: data.display_name.split(',')[0].trim(),
            fullAddress: data.display_name,
            lat,
            lng,
          };
          if (selectingFor === 'meetingPoint') {
            setMeetingPoint(locationData);
          } else {
            setDestination(locationData);
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
        }
      },
      () => alert('Could not get your current location')
    );
  };

  const handleSave = () => {
    onSave({ meetingPoint, destination });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Pick Locations on Map</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Search or tap on the map to select locations
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Toggle */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
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
            size="small" startIcon={<MyLocation />}
            onClick={handleGetCurrentLocation}
            sx={{ textTransform: 'none', color: '#7c3aed' }}
          >
            Use My Location
          </Button>
        </Box>

        {/* Search bar */}
        <Box sx={{ position: 'relative', mb: 2, zIndex: 1300 }}>
          <TextField
            fullWidth size="small"
            placeholder={selectingFor === 'meetingPoint' ? 'Search meeting point in Nepal...' : 'Search destination in Nepal...'}
            value={searchText}
            onChange={handleSearchChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {searchLoading
                    ? <CircularProgress size={18} sx={{ color: '#7c3aed' }} />
                    : <Search sx={{ color: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444', fontSize: 20 }} />
                  }
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, bgcolor: 'white',
                '&.Mui-focused fieldset': { borderColor: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444' },
              },
            }}
          />

          {/* Search dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <Paper elevation={6} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1400, maxHeight: '220px', overflowY: 'auto', borderRadius: 2, mt: 0.5, border: '1px solid #e2e8f0' }}>
              <List dense disablePadding>
                {suggestions.map((suggestion, index) => (
                  <ListItem
                    key={suggestion.place_id}
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                    sx={{ py: 1, px: 2, cursor: 'pointer', borderBottom: index < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none', '&:hover': { bgcolor: '#f8f5ff' } }}
                  >
                    <LocationOn sx={{ fontSize: 18, color: selectingFor === 'meetingPoint' ? '#22c55e' : '#ef4444', mr: 1, flexShrink: 0 }} />
                    <ListItemText
                      primary={suggestion.display_name.split(',')[0]}
                      secondary={suggestion.display_name.split(',').slice(1, 3).join(',')}
                      primaryTypographyProps={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}
                      secondaryTypographyProps={{ fontSize: '12px', color: '#94a3b8' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Map */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ width: '100%', height: '380px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {mapCenter && <MapController center={mapCenter} />}

            {meetingPoint && (
              <Marker position={[meetingPoint.lat, meetingPoint.lng]} icon={greenIcon}>
                <Popup>
                  <strong>Meeting Point</strong><br />{meetingPoint.address}
                </Popup>
              </Marker>
            )}

            {destination && (
              <Marker position={[destination.lat, destination.lng]} icon={redIcon}>
                <Popup>
                  <strong>Destination</strong><br />{destination.address}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>

        {/* Selected locations */}
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {meetingPoint && (
            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #22c55e', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: 20, color: '#22c55e', flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Meeting Point</Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{meetingPoint.address}</Typography>
              </Box>
            </Box>
          )}
          {destination && (
            <Box sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: 20, color: '#ef4444', flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Destination</Typography>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>{destination.address}</Typography>
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
          sx={{ bgcolor: '#7c3aed', textTransform: 'none', px: 3, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' }, '&:disabled': { bgcolor: '#cbd5e1' } }}
        >
          Save Locations
        </Button>
      </DialogActions>
    </Dialog>
  );
}