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
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;