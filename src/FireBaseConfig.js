import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDTTuy-FTy1H9HEYavckwcEAnKu3rbM0f0",
    authDomain: "finalyearfb.firebaseapp.com",
    projectId: "finalyearfb",
    storageBucket: "finalyearfb.appspot.com",
    messagingSenderId: "456393059933",
    appId: "1:456393059933:web:2349e816b2158fe600a7b4"
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  export { auth, db, app };