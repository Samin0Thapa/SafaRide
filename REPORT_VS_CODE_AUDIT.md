# SafaRide — Final Report vs Codebase Audit
**Generated:** 2026-05-25  
**Report:** `finalReport.docx` (BSc CS FYP, Samin Thapa, 2408644)  
**Codebase:** `src/` — React 19 + Vite + Firebase + MUI

---

## 🟢 SUMMARY TABLE

| Area | Report Claims | Code Reality | Status |
|---|---|---|---|
| Core stack (React/Vite/MUI/Firebase) | ✅ | ✅ | Match |
| Google Maps API | ✅ claimed | ❌ Leaflet + OSRM | **Mismatch** |
| Firebase Cloud Functions | ✅ claimed | ❌ Not implemented | **Missing** |
| FCM Push Notifications | ✅ claimed | ❌ In-app Firestore only | **Missing** |
| Chart.js analytics | ✅ claimed | ❌ Not in package.json | **Missing** |
| Firebase Hosting | ✅ claimed | ❌ Vercel (vercel.json) | **Mismatch** |
| GitHub Actions CI/CD | ✅ claimed | ❌ No .github/ folder | **Missing** |
| Difficulty levels (Easy/Moderate/Hard/Expert) | ✅ in SRS | ❌ Not a field in code | **Missing** |
| Ride types naming | City Tour / Weekend Adventure etc. | Short Ride / Long Ride / Mountain Ride etc. | **Mismatch** |
| Half-star ratings (0.5 increments) | ✅ in SRS | ❌ Whole stars only | **Mismatch** |
| Phone number in registration | ✅ in SRS | ❌ Not in Signup.jsx | **Missing** |
| Email verification gate | ✅ in SRS | ⚠️ Email sent but not enforced | **Partial** |
| Bio + Location in profile | ✅ in SRS | ❌ Not implemented | **Missing** |
| SOS continuous GPS tracking | ✅ in SRS (TC3.5) | ❌ Descoped (one-time capture) | **Descoped** |
| SOS History UI | ✅ in SRS (TC3.4) | ❌ Descoped | **Descoped** |
| Min 3 emergency contacts before riding | ✅ in SRS | ❌ Not enforced | **Missing** |
| Distance (km) field | ✅ in SRS | ❌ Not in CreateRide | **Missing** |
| Ride image upload | ✅ in SRS | ❌ Not implemented | **Missing** |
| Sort rides by date/popularity | ✅ in SRS | ❌ Not implemented | **Missing** |
| Report review / flag | ✅ in SRS | ❌ Not implemented | **Missing** |
| Organizer response to review | ✅ in SRS | ❌ Not implemented | **Missing** |
| 7-day review window | ✅ in SRS | ❌ Not enforced | **Missing** |
| Min 5 rides for trust score | ✅ in SRS | ❌ Not enforced | **Missing** |
| SMS to emergency contacts | ✅ in SRS | ❌ No SMS service | **Missing** |
| Google login | ✅ mentioned in tools | ❌ Email only | **Missing** |
| Cancel ride by organizer | ✅ in SRS | ✅ Implemented | Match |
| Ride creation with map | ✅ | ✅ | Match |
| Join / leave rides | ✅ | ✅ | Match |
| Real-time group chat | ✅ | ✅ | Match |
| SOS button (long-press) | ✅ | ✅ | Match |
| GPS capture on SOS | ✅ | ✅ | Match |
| Audio beep on SOS | ✅ | ✅ (Web Audio API) | Match |
| Google Maps link in SOS | ✅ | ✅ | Match |
| Organizer verification form | ✅ | ✅ | Match |
| Admin approve/reject verification | ✅ | ✅ | Match |
| Emergency contacts page | ✅ | ✅ | Match |
| Rate ride (stars + comment) | ✅ | ✅ | Match |
| User profiles with stats | ✅ | ✅ | Match |
| PWA installable | ✅ | ✅ | Match |
| Offline capability | ✅ claimed | ⚠️ PWA plugin configured, limited | Partial |

---

## ✅ SECTION 1 — What Matches (Report = Code)

