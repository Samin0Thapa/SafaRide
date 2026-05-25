import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import { Warning } from '@mui/icons-material';
import theme from './theme';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from './services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateRide from "./pages/CreateRide";
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

// ─── Global SOS alert helper ────────────────────────────────────────────────
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

function triggerGlobalSOSAlert() {
  // Vibration: triple-pulse pattern for better compatibility across Android devices
  if ('vibrate' in navigator) {
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

    // Watch ALL active SOS alerts
    const sosQuery = query(
      collection(db, 'sosAlerts'),
      where('status', '==', 'active')
    );

    const unsubscribeSOS = onSnapshot(sosQuery, async (snapshot) => {
      let foundRelevantSOS = null;

      for (const docSnap of snapshot.docs) {
        const sosData = { id: docSnap.id, ...docSnap.data() };

        // Skip our own SOS (we're already on the SOS page)
        if (sosData.userId === currentUser.uid) continue;

        // Check if this SOS is for a ride we're part of
        try {
          const ridesSnap = await getDocs(
            query(collection(db, 'rides'), where('__name__', '==', sosData.rideId))
          );
          if (ridesSnap.empty) continue;

          const ride = ridesSnap.docs[0].data();
          const isCreator = ride.createdBy === currentUser.uid;
          const isParticipant = Array.isArray(ride.participants) &&
            ride.participants.some(p =>
              (typeof p === 'object' && p.userId === currentUser.uid) || p === currentUser.uid
            );

          if (!isCreator && !isParticipant) continue;

          // This SOS is relevant to us — is it new?
          if (!seenSOSIds.current.has(sosData.id)) {
            seenSOSIds.current.add(sosData.id);
            // Trigger immediate alert
            triggerGlobalSOSAlert();
          }

          foundRelevantSOS = {
            rideTitle: ride.title || 'a ride',
            triggeredBy: sosData.userName || 'A rider',
            mapsLink: sosData.location
              ? `https://www.google.com/maps?q=${sosData.location.lat},${sosData.location.lng}`
              : null,
            rideId: sosData.rideId,
          };
          break; // show banner for first relevant SOS
        } catch (e) {
          console.warn('Error checking SOS ride membership:', e);
        }
      }

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

        {/* ── Global SOS Banner — shown on ANY page when a ride participant triggers SOS ── */}
        {activeSOS && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              bgcolor: '#dc2626',
              color: 'white',
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 4px 20px rgba(220,38,38,0.5)',
              animation: 'sosFlash 1s infinite',
              '@keyframes sosFlash': {
                '0%, 100%': { bgcolor: '#dc2626' },
                '50%': { bgcolor: '#991b1b' },
              },
            }}
          >
            <Warning sx={{ fontSize: 24, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
                🚨 SOS ALERT — {activeSOS.triggeredBy} needs help in "{activeSOS.rideTitle}"
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              {activeSOS.mapsLink && (
                <Button
                  size="small"
                  href={activeSOS.mapsLink}
                  target="_blank"
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', px: 1.5, py: 0.5, minWidth: 'unset', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                  📍 Map
                </Button>
              )}
              <Button
                size="small"
                onClick={() => setActiveSOS(null)}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', px: 1.5, py: 0.5, minWidth: 'unset', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
              >
                Dismiss
              </Button>
            </Box>
          </Box>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-ride" element={<CreateRide />} />
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
