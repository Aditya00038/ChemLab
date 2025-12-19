
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { AlertCircle, CornerUpLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

type BorrowedItem = {
    id: string;
    name: string;
    category: string;
    quantity: number;
}

type ActionQuantities = {
    returnQty: string;
    damageQty: string;
    damageNote: string;
}

export default function MyActivityPage() {
    const { equipment, usageLogs, addUsageLog, loading } = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();
    const [actionQuantities, setActionQuantities] = useState<Record<string, ActionQuantities>>({});

    const myBorrowedItems = useMemo((): BorrowedItem[] => {
        if (!user) return [];
        
        const borrowedMap: Record<string, number> = {};

        usageLogs
            .filter(log => log.userId === user.uid && log.itemType === 'equipment')
            .forEach(log => {
                if (log.action === 'Checked Out') {
                    borrowedMap[log.itemId] = (borrowedMap[log.itemId] || 0) + log.quantity;
                } else if (log.action === 'Returned' || log.action === 'Reported Damaged') {
                    borrowedMap[log.itemId] = (borrowedMap[log.itemId] || 0) - log.quantity;
                }
            });

        return Object.entries(borrowedMap)
            .filter(([, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => {
                const item = equipment.find(e => e.id === itemId);
                if (!item) return null;
                return {
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    quantity
                };
            })
            .filter((item): item is BorrowedItem => item !== null);
    }, [usageLogs, equipment, user]);

    const handleQuantityChange = (itemId: string, field: keyof ActionQuantities, value: string) => {
        setActionQuantities(prev => {
            const currentValues = prev[itemId] || { returnQty: '', damageQty: '', damageNote: '' };
            return {
                ...prev,
                [itemId]: {
                    ...currentValues,
                    [field]: value,
                }
            };
        });
    }

    const validateAndParseQty = (qtyString: string | undefined, max: number, action: string): number | null => {
        if (!qtyString) {
            toast({ variant: "destructive", title: `Invalid Quantity`, description: `Please enter a quantity to ${action}.` });
            return null;
        }
        const quantity = parseInt(qtyString, 10);
        if (isNaN(quantity) || quantity <= 0) {
            toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a positive number." });
            return null;
        }
        if (quantity > max) {
            toast({ variant: "destructive", title: "Invalid Quantity", description: `You can't ${action} more items than you have borrowed (${max}).` });
            return null;
        }
        return quantity;
    }


    const handleReturn = async (itemId: string) => {
        const borrowedItem = myBorrowedItems.find(b => b.id === itemId);
        if (!borrowedItem || !user) return;

        const quantityToReturn = validateAndParseQty(actionQuantities[itemId]?.returnQty, borrowedItem.quantity, 'return');
        if (quantityToReturn === null) return;
        
        await addUsageLog({
            userId: user.uid,
            userEmail: user.email || '',
            itemId: itemId,
            itemName: borrowedItem.name,
            itemType: 'equipment',
            quantity: quantityToReturn,
            action: 'Returned',
            unit: 'units',
        });

        setActionQuantities(prev => ({ ...prev, [itemId]: { ...prev[itemId], returnQty: '' } }));
        toast({ title: "Item(s) Returned", description: `You have returned ${quantityToReturn} unit(s) of ${borrowedItem.name}.` });
    };

    const handleReportDamaged = async (itemId: string) => {
        const borrowedItem = myBorrowedItems.find(b => b.id === itemId);
        if (!borrowedItem || !user) return;

        const { damageQty, damageNote } = actionQuantities[itemId] || {};
        
        const quantityToReport = validateAndParseQty(damageQty, borrowedItem.quantity, 'report as damaged');
        if (quantityToReport === null) return;

        if (!damageNote || damageNote.trim() === '') {
            toast({ variant: "destructive", title: "Note Required", description: "Please provide a reason for the damage." });
            return;
        }

        await addUsageLog({
            userId: user.uid,
            userEmail: user.email || '',
            itemId: itemId,
            itemName: borrowedItem.name,
            itemType: 'equipment',
            quantity: quantityToReport,
            action: 'Reported Damaged',
            unit: 'units',
            notes: damageNote,
        });

        setActionQuantities(prev => ({ ...prev, [itemId]: { returnQty: '', damageQty: '', damageNote: '' } }));
        toast({title: "Damage Reported", description: `${quantityToReport} unit(s) of ${borrowedItem.name} reported as damaged.`});
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
                <p className="text-muted-foreground">Manage equipment you have checked out.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="ml-2 text-muted-foreground">Loading activity...</p>
                </div>
            ) : (
            <Card>
                <CardHeader>
                    <CardTitle>Currently Borrowed Equipment</CardTitle>
                    <CardDescription>
                        Here is a list of all equipment currently checked out under your name.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {myBorrowedItems.length > 0 ? (
                        myBorrowedItems.map((item) => {
                            const quantities = actionQuantities[item.id] || { returnQty: '', damageQty: '', damageNote: '' };
                            return (
                                <Card key={item.id} className="p-4">
                                    <div className="grid gap-6 md:grid-cols-3 md:items-start">
                                        <div className="md:col-span-1">
                                            <h3 className="text-lg font-semibold">{item.name}</h3>
                                            <p className="text-muted-foreground">{item.category}</p>
                                            <p className="text-2xl font-bold mt-2">{item.quantity} <span className="text-sm font-normal text-muted-foreground">unit(s) borrowed</span></p>
                                        </div>
                                        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                                           <div className="space-y-2 rounded-md border p-3">
                                                <Label htmlFor={`return-${item.id}`} className="text-xs font-medium">Return Items</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id={`return-${item.id}`}
                                                        type="number"
                                                        placeholder="Qty"
                                                        className="h-9 w-24"
                                                        value={quantities.returnQty}
                                                        onChange={e => handleQuantityChange(item.id, 'returnQty', e.target.value)}
                                                        min={1}
                                                        max={item.quantity}
                                                    />
                                                    <Button
                                                        className="flex-1"
                                                        onClick={() => handleReturn(item.id)}
                                                        disabled={!quantities.returnQty || parseInt(quantities.returnQty || '0') <= 0}
                                                    >
                                                        <CornerUpLeft className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Return</span>
                                                    </Button>
                                                </div>
                                                <Button size="sm" variant="outline" className="w-full h-8" onClick={() => handleQuantityChange(item.id, 'returnQty', String(item.quantity))}>Return All</Button>
                                            </div>
                                             <div className="space-y-2 rounded-md border border-destructive/50 p-3">
                                                <Label htmlFor={`damaged-${item.id}`} className="text-xs font-medium text-destructive">Report Damaged Items</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id={`damaged-${item.id}`}
                                                        type="number"
                                                        placeholder="Qty"
                                                        className="h-9 w-24"
                                                        value={quantities.damageQty}
                                                        onChange={e => handleQuantityChange(item.id, 'damageQty', e.target.value)}
                                                        min={1}
                                                        max={item.quantity}
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                className="flex-1"
                                                                disabled={!quantities.damageQty || parseInt(quantities.damageQty || '0') <= 0}
                                                            >
                                                                <AlertCircle className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Report</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Report Damaged Item(s)?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                   You are about to report <span className="font-bold">{quantities.damageQty} unit(s)</span> of <span className="font-bold">{item.name}</span> as damaged. This will permanently remove them from the inventory.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                             <div className="grid gap-2">
                                                                <Label htmlFor={`damage-note-${item.id}`}>Reason for Damage (Required)</Label>
                                                                <Textarea 
                                                                    id={`damage-note-${item.id}`}
                                                                    placeholder="e.g., Dropped during experiment, equipment malfunctioned..." 
                                                                    value={quantities.damageNote}
                                                                    onChange={e => handleQuantityChange(item.id, 'damageNote', e.target.value)}
                                                                />
                                                            </div>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleReportDamaged(item.id)} disabled={!quantities.damageNote}>
                                                                    Confirm Report
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                                 <p className="text-xs text-muted-foreground mt-2">Report items that were damaged during use.</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                             <p className="text-muted-foreground">You have no equipment currently checked out.</p>
                             <Button asChild variant="link" className="mt-2">
                                <Link href="/equipment">Browse Equipment</Link>
                             </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}
        </div>
    );
}

    