### Stack & Architecture
- **React 19 + Vite + Material-UI** — exactly as described in Tools & Tech (Section 8)
- **Firebase Firestore** as primary real-time database — all 8 Firestore collections exist
- **Firebase Auth (email/password)** — Login.jsx and Signup.jsx use `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`
- **Firebase Cloud Storage** — profile images and verification docs uploaded via Storage
- **Agile Scrum methodology** — evidenced by iterative feature development across sprints
- **PWA** — `vite-plugin-pwa` configured, app is installable with offline caching

### User Management (Subsystem 1)
- ✅ User registration and login
- ✅ Three user roles: `user`, `organizer`, `admin`
- ✅ Trust rating (0-5 stars) stored and displayed on profiles
- ✅ Ride history shown in profile
- ✅ Profile photo upload (Firebase Storage)
- ✅ Logout functionality
- ✅ Password reset via `sendPasswordResetEmail()` (Settings page)
- ✅ Account deletion (Settings page)
- ✅ Email verification email IS sent on signup (`sendEmailVerification()` called in Signup.jsx)

### Ride Management (Subsystem 2)
- ✅ Organizers create rides with: title, description, date, time, duration, type, meeting point, destination
- ✅ Interactive map for selecting meeting point and destination (MapPicker.jsx — Leaflet)
- ✅ Route visualisation between two points (RouteMapViewer.jsx — OSRM polyline)
- ✅ Ride listings with browse/filter by type and location text search
- ✅ Join ride → user added to `participants` array in Firestore
- ✅ Leave ride
- ✅ Ride status lifecycle: `upcoming` → `ongoing` → `completed`
- ✅ Organizer can start and complete rides from RideDetails
- ✅ **Cancel ride** — RideDetails has cancel flow; all participants get in-app notification
- ✅ Participant count tracked and displayed
- ✅ Max participants enforced on join

### Safety & Emergency — SOS (Subsystem 3)
- ✅ SOS button requires long-press (2-second hold) to activate (prevents accidental triggers)
- ✅ GPS coordinates captured at moment of SOS activation (browser Geolocation API)
- ✅ Audio beep plays on activation (Web Audio API — programmatically generated, not a file)
- ✅ SOS event stored in Firestore `sosAlerts` collection with timestamp and location
- ✅ In-app notifications sent to all ride participants via Firestore `notifications` collection
- ✅ **Google Maps link** generated from captured lat/lng and shared in SOS alert — links open `https://www.google.com/maps?q=lat,lng`
- ✅ SOS deactivation sends "all clear" in-app notification
- ✅ SOS status shows `ACTIVE` / `RESOLVED`

### Trust & Verification (Subsystem 4)
- ✅ Organizer applies for verification via OrganizerVerificationForm.jsx
- ✅ Verification form collects: license/ID documents, motorcycle details, years of experience
- ✅ Docs uploaded to Firebase Storage
- ✅ Pending request stored in `organizerRequests` Firestore collection
- ✅ Admin dashboard shows all pending verification requests
- ✅ Admin can approve or reject with notification sent to applicant
- ✅ Verified badge on approved organizer profiles

### Ratings (Subsystem 4 continued)
- ✅ RateRide page — rates both the ride AND the organizer separately
- ✅ 1-5 star rating scale
- ✅ Text comment/review
- ✅ Organizer's average rating recalculated in real-time after each submission
- ✅ Stored in Firestore `ratings` collection

### Chat (Subsystem 6)
- ✅ Group chat per ride (`/chat/:rideId`)
- ✅ Real-time messages via `onSnapshot()` on Firestore `messages` collection
- ✅ ChatList page shows all rides with chat
- ✅ Message shows sender name and timestamp

### Notifications (Subsystem 5 — partial)
- ✅ In-app real-time notification system (Dashboard reads `notifications` collection)
- ✅ Notifications fired for: join/leave ride, SOS events, ride status changes, verification decisions

### Admin Dashboard
- ✅ Protected route (ProtectedAdminRoute.jsx checks `role === 'admin'` in Firestore)
- ✅ View all users, rides, stats
- ✅ Approve/reject organizer verification requests

---

## ❌ SECTION 2 — What's in the Report But NOT in the Code

### 🔴 Critical Discrepancies

