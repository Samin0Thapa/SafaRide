import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import theme from './theme';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from './services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateRide from "./pages/CreateRide";
import EditRide from "./pages/EditRide";
import JoinRide from "./pages/JoinRide";
import RideDetails from "./pages/RideDetails";
import Profile from "./pages/Profile";
import TrustVerification from "./pages/TrustVerification";
import OrganizerVerificationForm from "./pages/OrganizerVerificationForm";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import EmergencyContactsSetup from './pages/EmergencyContactsSetup';
import EmergencySOS from "./pages/EmergencySOS";
import ChatList from './pages/ChatList';
import GroupChat from './pages/GroupChat';
import RateRide from './pages/RateRide';
import Settings from "./pages/Settings";

//Global SOS alert helper 
function playGlobalBeep() {
  try {
    if (!window.audioContext) {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = window.audioContext;
    // Resume context if suspended (required by browsers after user gesture)
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('Global SOS beep error:', e);
  }
}

async function triggerGlobalSOSAlert() {
  // Request vibration permission (required on Android 10+)
  if ('vibrate' in navigator && 'permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'vibrate' });
      if (permission.state !== 'denied') {
        navigator.vibrate([400, 150, 400, 150, 400]);
      }
    } catch (e) {
      // Fallback for browsers that don't support permission API
      navigator.vibrate([400, 150, 400, 150, 400]);
    }
  } else if ('vibrate' in navigator) {
    // Old Android or browsers without permission API
    navigator.vibrate([400, 150, 400, 150, 400]);
  }
  playGlobalBeep();
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [activeSOS, setActiveSOS] = useState(null); // { rideTitle, triggeredBy, mapsLink }
  const [currentUser, setCurrentUser] = useState(null);
  const alertIntervalRef = useRef(null);
  const seenSOSIds = useRef(new Set()); // track already-seen SOS events so we don't re-alert

  // Track auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Global SOS listener — runs on every page whenever user is logged in
  useEffect(() => {
    if (!currentUser) {
      setActiveSOS(null);
      return;
    }

    // Watch ALL rides with an active SOS flag.
    // EmergencySOS.jsx sets sosActive=true on the ride document — this is the
    // single source of truth for an active emergency.
    const sosQuery = query(
      collection(db, 'rides'),
      where('sosActive', '==', true)
    );

    // Any SOS older than this is treated as stale/orphaned and ignored, so a
    // forgotten alert can't haunt the app indefinitely.
    const SOS_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

    const unsubscribeSOS = onSnapshot(sosQuery, (snapshot) => {
      let foundRelevantSOS = null;

      // Suppress the global SOS banner on public/auth pages. A cached Firebase
      // session can leave currentUser set while the login/home UI is showing.
      const authPaths = ['/', '/login', '/signup'];
      if (authPaths.includes(window.location.pathname)) {
        setActiveSOS(null);
        if (alertIntervalRef.current) {
          clearInterval(alertIntervalRef.current);
          alertIntervalRef.current = null;
        }
        return;
      }

      for (const docSnap of snapshot.docs) {
        const ride = { id: docSnap.id, ...docSnap.data() };

        // Skip the SOS we triggered ourselves (we're already on the SOS page)
        if (ride.sosTriggeredBy === currentUser.uid) continue;

        // Skip stale SOS — if it was triggered more than 30 min ago and never
        // cleared, treat it as orphaned and do not alert.
        if (ride.sosTimestamp?.seconds) {
          const ageMs = Date.now() - ride.sosTimestamp.seconds * 1000;
          if (ageMs > SOS_MAX_AGE_MS) continue;
        }

        // Only alert if we're part of this ride
        const isCreator = ride.createdBy === currentUser.uid;
        const isParticipant = Array.isArray(ride.participants) &&
          ride.participants.some(p =>
            (typeof p === 'object' && p.userId === currentUser.uid) || p === currentUser.uid
          );

        if (!isCreator && !isParticipant) continue;

        // This SOS is relevant to us — is it new since the last alert?
        if (!seenSOSIds.current.has(ride.id)) {
          seenSOSIds.current.add(ride.id);
          triggerGlobalSOSAlert();
        }

        // Build a robust maps link: prefer the stored link, else build one from
        // raw coords if present. Stays null only if GPS was never captured.
        let mapsLink = ride.sosMapsLink || null;
        if (!mapsLink && ride.sosLat != null && ride.sosLng != null) {
          mapsLink = `https://www.google.com/maps?q=${ride.sosLat},${ride.sosLng}`;
        }

        foundRelevantSOS = {
          rideTitle: ride.title || 'a ride',
          triggeredBy: ride.sosTriggeredByName || 'A rider',
          mapsLink,
          rideId: ride.id,
        };
        break; // show alert for first relevant SOS
      }

      // When a ride's sosActive flips back to false, drop it from seen-set so a
      // future SOS on the same ride alerts again.
      const activeIds = new Set(snapshot.docs.map((d) => d.id));
      seenSOSIds.current.forEach((id) => {
        if (!activeIds.has(id)) seenSOSIds.current.delete(id);
      });

      setActiveSOS(foundRelevantSOS);

      // Repeat vibration+sound every 4 seconds while SOS is active (on any page)
      if (foundRelevantSOS) {
        if (!alertIntervalRef.current) {
          alertIntervalRef.current = setInterval(() => {
            triggerGlobalSOSAlert();
          }, 4000);
        }
      } else {
        if (alertIntervalRef.current) {
          clearInterval(alertIntervalRef.current);
          alertIntervalRef.current = null;
        }
      }
    });

    return () => {
      unsubscribeSOS();
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
        alertIntervalRef.current = null;
      }
    };
  }, [currentUser]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>

        {/* ── Global SOS Alert Overlay — full-screen, shown on ANY page ── */}
        {activeSOS && (
          <Box
            sx={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              bgcolor: 'rgba(0,0,0,0.85)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
            }}
          >
            <Box
              sx={{
                width: 140, height: 140, borderRadius: '50%',
                bgcolor: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 3,
                animation: 'sosPulse 1s infinite',
                '@keyframes sosPulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.15)', opacity: 0.8 },
                },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>SOS</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 1, textAlign: 'center' }}>
              🚨 Emergency Alert!
            </Typography>
            <Typography variant="body1" sx={{ color: '#fca5a5', mb: 1, textAlign: 'center', fontSize: '1.1rem' }}>
              <strong style={{ color: 'white' }}>{activeSOS.triggeredBy}</strong> has triggered an SOS
            </Typography>
            <Typography variant="body2" sx={{ color: '#fca5a5', mb: 3, textAlign: 'center' }}>
              in "{activeSOS.rideTitle}"
            </Typography>
            {activeSOS.mapsLink && (
              <Button
                variant="contained"
                onClick={() => window.open(activeSOS.mapsLink, '_blank', 'noopener,noreferrer')}
                sx={{
                  bgcolor: '#4CAF50', color: 'white',
                  fontWeight: 700, textTransform: 'none',
                  borderRadius: 3, px: 4, py: 1.5, mb: 2,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#388E3C' },
                }}
              >
                📍 Open Their Location in Maps
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => setActiveSOS(null)}
              sx={{
                color: 'white', borderColor: 'rgba(255,255,255,0.5)',
                fontWeight: 600, textTransform: 'none',
                borderRadius: 3, px: 4, py: 1, mb: 2,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Dismiss
            </Button>
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
              This alert will clear when the SOS is resolved
            </Typography>
          </Box>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-ride" element={<CreateRide />} />
          <Route path="/edit-ride/:rideId" element={<EditRide />} />
          <Route path="/join-ride" element={<JoinRide />} />
          <Route path="/ride-details/:rideId" element={<RideDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/become-organizer" element={<TrustVerification />} />
          <Route path="/verification-form" element={<OrganizerVerificationForm />} />
          <Route path="/emergency-contacts" element={<EmergencyContactsSetup />} />
          <Route path="/emergency-sos/:rideId" element={<EmergencySOS />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:rideId" element={<GroupChat />} />
          <Route path="/rate-ride/:rideId" element={<RateRide />} />
          <Route path="/settings" element={<Settings />} />

          {/* ADMIN ROUTE */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
