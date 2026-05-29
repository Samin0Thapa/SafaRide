# SafaRide — One-Page Cheat Sheet (glance before you walk in)

## THE PITCH (say this first)
> "SafaRide is a Progressive Web App for Nepali motorcyclists. Bikers currently coordinate rides on scattered Facebook/WhatsApp groups with no safety tools and no way to trust organizers. SafaRide does three things: **coordination** (create/find/join rides with maps), **safety** (an SOS that alerts everyone on the ride instantly), and **trust** (verified organizers + ratings). Built with React and Firebase, runs on any phone, installable like a native app."

## THE 8 SUBSYSTEMS — ONE LINE EACH
1. **User Management** — Firebase Auth login + signup with a mandatory email-verification gate; three roles (rider/organizer/admin).
2. **Ride Management** — Create/browse/filter/join rides; Leaflet map for locations, OSRM for routes; max 10 riders; joining requires 2+ emergency contacts.
3. **Safety & SOS** ⭐ — 2-second long-press fires a global alarm (sound + vibration + full-screen alert + GPS Maps link) to every participant on any page.
4. **Trust & Verification** — Admin verifies organizers; participants rate ride + organizer 1-5 stars; averages recalculate; reviews public on profile.
5. **Notifications** — Real-time in-app alerts via Firestore onSnapshot; user-toggleable categories; SOS always shows; no background push.
6. **Group Chat** — Real-time per-ride chat (Firestore subcollection); participants only.
7. **Admin Dashboard** — Role-gated portal; live stats; approve/reject verifications; Clear-All-SOS button.
8. **Map & PWA** — Leaflet + Nominatim + OSRM (all free, no API key); vite-plugin-pwa makes it installable + offline-cached.

## TECH STACK — ONE LINE EACH
- **React 19** — UI framework; components + state (`useState`/`useEffect`).
- **Vite 7** — fast build tool & dev server.
- **MUI 7** — ready-made UI components, styled with `sx` prop.
- **React Router 7** — page navigation without reloads (SPA).
- **Firebase** — serverless backend: Auth (login), Firestore (real-time DB), Storage (photos).
- **Leaflet / Nominatim / OSRM** — open-source maps, geocoding, routing (no API key).
- **Web Audio / Vibration / Geolocation APIs** — SOS beep, vibration, GPS.
- **vite-plugin-pwa** — manifest + service worker → installable PWA.
- **Vercel** — hosting; auto-deploys on git push.

## THE ONE CONCEPT THAT EXPLAINS EVERYTHING
> **Firestore `onSnapshot()`** = a real-time listener. When any device writes data, Firestore instantly pushes it to every other device. This powers chat, SOS, notifications, and participant lists — no refresh, no polling.

## TOP 5 Q&A
**Why Firebase / serverless?** → No server to maintain, real-time built in, secure auth, free tier — let me focus on features.

**Why a PWA not native?** → One codebase for all phones, installable, works offline, no app store; ideal for Android-heavy Nepal.

**Biggest challenge?** → The global SOS. I refactored it from page-only to a global App.jsx listener watching `sosActive` on rides — fires on any page for every participant, never for non-participants.

**Why Leaflet not Google Maps?** → Free, no API key, no billing. Google Maps is only a deep-link URL in SOS alerts.

**What would you add with more time?** → Continuous GPS during SOS (currently one-time snapshot), background push (FCM), SMS to emergency contacts. All documented as deliberate scope decisions.

## DEMO FLOW (~8 min)
Login → Dashboard → **Create Ride** (show map) → **Join** from phone 2 → **Group Chat** → **trigger SOS** (wow moment — alert pops on phone 2's Dashboard) → Stop SOS → Complete ride → **Rate** it → show rating on organizer profile → **Admin Dashboard** (approve verification) → mention PWA install.

## BEFORE YOU PRESENT
☐ Both phones charged & on same Wi-Fi  ☐ Tap each screen once (unlocks SOS audio)  ☐ Logged in on both devices  ☐ Clean demo data ready  ☐ Know admin login

**You built this. Speak with confidence.**
