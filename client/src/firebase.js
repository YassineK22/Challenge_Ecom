// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB58jTkoPKdhxIQX_yB-9InDYdmyE8HITM",
  authDomain: "challenge-ecom-a703e.firebaseapp.com",
  projectId: "challenge-ecom-a703e",
  storageBucket: "challenge-ecom-a703e.firebasestorage.app",
  messagingSenderId: "510233415409",
  appId: "1:510233415409:web:ba0567d1aa50ccab982350",
  measurementId: "G-GVQQKP4JKP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { app, db, auth };