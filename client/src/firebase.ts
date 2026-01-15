import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// --- YOUR NEW WORKING CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAqCLeCogvrIgFFF6MR1DKWNmym6B2Jz6g",
  authDomain: "torrent-site-a8f60.firebaseapp.com",
  projectId: "torrent-site-a8f60",
  storageBucket: "torrent-site-a8f60.firebasestorage.app",
  messagingSenderId: "755876049030",
  appId: "1:755876049030:web:00d7110d1f06da4e7ae107",
  measurementId: "G-3XWGZJ7QLC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export the Auth tools so the login button works
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();