import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auth,
  firebaseSignUp,
  firebaseSignIn,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "./firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await firebaseSignUp(email, password, name);
      return { error: null };
    } catch (e: any) {
      return {
        error:
          e.message
            ?.replace("Firebase: ", "")
            .replace(/\(auth\/.*?\)\.?/, "")
            .trim() || "Sign up failed",
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await firebaseSignIn(email, password);
      return { error: null };
    } catch (e: any) {
      return {
        error:
          e.message
            ?.replace("Firebase: ", "")
            .replace(/\(auth\/.*?\)\.?/, "")
            .trim() || "Login failed",
      };
    }
  };

  const signOut = async () => {
    await firebaseSignOut();
  };

  return <Ctx.Provider value={{ user, loading, signUp, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
