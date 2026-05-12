// Firebase Configuration - Aaron Air Care Engineering
// Live Config Integrated

const firebaseConfig = {
  apiKey: "AIzaSyDz_CXzuznjEvDtq4W0J__lpv5RecmaONM",
  authDomain: "aaronaircare.firebaseapp.com",
  projectId: "aaronaircare",
  storageBucket: "aaronaircare.firebasestorage.app",
  messagingSenderId: "528466925316",
  appId: "1:528466925316:web:11e701ce8526fc42172251",
  measurementId: "G-5C6Y2JJMWM"
};

// Initialize Firebase (Compat Version)
let db, auth;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  
  // Ultra-Stable connection for industrial networks
  db.settings({
    experimentalForceLongPolling: true
  });

  auth = firebase.auth();
  console.log("Aaron Air Care: Firebase Backend Active (Ultra-Stable Mode)");
}
