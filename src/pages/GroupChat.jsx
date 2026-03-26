import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import {
  Box,
  Container,
  Typography,
  IconButton,
  TextField,
  Avatar,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  Person,
} from '@mui/icons-material';

export default function GroupChat() {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const [user, setUser] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser && rideId) {
        checkAccess(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [rideId]);

  const checkAccess = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch ride data
      const rideDoc = await getDoc(doc(db, 'rides', rideId));
      
      if (!rideDoc.exists()) {
        alert('Ride not found!');
        navigate('/chat');
        return;
      }

      const ride = { id: rideDoc.id, ...rideDoc.data() };
      setRideData(ride);

      // Check if user is participant or creator
      const isCreator = ride.createdBy === userId;
      const isParticipant = Array.isArray(ride.participants) && 
                           ride.participants.some(p => 
                             (typeof p === 'object' && p.userId === userId) || 
                             p === userId
                           );
      
      if (!isCreator && !isParticipant) {
        alert('You must be a participant to access this chat!');
        navigate('/chat');
        return;
      }

      setIsParticipant(true);
      
      // Subscribe to messages
      subscribeToMessages();
      
    } catch (error) {
      console.error('Error checking access:', error);
      alert('Error loading chat');
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const messagesRef = collection(db, 'rides', rideId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesList);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    
    return unsubscribe;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = collection(db, 'rides', rideId, 'messages');
      
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || 'Unknown User',
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
  if (!timestamp) return '';

  try {
    const date = timestamp.toDate();
    const now = new Date();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;

    // Check if message is from today
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Check if message is from yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return timeStr;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
  } catch (e) {
    return '';
  }
};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  if (!isParticipant) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* Purple Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          px: 2,
          py: 2,
          borderRadius: '0 0 20px 20px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/chat')}
            sx={{ color: 'white' }}
          >
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {rideData?.title || 'Group Chat'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {rideData?.participants?.length || 0} participants
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.uid;
            
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                {!isOwnMessage && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#f3e8ff',
                      color: '#7c3aed',
                      fontSize: '0.85rem',
                      mr: 1,
                    }}
                  >
                    {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                )}
                
                <Box
                  sx={{
                    maxWidth: '70%',
                  }}
                >
                  {!isOwnMessage && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontSize: '0.75rem',
                        ml: 1,
                        mb: 0.5,
                        display: 'block',
                      }}
                    >
                      {message.senderName}
                    </Typography>
                  )}
                  
                  <Paper
                    sx={{
                      bgcolor: isOwnMessage ? '#7c3aed' : 'white',
                      color: isOwnMessage ? 'white' : '#1e293b',
                      px: 2,
                      py: 1.5,
                      borderRadius: isOwnMessage
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                      {message.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        opacity: 0.7,
                        display: 'block',
                        textAlign: 'right',
                        mt: 0.5,
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box
        sx={{
          bgcolor: 'white',
          borderTop: '1px solid #e5e7eb',
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 6,
                bgcolor: '#f9fafb',
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: '#7c3aed',
              color: 'white',
              width: 48,
              height: 48,
              '&:hover': {
                bgcolor: '#6d28d9',
              },
              '&:disabled': {
                bgcolor: '#cbd5e1',
                color: '#94a3b8',
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}