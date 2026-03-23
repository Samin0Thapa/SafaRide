import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Write a notification for a specific user
export const sendNotification = async (userId, type, title, message, rideId = null) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      title,
      message,
      rideId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};