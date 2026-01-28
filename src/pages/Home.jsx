import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import {
  PersonOutline,
  ShieldOutlined,
  LocationOnOutlined,
} from '@mui/icons-material';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <PersonOutline sx={{ fontSize: 22, color: '#7c3aed' }} />,
      text: 'Join group rides with verified riders',
    },
    {
      icon: <ShieldOutlined sx={{ fontSize: 22, color: '#7c3aed' }} />,
      text: 'Real-time safety features & SOS',
    },
    {
      icon: <LocationOnOutlined sx={{ fontSize: 22, color: '#7c3aed' }} />,
      text: 'Discover amazing routes nearby',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white',
        overflowY: 'auto',
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          px: 3,
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1,
            mt: 1,
          }}
        >
          <Box
            component="img"
            src="/images/logo.png"
            alt="SafaRide Logo"
            sx={{
              width: { xs: '280px', sm: '400px' },
              height: { xs: '280px', sm: '400px' },
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Spacer - Smaller on mobile */}
        <Box sx={{ flex: { xs: 0.1, sm: 0.3 } }} />

        {/* Branding Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1e293b',
              fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
              mb: 0.5,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
            }}
          >
            SafaRide
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              fontSize: '0.95rem',
              mb: 2,
            }}
          >
            Ride safer. Ride together.
          </Typography>

          {/* Features List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 1.5,
                  maxWidth: '320px',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    minWidth: 40,
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f3e8ff',
                    borderRadius: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#475569',
                    fontSize: '0.9rem',
                  }}
                >
                  {feature.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Gap before buttons - Smaller on mobile */}
        <Box sx={{ mb: { xs: 1, sm: 2 } }} />

        {/* Call-to-Action Buttons */}
        <Box sx={{ mb: 3 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              py: 1.75,
              mb: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#6d28d9',
                boxShadow: 'none',
              },
              minHeight: 50,
            }}
          >
            Login
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => navigate('/signup')}
            sx={{
              color: '#7c3aed',
              borderColor: '#7c3aed',
              py: 1.75,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 3,
              borderWidth: 2,
              '&:hover': {
                borderColor: '#6d28d9',
                bgcolor: 'transparent',
                borderWidth: 2,
              },
              minHeight: 50,
            }}
          >
            Create Account
          </Button>
        </Box>
      </Container>
    </Box>
  );
}