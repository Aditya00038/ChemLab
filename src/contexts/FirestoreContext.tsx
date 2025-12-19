"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export type Chemical = {
  id: string;
  name: string;
  formula: string;
  quantity: number;
  unit: 'g' | 'mL' | 'kg' | 'L';
  lastUpdated: string;
  casNumber: string;
  category?: string;
};

export type Equipment = {
  id: string;
  name: string;
  totalQuantity: number;
  // availableQuantity removed - always calculate from usage logs
  lastUsed: string;
  category: string;
  condition?: 'good' | 'fair' | 'damaged';
};

export type UsageLog = {
  id: string;
  userId: string;
  userEmail: string;
  itemId: string;
  itemName: string;
  itemType: 'chemical' | 'equipment';
  quantity: number;
  unit?: string;
  action: 'Used' | 'Checked Out' | 'Returned' | 'Reported Damaged' | 'Inventory Update';
  timestamp: string;
  notes?: string;
  isTrialMode?: boolean;
};

type FirestoreContextType = {
  chemicals: Chemical[];
  equipment: Equipment[];
  usageLogs: UsageLog[];
  isTrialMode: boolean;
  setIsTrialMode: (value: boolean) => void;
  addChemical: (chemical: Omit<Chemical, 'id'>) => Promise<void>;
  updateChemical: (id: string, chemical: Partial<Chemical>) => Promise<void>;
  deleteChemical: (id: string) => Promise<void>;
  addEquipment: (equip: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, equip: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  addUsageLog: (log: Omit<UsageLog, 'id' | 'timestamp' | 'isTrialMode'>) => Promise<void>;
  loading: boolean;
};

const FirestoreContext = createContext<FirestoreContextType | undefined>(undefined);

export function FirestoreProvider({ children }: { children: React.ReactNode }) {
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [isTrialMode, setIsTrialMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('trialMode') === 'true';
    }
    return false;
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Update localStorage when trial mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trialMode', isTrialMode.toString());
    }
  }, [isTrialMode]);

  // Reset trial mode on session end (page unload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTrialMode) {
        localStorage.setItem('trialMode', 'false');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTrialMode]);

  // Listen to Firestore collections
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubChemicals = onSnapshot(
      query(collection(db, 'chemicals')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chemical[];
        setChemicals(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching chemicals:', error);
        setLoading(false);
      }
    );

    const unsubEquipment = onSnapshot(
      query(collection(db, 'equipment')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Equipment[];
        setEquipment(data);
      },
      (error) => {
        console.error('Error fetching equipment:', error);
      }
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'usageLogs')),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UsageLog[];
        // Sort by timestamp descending
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setUsageLogs(data);
      },
      (error) => {
        console.error('Error fetching logs:', error);
      }
    );

    return () => {
      unsubChemicals();
      unsubEquipment();
      unsubLogs();
    };
  }, [user]);

  const showTrialWarning = () => {
    if (isTrialMode) {
      toast({
        title: "Trial Mode Active",
        description: "Changes are simulated and won't affect real data.",
        variant: "default",
      });
    }
  };

  const addChemical = async (chemical: Omit<Chemical, 'id'>) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await addDoc(collection(db, 'chemicals'), chemical);
      toast({ title: "Success", description: "Chemical added successfully." });
    } catch (error) {
      console.error('Error adding chemical:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to add chemical." });
    }
  };

  const updateChemical = async (id: string, chemical: Partial<Chemical>) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await updateDoc(doc(db, 'chemicals', id), chemical);
      toast({ title: "Success", description: "Chemical updated successfully." });
    } catch (error) {
      console.error('Error updating chemical:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update chemical." });
    }
  };

  const deleteChemical = async (id: string) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await deleteDoc(doc(db, 'chemicals', id));
      toast({ title: "Success", description: "Chemical deleted successfully." });
    } catch (error) {
      console.error('Error deleting chemical:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete chemical." });
    }
  };

  const addEquipment = async (equip: Omit<Equipment, 'id'>) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await addDoc(collection(db, 'equipment'), equip);
      toast({ title: "Success", description: "Equipment added successfully." });
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to add equipment." });
    }
  };

  const updateEquipment = async (id: string, equip: Partial<Equipment>) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await updateDoc(doc(db, 'equipment', id), equip);
      toast({ title: "Success", description: "Equipment updated successfully." });
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update equipment." });
    }
  };

  const deleteEquipment = async (id: string) => {
    if (isTrialMode) {
      showTrialWarning();
      return;
    }
    try {
      await deleteDoc(doc(db, 'equipment', id));
      toast({ title: "Success", description: "Equipment deleted successfully." });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete equipment." });
    }
  };

  const addUsageLog = async (log: Omit<UsageLog, 'id' | 'timestamp' | 'isTrialMode'>) => {
    const newLog = {
      ...log,
      timestamp: new Date().toISOString(),
      isTrialMode: isTrialMode,
    };

    if (isTrialMode) {
      showTrialWarning();
      // In trial mode, just add to local state temporarily
      setUsageLogs(prev => [{ id: `trial-${Date.now()}`, ...newLog }, ...prev]);
      return;
    }

    try {
      await addDoc(collection(db, 'usageLogs'), newLog);
      toast({ title: "Success", description: "Activity logged successfully." });
    } catch (error) {
      console.error('Error adding log:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to log activity." });
    }
  };

  return (
    <FirestoreContext.Provider
      value={{
        chemicals,
        equipment,
        usageLogs,
        isTrialMode,
        setIsTrialMode,
        addChemical,
        updateChemical,
        deleteChemical,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        addUsageLog,
        loading,
      }}
    >
      {children}
    </FirestoreContext.Provider>
  );
}

export function useFirestore() {
  const context = useContext(FirestoreContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirestoreProvider');
  }
  return context;
}
