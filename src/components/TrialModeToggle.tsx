"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFirestore } from '@/contexts/FirestoreContext';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TrialModeToggle() {
  const { isTrialMode, setIsTrialMode } = useFirestore();
  const [showDialog, setShowDialog] = useState(false);

  const handleToggle = () => {
    if (!isTrialMode) {
      // Switching TO trial mode - show confirmation
      setShowDialog(true);
    } else {
      // Switching OFF trial mode - just do it
      setIsTrialMode(false);
    }
  };

  const confirmTrialMode = () => {
    setIsTrialMode(true);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant={isTrialMode ? "destructive" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
      >
        {isTrialMode ? (
          <>
            <AlertTriangle className="h-4 w-4" />
            Trial Mode
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Live Mode
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Enable Trial Mode?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-4">
                <p>
                  <strong>Trial Mode</strong> lets you explore the application without affecting real data.
                </p>
                
                <div className="rounded-lg border bg-muted p-4 space-y-2">
                  <p className="font-medium text-sm">In Trial Mode:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>All changes are simulated</li>
                    <li>No data is written to the database</li>
                    <li>Perfect for learning and testing</li>
                    <li>Automatically turns off when you close the browser</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
                    Auto-off on session end
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  You can switch back to <strong>Live Mode</strong> anytime to work with real data.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTrialMode} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Enable Trial Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
