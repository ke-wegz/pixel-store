import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  async function login(email: string, password: string) {
    if (!auth) {
      throw new Error("Firebase is not configured yet.");
    }
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }

  return { user, ready, login, logout, configured: isFirebaseConfigured };
}
