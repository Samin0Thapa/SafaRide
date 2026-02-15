import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  Person,
  Phone,
  People,
  MedicalServices,
  CheckCircle,
} from '@mui/icons-material';

export default function EmergencyContactsSetup() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [contacts, setContacts] = useState([]);
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: '',
    allergies: '',
    conditions: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const relationships = [
    'Father',
    'Mother',
    'Spouse',
    'Sibling',
    'Friend',
    'Relative',
    'Other',
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    if (user) {
      fetchEmergencyContacts();
    }
  }, [user]);

  const fetchEmergencyContacts = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setContacts(userData.emergencyContacts || []);
        setMedicalInfo(userData.medicalInfo || { bloodType: '', allergies: '', conditions: '' });
      }
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emergencyContacts: contacts,
        medicalInfo: medicalInfo,
      });

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    if (!formData.name || !formData.phone || !formData.relationship) {
      alert('Please fill in all fields');
      return;
    }

    if (editingContact !== null) {
      // Edit existing contact
      const updatedContacts = [...contacts];
      updatedContacts[editingContact] = formData;
      setContacts(updatedContacts);
    } else {
      // Add new contact
      setContacts([...contacts, formData]);
    }

    // Reset form
    setFormData({ name: '', phone: '', relationship: '' });
    setShowAddDialog(false);
    setEditingContact(null);
  };

  const handleEditContact = (index) => {
    setFormData(contacts[index]);
    setEditingContact(index);
    setShowAddDialog(true);
  };

  const handleDeleteContact = (index) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      setContacts(updatedContacts);
    }
  };

  const openAddDialog = () => {
    setFormData({ name: '', phone: '', relationship: '' });
    setEditingContact(null);
    setShowAddDialog(true);
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  const isValid = contacts.length >= 2;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        pb: 10,
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          borderRadius: '0 0 30px 30px',
          px: 3,
          pt: 3,
          pb: 4,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'white' }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Emergency Contacts
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Container maxWidth="sm" sx={{ mt: 3, px: 2 }}>
        {/* Warning Alert */}
        {!isValid && (
          <Alert
            severity="error"
            icon={<MedicalServices />}
            sx={{
              mb: 3,
              borderRadius: 3,
              bgcolor: '#fef2f2',
              color: '#991b1b',
              border: '2px solid #fecaca',
              '& .MuiAlert-icon': {
                color: '#dc2626',
              },
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Minimum 2 Contacts Required
            </Typography>
            <Typography variant="body2">
              Please add at least {2 - contacts.length} more emergency contact(s) for your safety.
            </Typography>
          </Alert>
        )}

        {/* Emergency Contacts Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <People sx={{ color: '#ef4444', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Emergency Contacts ({contacts.length})
            </Typography>
          </Box>

          {/* Contact Cards */}
          {contacts.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                bgcolor: 'white',
                borderRadius: 4,
                border: '2px dashed #cbd5e1',
              }}
            >
              <People sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
                No emergency contacts yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Add at least 2 contacts to continue
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
              {contacts.map((contact, index) => (
                <Box
                  key={index}
                  sx={{
                    bgcolor: 'white',
                    borderRadius: 4,
                    p: 2.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#f3e8ff',
                      color: '#7c3aed',
                    }}
                  >
                    <Person sx={{ fontSize: 30 }} />
                  </Avatar>

                  {/* Contact Info */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                      {contact.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone sx={{ fontSize: 14, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {contact.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <People sx={{ fontSize: 14, color: '#7c3aed' }} />
                      <Typography variant="body2" sx={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 600 }}>
                        {contact.relationship}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleEditContact(index)}
                      sx={{
                        bgcolor: '#f3e8ff',
                        color: '#7c3aed',
                        '&:hover': { bgcolor: '#e9d5ff' },
                      }}
                    >
                      <Edit sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteContact(index)}
                      sx={{
                        bgcolor: '#fef2f2',
                        color: '#ef4444',
                        '&:hover': { bgcolor: '#fee2e2' },
                      }}
                    >
                      <Delete sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Add Contact Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<Add />}
            onClick={openAddDialog}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              py: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            Add Emergency Contact
          </Button>
        </Box>

        {/* Medical Information Section */}
        <Box sx={{ mb: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MedicalServices sx={{ color: '#ef4444', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Medical Information (Optional)
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 4,
              p: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {/* Blood Type */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                Blood Type
              </Typography>
              <TextField
                select
                fullWidth
                value={medicalInfo.bloodType}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, bloodType: e.target.value })}
                placeholder="Select blood type"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                  },
                }}
              >
                {bloodTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Allergies */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                Allergies
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={medicalInfo.allergies}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, allergies: e.target.value })}
                placeholder="e.g., Penicillin, Peanuts"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                  },
                }}
              />
            </Box>

            {/* Medical Conditions */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                Medical Conditions
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={medicalInfo.conditions}
                onChange={(e) => setMedicalInfo({ ...medicalInfo, conditions: e.target.value })}
                placeholder="e.g., Diabetes, Asthma"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f9fafb',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Fixed Bottom Save Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'white',
          borderTop: '1px solid #e2e8f0',
          p: 2,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="sm">
          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              py: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              '&:hover': {
                bgcolor: '#6d28d9',
              },
              '&:disabled': {
                bgcolor: '#cbd5e1',
              },
            }}
          >
            {saving ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Save Emergency Contacts'}
          </Button>
        </Container>
      </Box>

      {/* Add/Edit Contact Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingContact !== null ? 'Edit Contact' : 'Add Emergency Contact'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Name */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
              Name *
            </Typography>
            <TextField
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Phone */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
              Phone Number *
            </Typography>
            <TextField
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+977-9841234567"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Relationship */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
              Relationship *
            </Typography>
            <TextField
              select
              fullWidth
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="Select relationship"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            >
              {relationships.map((rel) => (
                <MenuItem key={rel} value={rel}>
                  {rel}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setShowAddDialog(false)}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddContact}
            sx={{
              bgcolor: '#7c3aed',
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            {editingContact !== null ? 'Save Changes' : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            textAlign: 'center',
          },
        }}
      >
        <DialogContent>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle sx={{ fontSize: 50, color: '#22c55e' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Emergency Contacts Saved!
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Your emergency contacts have been successfully saved and updated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleSuccessDialogClose}
            sx={{
              bgcolor: '#7c3aed',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 3,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}