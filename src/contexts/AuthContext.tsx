"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, getAllowedEmails } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAllowedUser: (email: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const checkIsAdmin = (email: string): boolean => {
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    return adminEmails.includes(email.toLowerCase());
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isAllowedUser(user.email || '')) {
        setUser(user);
        setIsAdmin(checkIsAdmin(user.email || ''));
      } else if (user) {
        // User is logged in but not allowed
        firebaseSignOut(auth);
        setUser(null);
        setIsAdmin(false);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Your email is not authorized to access this application.",
        });
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const isAllowedUser = (email: string): boolean => {
    const allowedEmails = getAllowedEmails();
    return allowedEmails.includes(email.toLowerCase());
  };

  const signIn = async (email: string, password: string) => {
    if (!isAllowedUser(email)) {
      throw new Error('Your email is not authorized to access this application.');
    }
    await signInWithEmailAndPassword(auth, email, password);
    router.push('/dashboard');
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    if (!isAllowedUser(result.user.email || '')) {
      await firebaseSignOut(auth);
      throw new Error('Your email is not authorized to access this application.');
    }
    
    router.push('/dashboard');
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/home');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signInWithGoogle, signOut, isAllowedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
