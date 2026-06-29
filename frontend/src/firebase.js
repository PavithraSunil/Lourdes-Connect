import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCEyYdjPmMMBAEQxQRvds2MrRnCnrv4fBw",
    authDomain: "lourdeconnect.firebaseapp.com",
    projectId: "lourdeconnect",
    storageBucket: "lourdeconnect.firebasestorage.app",
    messagingSenderId: "1043909971608",
    appId: "1:1043909971608:web:7d338988620a760e200aed",
    measurementId: "G-C27G5MEEKN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;