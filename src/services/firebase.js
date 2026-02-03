import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBykM1SYNGuLpncw86QWH57_22K9f1S3AQ",
  authDomain: "safaride-f0e01.firebaseapp.com",
  projectId: "safaride-f0e01",
  storageBucket: "safaride-f0e01.firebasestorage.app",
  messagingSenderId: "192443865354",
  appId: "1:192443865354:web:81d0ebecf2cffdbc9e42f3",
  measurementId: "G-9L9ZTTH06J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore 
export const db = getFirestore(app);

export const storage = getStorage(app); 

export default app;