import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
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