#### 1. Map Technology — Report says Google Maps API, Code uses Leaflet
**Report (Section 8, Subsystem 8, Abstract):** "Google Maps API (routes/markers/live GPS tracking)"  
**Code reality:**
- `react-leaflet` + `leaflet` for all interactive maps
- `Nominatim` (OpenStreetMap) for address/geocoding search — **FREE, no API key needed**
- `OSRM` (Open Source Routing Machine) for route calculation — **FREE, no API key needed**
- Google Maps is ONLY used as a link target in SOS: `https://www.google.com/maps?q=lat,lng` — this is NOT the Google Maps JavaScript API
- There is NO `VITE_GOOGLE_MAPS_API_KEY` in `.env`

**Impact on report:** The academic question references "Firebase and Google Maps integration" — the maps integration is actually Leaflet/OSRM. This is a significant claim vs reality gap.

#### 2. Firebase Cloud Functions — Not implemented
**Report (Section 8, Subsystem 5):** "Firebase Cloud Functions (serverless) + event triggers for notifications"  
**Code reality:** There is NO `functions/` directory, no `firebase-functions` in package.json, no `httpsCallable()` usage anywhere in the codebase. All logic runs **client-side**. Notifications are written directly to Firestore by the client, not triggered by a server-side function.

#### 3. FCM Push Notifications — Not implemented
**Report (Section 8, Subsystem 5, Abstract):** "FCM (push alerts)", "Firebase Cloud Messaging (push notifications)"  
**Code reality:** `src/services/notifications.js` only writes a document to the Firestore `notifications` collection. There is no `getMessaging()`, `getToken()`, or service worker for FCM. Notifications are **in-app only** (visible when the app is open) — there are no background/lock-screen push notifications.

#### 4. Chart.js / D3.js Analytics — Not implemented
**Report (Section 8, Subsystem 7):** "Chart.js/D3.js (visualizations)", "charts and graphs for participation trends"  
**Code reality:** `package.json` has no `chart.js`, `d3`, `recharts`, or any charting library. The Admin Dashboard shows statistics using MUI Typography/Chip components, not charts.

#### 5. Hosting — Report says Firebase Hosting, Code deployed on Vercel
**Report (Section 8):** "Firebase Hosting (CDN) + GitHub Actions (CI/CD)"  
**Code reality:**
- `vercel.json` exists in root → project is deployed on **Vercel**
- No `.github/workflows/` directory → no GitHub Actions CI/CD pipeline
- No `firebase.json` or `.firebaserc` for Firebase Hosting

### 🟡 Feature Gaps (in SRS but not coded)

#### 6. Difficulty Levels — Not a field
**Report SRS (Subsystem 2):** Dropdown for Easy / Moderate / Hard / Expert  
**Code:** No difficulty field in `CreateRide.jsx`. The placeholder text says "Add details about the ride, stops, difficulty level..." suggesting it's meant to be in the description, not a structured field.

#### 7. Ride Type Names — Different from SRS
**Report SRS:** City Tour / Weekend Adventure / Long Distance / Training Ride  
**Code (`CreateRide.jsx`):** Short Ride / Long Ride / Mountain Ride  
**Code (`JoinRide.jsx` filters):** Short Ride / Long Ride / Mountain Ride / City Tour / Highway Cruise  
_(City Tour exists in both, but the others are all different)_

#### 8. Half-Star Ratings (0.5 increments)
**Report SRS:** "1-5 stars, 0.5 increments" for both ride rating and organizer rating  
**Code (`RateRide.jsx`):** `[1, 2, 3, 4, 5].map(star => ...)` — whole integer stars only, no 0.5 increments

#### 9. Phone Number in Registration
**Report SRS (Subsystem 1, Property Sheet):** Phone number field, valid Nepal format `+977-XXXXXXXXXX`, required  
**Code (`Signup.jsx`):** No phone number field — only name, email, and password on the sign-up form

#### 10. Email Verification as an Access Gate
**Report SRS:** "Email verification required before full account access"  
**Code:** `sendEmailVerification()` IS called in Signup.jsx (email sent ✅), but there is **no check** anywhere that blocks unverified users from accessing Dashboard, CreateRide, or any other page. The gate is never enforced.

