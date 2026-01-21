// Firebase Compat Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDHl8gVivLNCKlfUiTYVHsS0PeicImp5Uk",
    authDomain: "seditor-3f47e.firebaseapp.com",
    projectId: "seditor-3f47e",
    storageBucket: "seditor-3f47e.firebasestorage.app",
    messagingSenderId: "1093352031536",
    appId: "1:1093352031536:web:efd7b1ed2a12e63afa34f5"
};

// Initialize Firebase (Compat)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Create global service references
const db = firebase.firestore();
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
const storage = firebase.storage();
