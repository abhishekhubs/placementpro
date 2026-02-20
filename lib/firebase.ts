// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAuth, reactNativeLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDEi6arXOX07vVLT0IkPIvF2i0qEk9zrBI",
    authDomain: "placementproauth.firebaseapp.com",
    projectId: "placementproauth",
    storageBucket: "placementproauth.firebasestorage.app",
    messagingSenderId: "705670130019",
    appId: "1:705670130019:web:a3a007191163638095cb56",
    measurementId: "G-F5K3E2WBWP"
};

const app = initializeApp(firebaseConfig);

// Use reactNativeLocalPersistence for persistent login sessions on mobile
// (Firebase v11+ replaced getReactNativePersistence with this built-in constant)
export const auth = initializeAuth(app, {
    persistence: reactNativeLocalPersistence,
});

export default app;
