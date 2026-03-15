import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  TextField,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  ArrowBack,
  Star,
  StarBorder,
  CheckCircle,
  DirectionsBike,
  Person,
} from '@mui/icons-material';

function StarPicker({ value, onChange, size = 40 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          sx={{ cursor: 'pointer', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.2)' } }}
        >
          {star <= (hovered || value) ? (
            <Star sx={{ fontSize: size, color: '#f59e0b' }} />
          ) : (
            <StarBorder sx={{ fontSize: size, color: '#cbd5e1' }} />
          )}
        </Box>
      ))}
    </Box>
  );
}

const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

export default function RateRide() {
  const navigate = useNavigate();
  const { rideId } = useParams();

  const [user, setUser] = useState(null);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rideRating, setRideRating] = useState(0);
  const [organizerRating, setOrganizerRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!rideId) return;
    fetchRide();
  }, [rideId]);

  useEffect(() => {
    if (user && rideId) checkAlreadyRated();
  }, [user, rideId]);

  const fetchRide = async () => {
    try {
      setLoading(true);
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      if (rideDoc.exists()) {
        setRide({ id: rideDoc.id, ...rideDoc.data() });
      } else {
        setError('Ride not found.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load ride.');
    } finally {
      setLoading(false);
    }
  };

  const checkAlreadyRated = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('rideId', '==', rideId),
        where('reviewerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setAlreadyRated(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    if (rideRating === 0) { setError('Please rate the ride.'); return; }
    if (organizerRating === 0) { setError('Please rate the organizer.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        rideId,
        organizerId: ride.createdBy,
        organizerName: ride.createdByName || 'Unknown',
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Anonymous',
        rideRating,
        organizerRating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      await recalculateOrganizerRating(ride.createdBy);
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const recalculateOrganizerRating = async (organizerId) => {
    try {
      const q = query(collection(db, 'reviews'), where('organizerId', '==', organizerId));
      const snap = await getDocs(q);
      if (snap.empty) return;
      let total = 0;
      snap.forEach((d) => { total += d.data().organizerRating || 0; });
      const avg = parseFloat((total / snap.size).toFixed(1));
      await updateDoc(doc(db, 'users', organizerId), {
        rating: avg,
        totalReviews: snap.size,
      });
    } catch (e) {
      console.error('Rating recalc error:', e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  if (alreadyRated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', borderRadius: '0 0 30px 30px', px: 3, pt: 3, pb: 6, color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', p: 0 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Rate Ride</Typography>
          </Box>
        </Box>
        <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', textAlign: 'center', p: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>Already Rated!</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>You have already submitted a review for this ride.</Typography>
            <Button fullWidth variant="contained" onClick={() => navigate('/dashboard')}
              sx={{ bgcolor: '#7c3aed', py: 1.5, textTransform: 'none', fontWeight: 600, borderRadius: 3, '&:hover': { bgcolor: '#6d28d9' } }}>
              Back to Dashboard
            </Button>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 4 }}>

      {/* Purple Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', borderRadius: '0 0 30px 30px', px: 3, pt: 3, pb: 6, color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', p: 0 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Rate Your Ride</Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.85, ml: 5 }}>
          Share your experience with the community
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -4, px: 2, position: 'relative', zIndex: 10 }}>

        {/* Ride Info Card */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DirectionsBike sx={{ fontSize: 30, color: '#7c3aed' }} />
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>{ride?.title || 'Ride'}</Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>{ride?.meetingPoint} → {ride?.destination}</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{ride?.date} • {ride?.rideType}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rate the Ride */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DirectionsBike sx={{ fontSize: 22, color: '#f59e0b' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Rate the Ride</Typography>
            </Box>
            <StarPicker value={rideRating} onChange={setRideRating} size={44} />
            {rideRating > 0 && (
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1.5, fontWeight: 700, color: '#f59e0b', fontSize: '1rem' }}>
                {ratingLabels[rideRating]}
              </Typography>
            )}
            {rideRating === 0 && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#94a3b8', mt: 1 }}>
                Tap a star to rate
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Rate the Organizer */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Avatar sx={{ width: 40, height: 40, bgcolor: '#7c3aed', fontSize: '1rem', fontWeight: 700 }}>
                {ride?.createdByName?.charAt(0)?.toUpperCase() || 'O'}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>Rate the Organizer</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>{ride?.createdByName || 'Unknown'}</Typography>
              </Box>
            </Box>
            <StarPicker value={organizerRating} onChange={setOrganizerRating} size={44} />
            {organizerRating > 0 && (
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 1.5, fontWeight: 700, color: '#7c3aed', fontSize: '1rem' }}>
                {ratingLabels[organizerRating]}
              </Typography>
            )}
            {organizerRating === 0 && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#94a3b8', mt: 1 }}>
                Tap a star to rate
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Written Review */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Person sx={{ fontSize: 22, color: '#7c3aed' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>Write a Review</Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Optional — share details with the community</Typography>
              </Box>
            </Box>
            <TextField
              fullWidth multiline rows={4}
              placeholder="How was the ride? Was the organizer well-prepared? Any tips for others..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ maxLength: 500 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3, bgcolor: '#f8fafc', fontSize: '0.95rem',
                  '&:hover fieldset': { borderColor: '#7c3aed' },
                  '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
                },
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', color: '#94a3b8', mt: 0.5 }}>
              {comment.length}/500
            </Typography>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, px: 2, py: 1.5, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>{error}</Typography>
          </Box>
        )}

        {/* Rating Summary */}
        {(rideRating > 0 || organizerRating > 0) && (
          <Card sx={{ borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', mb: 3, bgcolor: '#f3e8ff' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>Your Rating Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#7c3aed' }}>{rideRating > 0 ? rideRating : '–'}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3 }}>
                    {[1,2,3,4,5].map((s) => <Star key={s} sx={{ fontSize: 14, color: s <= rideRating ? '#f59e0b' : '#e2e8f0' }} />)}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Ride</Typography>
                </Box>
                <Box sx={{ width: '1px', bgcolor: '#e9d5ff' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#7c3aed' }}>{organizerRating > 0 ? organizerRating : '–'}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3 }}>
                    {[1,2,3,4,5].map((s) => <Star key={s} sx={{ fontSize: 14, color: s <= organizerRating ? '#f59e0b' : '#e2e8f0' }} />)}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Organizer</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          fullWidth variant="contained" onClick={handleSubmit}
          disabled={submitting || rideRating === 0 || organizerRating === 0}
          sx={{
            bgcolor: '#7c3aed', py: 1.75, fontSize: '1rem', fontWeight: 700,
            textTransform: 'none', borderRadius: 3,
            boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
            '&:hover': { bgcolor: '#6d28d9' },
            '&:disabled': { bgcolor: '#cbd5e1', boxShadow: 'none' },
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
        </Button>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#94a3b8', mt: 1.5 }}>
          Your review helps build trust in the SafaRide community
        </Typography>
      </Container>

      {/* Success Dialog */}
      <Dialog
        open={showSuccess}
        onClose={() => { setShowSuccess(false); navigate('/dashboard'); }}
        PaperProps={{ sx: { borderRadius: 4, px: 2, py: 1, maxWidth: '380px' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2 }}>
            <CheckCircle sx={{ fontSize: 55, color: '#10b981' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Review Submitted!</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>Thank you for your feedback.</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>Your review helps the community make better riding decisions.</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f59e0b' }}>{rideRating}★</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Ride</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#7c3aed' }}>{organizerRating}★</Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Organizer</Typography>
            </Box>
          </Box>
          <Button fullWidth variant="contained"
            onClick={() => { setShowSuccess(false); navigate('/dashboard'); }}
            sx={{ bgcolor: '#7c3aed', py: 1.5, fontWeight: 600, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}>
            Back to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}