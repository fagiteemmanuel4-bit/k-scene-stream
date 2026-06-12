import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBE7zmTq0PdI24uc8cStU2K6QLaG7YbVgA",
  authDomain: "k-scene.firebaseapp.com",
  projectId: "k-scene",
  storageBucket: "k-scene.firebasestorage.app",
  messagingSenderId: "81922606463",
  appId: "1:81922606463:web:f7796fa9d62d6039bf064a",
  measurementId: "G-WEV4YKQ0W5",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { User };

// Disable email verification — users log in immediately after signup
export async function firebaseSignUp(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function firebaseSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function firebaseSignOut() {
  await fbSignOut(auth);
}

export { onAuthStateChanged };