#### 11. Bio and Location fields in Profile
**Report SRS (Property Sheet fields 9 & 10):** Bio (500 chars, optional) and Location (city/area in Nepal)  
**Code (`Profile.jsx`):** These fields are not present in the profile edit form

#### 12. Distance (km) Field for Rides
**Report SRS (Subsystem 2, field 13):** Optional distance in km, max 999  
**Code (`CreateRide.jsx`):** No distance field

#### 13. Ride Image Upload
**Report SRS (Subsystem 2, field 16):** Optional ride image (3MB, JPG/PNG)  
**Code (`CreateRide.jsx`):** No image upload for rides (only profile photos are uploaded)

#### 14. Sort Rides (Date / Popularity / Distance)
**Report SRS (Subsystem 2, field 29):** Sort By dropdown  
**Code (`JoinRide.jsx`):** No sort functionality — rides are displayed in Firestore insertion order

#### 15. Minimum 3 Emergency Contacts Before Riding
**Report SRS (Subsystem 3):** "Minimum 3 emergency contacts required before joining rides"  
**Code:** Users can join any ride without having set up any emergency contacts

#### 16. SOS Continuous Location Updates (TC3.5) — DESCOPED
**Report SRS (TC-SOS-005):** Location should update every 10 seconds during active SOS  
**Code + Report Critical Evaluation:** Explicitly descoped — one-time GPS capture at activation time. The Critical Evaluation section confirms this decision.

#### 17. SOS History UI (TC3.4) — DESCOPED
**Report TC3.4:** "Descoped. SOS events are stored in Firestore but a dedicated history UI was not implemented within the project timeline."  
**Code:** SOS data stored in Firestore but no UI page to view past SOS events

#### 18. Report Inappropriate Review + Organizer Response to Review
**Report SRS (Subsystem 4, fields 25 & 27):** Report Review link + organizer can respond to review  
**Code:** Neither feature exists in `RateRide.jsx` or `Profile.jsx`

#### 19. 7-Day Review Submission Window
**Report SRS:** "Reviews must be submitted within 7 days of ride completion"  
**Code (`RateRide.jsx`):** No time-based restriction — you can rate any completed ride at any time

#### 20. Minimum 5 Rides Before Trust Score Display
**Report SRS:** "Minimum 5 completed rides required before trust score is fully displayed"  
**Code:** Trust score / rating displayed from the first completed ride

#### 21. SMS Notifications to Emergency Contacts
**Report SRS (Subsystem 3):** "Emergency contacts receive SMS and push notifications"  
**Code:** Only in-app Firestore notifications — no SMS service (Twilio, etc.) integrated

#### 22. Followers System
**Report SRS (Subsystem 2):** "System stores ride in Firestore, sends notifications to followers"  
**Code:** No followers feature — there is no followers relationship between users

#### 23. Google Sign-In
**Report (Section 8):** "Firebase Auth (email/Google)"  
**Code:** Email/password only — no Google OAuth configured

#### 24. Paginated Reviews
**Report SRS (Subsystem 4):** "Reviews are paginated and sorted by date"  
**Code:** No pagination on rating/review display

---

## ⚠️ SECTION 3 — What's in the Code But NOT Mentioned in the Report

These features exist and work in the codebase but are absent from the report documentation:

| Feature in Code | Where | Notes |
|---|---|---|
| **Vercel deployment** | `vercel.json` | Not mentioned — report says Firebase Hosting |
| **Leaflet maps** | `react-leaflet` package, MapPicker.jsx, RouteMapViewer.jsx | Report only mentions Google Maps |
| **OSRM routing** | `router.project-osrm.org` in RouteMapViewer.jsx | Free route calc, unmentioned |
| **Nominatim geocoding** | `nominatim.openstreetmap.org` in MapPicker.jsx | Free address search, unmentioned |
| **TrustVerification page** (`/become-organizer`) | `TrustVerification.jsx` | Trust score explainer page before the form — not in SRS |
| **ChatList page** (`/chat`) | `ChatList.jsx` | Lists all rides with chats — not in SRS |
| **ProtectedAdminRoute component** | `src/components/ProtectedAdminRoute.jsx` | Security component — not documented |
| **`dayjs` for dates** | `package.json` | Date library used in forms |
| **Actual ride types in code** | Short Ride / Long Ride / Mountain Ride / City Tour / Highway Cruise | Different names from SRS |
| **Web Audio API for SOS beep** | `EmergencySOS.jsx` | Report says "HTML5 Audio API" — technically it's Web Audio API (programmatically generated oscillator, not an `<audio>` element) |
| **SOS requires being in an active ride** | `EmergencySOS.jsx` — `isParticipant` check | SOS button disabled if not a participant |
| **`src/services/notifications.js`** | Helper utility | Not documented in architecture |

