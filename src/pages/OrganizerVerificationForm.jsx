import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack,
  VerifiedUser,
  CheckCircle,
  UploadFile,
  AdminPanelSettings,
  Approval,
  CloudUpload,
} from '@mui/icons-material';

export default function OrganizerVerificationForm() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    experience: '',
    licenseNumber: '',
    motorcycleModel: '',
    reason: '',
  });
  const [idDocument, setIdDocument] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        setError('File size must be less than 5MB');
        return;
      }
      setIdDocument(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || 
        !formData.experience || !formData.licenseNumber || !formData.motorcycleModel) {
      setError('Please fill in all required fields');
      return;
    }

    // COMMENTED OUT FOR NOW - Will enable after Blaze upgrade
    // if (!idDocument) {
    //   setError('Please upload your ID document');
    //   return;
    // }

    if (!user) {
      setError('You must be logged in to submit this application');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // COMMENTED OUT - File upload (requires Firebase Blaze plan)
      // const storageRef = ref(storage, `verification-documents/${user.uid}/${idDocument.name}`);
      // await uploadBytes(storageRef, idDocument);
      // const documentURL = await getDownloadURL(storageRef);

      // Create verification request in Firestore
      const verificationData = {
        userId: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        licenseNumber: formData.licenseNumber,
        motorcycleModel: formData.motorcycleModel,
        reason: formData.reason,
        documentURL: idDocument ? idDocument.name : 'Document upload pending', // Temporary placeholder
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'verificationRequests'), verificationData);
      
      console.log('Verification request submitted successfully');
      
      // Show success dialog
      setShowSuccessDialog(true);
      
    } catch (error) {
      console.error('Error submitting verification request:', error);
      console.error('Error message:', error.message);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    navigate('/become-organizer');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        pb: 3,
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 6,
          color: 'white',
        }}
      >
        {/* Back Button + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate('/become-organizer')}
            sx={{ color: 'white', p: 0 }}
            disabled={loading}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Organizer Verification
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', px: 2 }}>
          Complete the form below to request organizer status
        </Typography>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>
        {/* Why Verify Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                bgcolor: '#f3e8ff',
                borderRadius: 3,
                p: 2.5,
                display: 'flex',
                alignItems: 'start',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <VerifiedUser sx={{ fontSize: 26, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Why Verify?
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Verified organizers gain community trust, can create unlimited rides, and receive priority support.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Verification Process Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, px: 1 }}>
          Verification Process
        </Typography>

        {/* Process Steps */}
        <Box sx={{ mb: 3 }}>
          {/* Step 1 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              1
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Submit Application
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Fill out the form and upload documents
              </Typography>
            </Box>
          </Box>

          {/* Step 2 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              2
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Admin Review
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Our team reviews your application (1-3 days)
              </Typography>
            </Box>
          </Box>

          {/* Step 3 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#7c3aed',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              3
            </Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Get Verified
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Receive your verified organizer badge
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Application Form Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, px: 1 }}>
          Application Form
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            mb: 2,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Name */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Full Name
                </Typography>
                <TextField
                  fullWidth
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* Email */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Email Address
                </Typography>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* Phone */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  name="phone"
                  placeholder="+977 98xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* Years of Experience */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Years of Riding Experience
                </Typography>
                <TextField
                  fullWidth
                  name="experience"
                  placeholder="e.g., 5 years"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* License Number */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Motorcycle License Number
                </Typography>
                <TextField
                  fullWidth
                  name="licenseNumber"
                  placeholder="Enter your license number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* Motorcycle Model */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Motorcycle Model
                </Typography>
                <TextField
                  fullWidth
                  name="motorcycleModel"
                  placeholder="e.g., Honda CB 250"
                  value={formData.motorcycleModel}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* Why Organizer (Optional) */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Why do you want to be an organizer? (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="reason"
                  placeholder="Tell us why you'd like to become a verified organizer..."
                  value={formData.reason}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '& .MuiOutlinedInput-root': { borderRadius: 2 },
                  }}
                />
              </Box>

              {/* ID Document Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  ID Document Upload (Optional for now)
                </Typography>
                <Box
                  sx={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    bgcolor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#7c3aed',
                      bgcolor: '#f3e8ff',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={loading}
                  />
                  <CloudUpload sx={{ fontSize: 48, color: '#7c3aed', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                    {idDocument ? idDocument.name : 'Upload Documents Here'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                    Click to upload your ID or license (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#7c3aed',
            color: 'white',
            py: 1.75,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 3,
            mb: 1.5,
            '&:hover': {
              bgcolor: '#6d28d9',
            },
            '&:disabled': {
              bgcolor: '#cbd5e1',
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Application'}
        </Button>

        {/* Terms Text */}
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            textAlign: 'center',
            display: 'block',
            px: 2,
            lineHeight: 1.5,
          }}
        >
          By submitting, you agree to our verification terms and conditions
        </Typography>
      </Container>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        PaperProps={{
          sx: {
            borderRadius: 4,
            px: 2,
            py: 1,
            maxWidth: '400px',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: 50, color: '#22c55e' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Application Submitted!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            Your verification request has been submitted.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
            Our team will review your application within 1-3 business days.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={handleCloseSuccessDialog}
            sx={{
              bgcolor: '#7c3aed',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}