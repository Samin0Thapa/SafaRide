import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { MyLocation } from '@mui/icons-material';

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

// Blue marker for the participant's current location
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit map bounds around all relevant markers
function FitBounds({ meetingPointCoords, destinationCoords, myLocation }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (meetingPointCoords) points.push([meetingPointCoords.lat, meetingPointCoords.lng]);
    if (destinationCoords) points.push([destinationCoords.lat, destinationCoords.lng]);
    if (myLocation) points.push([myLocation.lat, myLocation.lng]);
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [meetingPointCoords, destinationCoords, myLocation]);
  return null;
}

export default function RouteMapViewer({
  open,
  onClose,
  meetingPoint,
  destination,
  meetingPointCoords,
  destinationCoords,
}) {
  const [routePoints, setRoutePoints] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // "Your route to meetup" state
  const [myLocation, setMyLocation] = useState(null);
  const [myRoutePoints, setMyRoutePoints] = useState([]);
  const [loadingMyRoute, setLoadingMyRoute] = useState(false);
  const [myRouteError, setMyRouteError] = useState('');

  // Fetch route from OSRM (free routing service)
  useEffect(() => {
    if (open && meetingPointCoords && destinationCoords) {
      fetchRoute();
    }
  }, [open, meetingPointCoords, destinationCoords]);

  // Reset the "your route" state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setMyLocation(null);
      setMyRoutePoints([]);
      setMyRouteError('');
      setLoadingMyRoute(false);
    }
  }, [open]);

  // Capture current GPS position, then fetch the route from there to the meeting point
  const handleShowMyRoute = () => {
    setMyRouteError('');
    if (!('geolocation' in navigator)) {
      setMyRouteError('Location is not supported on this device.');
      return;
    }
    if (!meetingPointCoords) {
      setMyRouteError('This ride has no meeting point coordinates.');
      return;
    }
    setLoadingMyRoute(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { lat: latitude, lng: longitude };
        setMyLocation(loc);
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${meetingPointCoords.lng},${meetingPointCoords.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const points = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            setMyRoutePoints(points);
          } else {
            // Fallback — straight line from current location to meeting point
            setMyRoutePoints([[latitude, longitude], [meetingPointCoords.lat, meetingPointCoords.lng]]);
          }
        } catch (err) {
          console.error('My-route fetch error:', err);
          setMyRoutePoints([[latitude, longitude], [meetingPointCoords.lat, meetingPointCoords.lng]]);
        } finally {
          setLoadingMyRoute(false);
        }
      },
      (error) => {
        setLoadingMyRoute(false);
        if (error.code === error.PERMISSION_DENIED) {
          setMyRouteError('Location permission denied. Allow location to see your route to the meetup.');
        } else {
          setMyRouteError('Could not get your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const fetchRoute = async () => {
    setLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${meetingPointCoords.lng},${meetingPointCoords.lat};${destinationCoords.lng},${destinationCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
        const points = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );
        setRoutePoints(points);
      }
    } catch (err) {
      console.error('Route fetch error:', err);
      // Fallback — straight line between two points
      if (meetingPointCoords && destinationCoords) {
        setRoutePoints([
          [meetingPointCoords.lat, meetingPointCoords.lng],
          [destinationCoords.lat, destinationCoords.lng],
        ]);
      }
    } finally {
      setLoadingRoute(false);
    }
  };

  const defaultCenter = meetingPointCoords
    ? [meetingPointCoords.lat, meetingPointCoords.lng]
    : [27.7172, 85.324];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Route Map
          </Typography>
          {loadingRoute && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} sx={{ color: '#7c3aed' }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>Loading route...</Typography>
            </Box>
          )}
        </Box>

        {/* Route info */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22c55e' }} />
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              {meetingPoint || 'Meeting Point'}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>→</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              {destination || 'Destination'}
            </Typography>
          </Box>
        </Box>

        {/* Map */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ width: '100%', height: '450px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Auto fit bounds */}
            {meetingPointCoords && destinationCoords && (
              <FitBounds
                meetingPointCoords={meetingPointCoords}
                destinationCoords={destinationCoords}
                myLocation={myLocation}
              />
            )}

            {/* Your route to meetup (current location → meeting point) */}
            {myRoutePoints.length > 0 && (
              <Polyline
                positions={myRoutePoints}
                color="#22c55e"
                weight={5}
                opacity={0.85}
                dashArray="8, 8"
              />
            )}

            {/* Group ride route (meeting point → destination) */}
            {routePoints.length > 0 && (
              <Polyline
                positions={routePoints}
                color="#7c3aed"
                weight={5}
                opacity={0.8}
              />
            )}

            {/* Your current location marker */}
            {myLocation && (
              <Marker position={[myLocation.lat, myLocation.lng]} icon={blueIcon}>
                <Popup>
                  <strong>🧍 You are here</strong><br />
                  Route to the meeting point
                </Popup>
              </Marker>
            )}

            {/* Meeting Point Marker */}
            {meetingPointCoords && (
              <Marker
                position={[meetingPointCoords.lat, meetingPointCoords.lng]}
                icon={greenIcon}
              >
                <Popup>
                  <strong>📍 Meeting Point</strong><br />
                  {meetingPoint}
                </Popup>
              </Marker>
            )}

            {/* Destination Marker */}
            {destinationCoords && (
              <Marker
                position={[destinationCoords.lat, destinationCoords.lng]}
                icon={redIcon}
              >
                <Popup>
                  <strong>🏁 Destination</strong><br />
                  {destination}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>

        {/* Show My Route to Meetup */}
        <Button
          onClick={handleShowMyRoute}
          variant="outlined"
          fullWidth
          disabled={loadingMyRoute || !meetingPointCoords}
          startIcon={loadingMyRoute ? <CircularProgress size={18} sx={{ color: '#22c55e' }} /> : <MyLocation />}
          sx={{
            color: '#16a34a',
            borderColor: '#22c55e',
            borderWidth: 2,
            py: 1.4,
            mt: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            '&:hover': { borderColor: '#16a34a', bgcolor: 'rgba(34,197,94,0.06)', borderWidth: 2 },
          }}
        >
          {myRoutePoints.length > 0 ? 'Update My Route to Meetup' : 'Show My Route to Meetup'}
        </Button>

        {/* My-route error */}
        {myRouteError && (
          <Typography variant="body2" sx={{ color: '#dc2626', textAlign: 'center', mt: 1, fontSize: '0.85rem' }}>
            {myRouteError}
          </Typography>
        )}

        {/* Legend for the two route colours (shown once a personal route exists) */}
        {myRoutePoints.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#22c55e', borderRadius: 1 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>You → Meetup</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 20, height: 3, bgcolor: '#7c3aed', borderRadius: 1 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>Meetup → Destination</Typography>
            </Box>
          </Box>
        )}

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