---

## 📋 SECTION 4 — Test Case Audit

| Test Case | Report Status | Code Verdict |
|---|---|---|
| TC1.1 — Registration with valid data | Pass/Fail (blank) | ✅ Works |
| TC1.2 — Login with invalid credentials | Pass/Fail (blank) | ✅ Firebase returns auth error |
| TC1.3 — Profile update | Pass/Fail (blank) | ✅ Works |
| TC1.4 — Password reset | Pass/Fail (blank) | ✅ `sendPasswordResetEmail()` in Settings.jsx |
| TC1.5 — Trust rating after ride | Pass/Fail (blank) | ✅ `recalculateOrganizerRating()` in RateRide.jsx |
| TC2.1 — Create ride | Pass/Fail (blank) | ✅ Works |
| TC2.2 — Join ride | Pass/Fail (blank) | ✅ Works |
| TC2.3 — Filter by location and date | Pass/Fail (blank) | ⚠️ Location filter ✅, but no **date range** filter in code |
| TC2.4 — Edit ride details | Pass/Fail (blank) | ⚠️ Need to verify edit is implemented in RideDetails |
| TC2.5 — Cancel ride by organizer | Pass/Fail (blank) | ✅ Cancel with notification implemented |
| TC2.6 — Prevent joining full ride | Pass/Fail (blank) | ✅ Participant limit check in code |
| TC3.1 — Activate SOS | Pass/Fail (blank) | ✅ Works (in-app notifications, no FCM) |
| TC3.2 — Deactivate SOS | Pass/Fail (blank) | ✅ Works |
| TC3.3 — SOS without location permission | Pass/Fail (blank) | ✅ Error handling in code |
| TC3.4 — SOS History | **Fail (descoped)** | ❌ Confirmed descoped in report and in code |
| TC3.5 — Continuous location updates | Pass/Fail (blank) | ❌ Descoped (confirmed in Critical Evaluation) |
| TC4.1 — Apply for verification | Pass/Fail (blank) | ✅ Works |
| TC4.2 — Admin approves verification | Pass/Fail (blank) | ✅ Works |
| TC4.3 — Submit rating after ride | Pass/Fail (blank) | ✅ Works |
| TC4.4 — View trust score and reviews | Pass/Fail (blank) | ✅ Basic version works |
| TC4.5 — Admin rejects verification | Pass/Fail (blank) | ✅ Works |
| TC4.6 — Report inappropriate review | Pass/Fail (blank) | ❌ Feature not implemented |

> **Note:** All "Pass/Fail" fields in the report are blank — test results were never filled in. This is a gap in the report documentation.

---

## 🔧 SECTION 5 — SRS vs Code: Field-by-Field Gaps

### Registration Form
| SRS Field | In Code? |
|---|---|
| Full Name | ✅ |
| Email | ✅ |
| Password | ✅ |
| Confirm Password | ✅ |
| **Phone Number (+977)** | ❌ Missing |
| **Profile Photo on signup** | ❌ Added later in Profile, not on signup |
| **Bio** | ❌ Missing |
| **Location (city/area)** | ❌ Missing |

### Create Ride Form
| SRS Field | In Code? |
|---|---|
| Ride Title | ✅ |
| Description | ✅ |
| Ride Date | ✅ |
| Start Time | ✅ |
| Meeting Point (address + GPS) | ✅ |
| Destination (address + GPS) | ✅ |
| Ride Type | ✅ (but different type names) |
| **Difficulty Level** | ❌ Missing |
| Duration (hours) | ✅ |
| **Distance (km)** | ❌ Missing |
| Max Participants | ✅ |
| Route Details / Waypoints | ✅ (in description) |
| **Ride Image** | ❌ Missing |

