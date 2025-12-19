"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, writeBatch, doc } from 'firebase/firestore';
import { initialChemicals, initialEquipment } from '@/lib/initialData';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InitDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const initializeDatabase = async () => {
    setLoading(true);
    setStatus('idle');
    
    try {
      // Check if data already exists
      const chemicalsSnapshot = await getDocs(collection(db, 'chemicals'));
      const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
      
      if (!chemicalsSnapshot.empty || !equipmentSnapshot.empty) {
        setStatus('error');
        setMessage('Database already has data. Clear it first before initializing.');
        setLoading(false);
        return;
      }

      const batch = writeBatch(db);
      let chemCount = 0;
      let equipCount = 0;

      // Add chemicals
      initialChemicals.forEach((name) => {
        const chemRef = doc(collection(db, 'chemicals'));
        batch.set(chemRef, {
          name: name,
          formula: 'N/A',
          quantity: Math.floor(Math.random() * 500) + 100, // Random quantity between 100-600
          unit: Math.random() > 0.5 ? 'g' : 'mL',
          lastUpdated: new Date().toISOString().split('T')[0],
          casNumber: 'N/A',
          category: 'General',
        });
        chemCount++;
      });

      // Add equipment
      initialEquipment.forEach((name) => {
        const equipRef = doc(collection(db, 'equipment'));
        const total = Math.floor(Math.random() * 20) + 5; // Random total between 5-25
        batch.set(equipRef, {
          name: name,
          totalQuantity: total,
          // availableQuantity removed - always calculated from usage logs
          lastUsed: new Date().toISOString().split('T')[0],
          category: 'Laboratory Equipment',
          condition: 'good',
        });
        equipCount++;
      });

      // Commit the batch
      await batch.commit();

      setStatus('success');
      setMessage(`Successfully added ${chemCount} chemicals and ${equipCount} equipment items!`);
    } catch (error) {
      console.error('Error initializing database:', error);
      setStatus('error');
      setMessage('Failed to initialize database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure? This will delete ALL data from the database!')) {
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const batch = writeBatch(db);

      // Delete all chemicals
      const chemicalsSnapshot = await getDocs(collection(db, 'chemicals'));
      chemicalsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all equipment
      const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
      equipmentSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all logs
      const logsSnapshot = await getDocs(collection(db, 'usageLogs'));
      logsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      setStatus('success');
      setMessage('Database cleared successfully!');
    } catch (error) {
      console.error('Error clearing database:', error);
      setStatus('error');
      setMessage('Failed to clear database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Database Initialization</h1>
        <p className="text-muted-foreground">
          Set up your database with initial chemicals and equipment data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Initialize Database
          </CardTitle>
          <CardDescription>
            This will populate your database with all chemicals and equipment from your lists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-medium">What will be added:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>{initialChemicals.length} chemicals with random initial quantities</li>
                <li>{initialEquipment.length} equipment items with availability tracking</li>
                <li>All items will be categorized and ready to use</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={initializeDatabase} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Initialize Database
                  </>
                )}
              </Button>

              <Button 
                onClick={clearDatabase} 
                disabled={loading}
                variant="destructive"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear Database'
                )}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> You only need to do this once. If data already exists, clear it first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
