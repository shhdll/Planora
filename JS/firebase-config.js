import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRveCvpIB6_1r3xVWQmoN9KTkWpIafeh4",
  authDomain: "planora-f2a2b.firebaseapp.com",
  projectId: "planora-f2a2b",
  storageBucket: "planora-f2a2b.firebasestorage.app",
  messagingSenderId: "892064755158",
  appId: "1:892064755158:web:f44f6526b490892b2c0877",
  measurementId: "G-15WHZM6YHF",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