### SOS System
| SRS Field | In Code? |
|---|---|
| SOS Button (long press) | ✅ |
| Confirm SOS modal | ✅ |
| Activate SOS | ✅ |
| Cancel SOS | ✅ |
| Deactivate SOS | ✅ |
| SOS Status Badge | ✅ |
| Google Maps Link | ✅ |
| Audio Beep toggle | ✅ |
| Alert Recipients display | ✅ |
| **Helpers List (responding riders)** | ⚠️ Unclear |
| **SOS History** | ❌ Descoped |
| **Location Accuracy display** | ❌ Not shown |
| **Share Location Link button** | ⚠️ Integrated in card, not separate |

---

## 📌 SECTION 6 — Academic Question Alignment

**Report's academic question:** *"How can a PWA effectively address safety, trust, and coordination challenges in Nepal's fragmented biker community using Firebase and **Google Maps** integration?"*

**Reality:** The map integration uses **Leaflet + OSRM + Nominatim** — all free, open-source alternatives to Google Maps. The academic question should reference "open-source map stack" or "Leaflet-based mapping" rather than Google Maps.

**What the report says was answered:**
- ✅ Firebase handles slow internet (Firestore offline caching via PWA)
- ✅ SOS sent alerts fast (confirmed in code)
- ✅ Simple ratings build trust better than fancy AI
- ⚠️ "Maps worked on mountains" — true functionally but using Leaflet/OSRM, not Google Maps

---

## 📝 SECTION 7 — Recommendations for Report Correction

### High Priority (changes the academic integrity of claims)
1. **Update Tools & Tech (Section 8)** — Replace "Google Maps API" with "Leaflet (react-leaflet), OSRM for routing, Nominatim for geocoding". Add a note about why free alternatives were chosen (no API key costs, Nepal-appropriate).
2. **Update Abstract** — "Google Maps integration" → "Leaflet-based map integration with OSRM routing"
3. **Update Hosting** — "Firebase Hosting + GitHub Actions" → "Vercel (vercel.json)"
4. **Update Firebase stack** — Remove "Firebase Cloud Functions" from Tools list (never implemented)
5. **Update FCM claim** — Clarify notifications are in-app (Firestore) not FCM push — or implement FCM

### Medium Priority (SRS accuracy)
6. **Fill in Test Case Actual Results** — All 20 test cases have blank "Actual Result" and "Status: Pass/Fail"
7. **Mark descoped items clearly** — TC3.4 and TC3.5 are correctly marked; ensure SRS section 1.3 also notes the one-time-capture decision
8. **Add acknowledged gaps section** — Phone field, difficulty levels, half-stars, 7-day window, etc.

### Low Priority (nice to have)
9. Correct ride type names to match actual code implementation
10. Note that email verification is sent but not enforced as a gate
11. Document the Vercel deployment and why it was chosen over Firebase Hosting

---

## 🔴 SECTION 8 — Features That Should Be Implemented (If Marking Criteria Requires)

If your supervisor/marker checks the SRS against the live app, these are the gaps most likely to be noticed:

| Gap | Effort to fix | Priority |
|---|---|---|
| Fill in test case results (Pass/Fail) | Low — just document results | 🔴 High |
| Phone number in signup form | Low — add TextField | 🟡 Medium |
| Difficulty level dropdown in CreateRide | Low — add a select field | 🟡 Medium |
| Date filter in JoinRide | Medium — add date range pickers | 🟡 Medium |
| Email verification gate | Low — check `user.emailVerified` | 🟡 Medium |
| Half-star ratings | Medium — custom component | 🟢 Low |
| 7-day review window enforcement | Low — check `ride.completedAt` date | 🟢 Low |
| SOS History tab in EmergencySOS | Medium — query `sosAlerts` by userId | 🟢 Low |
| Chart.js in Admin Dashboard | High — install library + redesign | 🟢 Low |
| FCM push notifications | High — service worker needed | 🔴 High (if claimed) |

---

*This document was generated by scanning the entire codebase and cross-referencing against finalReport.docx. Last updated: 2026-05-25.*
