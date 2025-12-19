
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Minus, Plus, CornerUpLeft, LogIn, Loader2, Download, Lock, Unlock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type SortOption = 'name-asc' | 'name-desc' | 'last-used-asc' | 'last-used-desc';

export default function EquipmentPage() {
  const { equipment, usageLogs, addUsageLog, loading } = useFirestore();
  const { user, isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const { toast } = useToast();

  const [checkoutQuantities, setCheckoutQuantities] = useState<Record<string, number>>({});
  const [returnQuantities, setReturnQuantities] = useState<Record<string, string>>({});


  const equipmentStatus = useMemo(() => {
    const statuses: Record<string, { inUse: number; available: number, borrowedByMe: number }> = {};

    equipment.forEach(item => {
        const allCheckedOut = usageLogs
            .filter(log => log.itemId === item.id && log.action === 'Checked Out')
            .reduce((sum, log) => sum + log.quantity, 0);
        
        const allReturned = usageLogs
            .filter(log => log.itemId === item.id && (log.action === 'Returned' || log.action === 'Reported Damaged'))
            .reduce((sum, log) => sum + log.quantity, 0);

        const myCheckedOut = usageLogs
            .filter(log => log.itemId === item.id && log.userId === user?.uid && log.action === 'Checked Out')
            .reduce((sum, log) => sum + log.quantity, 0);

        const myReturned = usageLogs
            .filter(log => log.itemId === item.id && log.userId === user?.uid && (log.action === 'Returned' || log.action === 'Reported Damaged'))
            .reduce((sum, log) => sum + log.quantity, 0);

        const inUse = allCheckedOut - allReturned;
        statuses[item.id] = {
            inUse: inUse,
            available: item.totalQuantity - inUse,
            borrowedByMe: myCheckedOut - myReturned,
        };
    });
    return statuses;
  }, [equipment, usageLogs, user]);
  
  const handleCheckout = async (id: string) => {
    const quantity = checkoutQuantities[id] || 1;
    if (quantity <= 0) return;
    
    const item = equipment.find(i => i.id === id);
    const status = equipmentStatus[id];
    if (!item || !status || quantity > status.available) {
        toast({ variant: 'destructive', title: "Not enough items available" });
        return;
    }

    await addUsageLog({
        userId: user?.uid || '',
        userEmail: user?.email || '',
        itemId: id,
        itemName: item.name,
        itemType: 'equipment',
        quantity: quantity,
        action: 'Checked Out',
        unit: 'units',
    });
    setCheckoutQuantities(prev => ({...prev, [id]: 1}));
    toast({ title: "Item Checked Out", description: `You have checked out ${quantity} unit(s) of ${item.name}.` });
  };
  
    const handleReturn = async (itemId: string) => {
        const itemStatus = equipmentStatus[itemId];
        if (!itemStatus || itemStatus.borrowedByMe <= 0) return;

        const quantityToReturnStr = returnQuantities[itemId];
        if (!quantityToReturnStr) {
             toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a quantity to return." });
             return;
        }

        const quantityToReturn = parseInt(quantityToReturnStr, 10);
        if (isNaN(quantityToReturn) || quantityToReturn <= 0) {
            toast({ variant: "destructive", title: "Invalid Quantity", description: "Please enter a positive number." });
            return;
        }

        if (quantityToReturn > itemStatus.borrowedByMe) {
            toast({ variant: "destructive", title: "Invalid Quantity", description: `You can't return more than you have borrowed (${itemStatus.borrowedByMe}).` });
            return;
        }

        const item = equipment.find(e => e.id === itemId);
        await addUsageLog({
            userId: user?.uid || '',
            userEmail: user?.email || '',
            itemId: itemId,
            itemName: item?.name || '',
            itemType: 'equipment',
            quantity: quantityToReturn,
            action: 'Returned',
            unit: 'units',
        });
        setReturnQuantities(prev => ({...prev, [itemId]: ''}));
        toast({ title: "Item(s) Returned", description: `You returned ${quantityToReturn} unit(s).` });
    };

  const filteredAndSortedEquipment = useMemo(() => {
    return equipment
      .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
      .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
      .filter(item => {
        if (statusFilter === 'all') return true;
        const status = equipmentStatus[item.id];
        if (!status) return false;
        
        if (statusFilter === 'available') return status.available > 0;
        if (statusFilter === 'in_use') return status.inUse > 0;
        return false;
      })
      .sort((a, b) => {
        const statusA = equipmentStatus[a.id];
        const statusB = equipmentStatus[b.id];
        const aBorrowed = statusA ? statusA.borrowedByMe > 0 : false;
        const bBorrowed = statusB ? statusB.borrowedByMe > 0 : false;

        if (aBorrowed && !bBorrowed) return -1;
        if (!aBorrowed && bBorrowed) return 1;

        switch (sortOption) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'last-used-asc': return new Date(a.lastUsed || 0).getTime() - new Date(b.lastUsed || 0).getTime();
            case 'last-used-desc': return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime();
            default: return 0;
        }
      });
  }, [search, equipment, categoryFilter, statusFilter, sortOption, equipmentStatus]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(equipment.map(e => e.category)))], [equipment]);
  const statuses = useMemo(() => [{value:'all', label: 'All Statuses'}, {value:'available', label: 'Available'}, {value: 'in_use', label: 'In Use'}], []);

  const getStatusBadgeVariant = (status: {inUse: number, available: number}): "destructive" | "secondary" | "default" => {
    if (status.available === 0) return 'destructive';
    if (status.inUse > 0) return 'secondary';
    return 'default';
  }

  const getStatusText = (status: {inUse: number, available: number}) => {
      if (status.available === 0) return 'None Available';
      if (status.inUse > 0) return `${status.inUse} in use`;
      return 'Available';
  }

  const exportFilteredEquipment = () => {
    const csvContent = [
      ['Name', 'Category', 'Total Quantity', 'Available', 'In Use', 'Last Used'],
      ...filteredAndSortedEquipment.map(e => {
        const status = equipmentStatus[e.id] || { inUse: 0, available: e.totalQuantity, borrowedByMe: 0 };
        return [
          e.name,
          e.category,
          e.totalQuantity.toString(),
          status.available.toString(),
          status.inUse.toString(),
          new Date(e.lastUsed).toLocaleDateString()
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: `${filteredAndSortedEquipment.length} items exported.` });
  };

  const handleQuantityButtonClick = (id: string, amount: number) => {
    if (!editMode && amount < 0) {
      toast({ 
        variant: "destructive",
        title: "Edit Mode Disabled", 
        description: "Please enable Edit Mode to modify quantities." 
      });
      return;
    }
    const currentQty = checkoutQuantities[id] || 1;
    const newQty = Math.max(1, currentQty + amount);
    const item = equipmentStatus[id];
    if (item && newQty > item.available) {
        toast({variant: 'destructive', title: `Only ${item.available} units available.`});
        setCheckoutQuantities(prev => ({...prev, [id]: item.available}));
    } else {
        setCheckoutQuantities(prev => ({...prev, [id]: newQty}));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Equipment Inventory</h1>
        <p className="text-muted-foreground">Browse and check out lab equipment.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground">Loading equipment...</p>
        </div>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search items..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-10"
                      />
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                      {isAdmin && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50">
                              {editMode ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                              <Label htmlFor="edit-mode-equipment" className="text-sm font-medium cursor-pointer">
                                  Edit Mode
                              </Label>
                              <Switch 
                                  id="edit-mode-equipment"
                                  checked={editMode} 
                                  onCheckedChange={setEditMode}
                              />
                          </div>
                      )}
                      <Button 
                          variant="outline" 
                          size="sm"
                          onClick={exportFilteredEquipment}
                          disabled={filteredAndSortedEquipment.length === 0}
                      >
                          <Download className="mr-2 h-4 w-4" />
                          Export ({filteredAndSortedEquipment.length})
                      </Button>
                  </div>
              </div>
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                           <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Categories' : c}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                           <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                          {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                  </Select>
                   <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                           <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="last-used-desc">Last Used (Newest)</SelectItem>
                          <SelectItem value="last-used-asc">Last Used (Oldest)</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedEquipment.length > 0 ? (
              filteredAndSortedEquipment.map(item => {
                const status = equipmentStatus[item.id] || { inUse: 0, available: item.totalQuantity, borrowedByMe: 0 };
                const checkoutQty = checkoutQuantities[item.id] || 1;

                return (
                    <Card key={item.id} className={cn("flex flex-col transition-all hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4", status.borrowedByMe > 0 && "border-primary")}>
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-xl">{item.name}</CardTitle>
                                <Badge variant={getStatusBadgeVariant(status)}>{getStatusText(status)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between gap-4">
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-4xl font-bold">{status.available}</p>
                                    <p className="text-xs text-muted-foreground">Available</p>
                                </div>
                                 <div>
                                    <p className="text-4xl font-bold">{status.inUse}</p>
                                    <p className="text-xs text-muted-foreground">In Use</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4">
                                {status.borrowedByMe > 0 && (
                                    <div className="space-y-2 p-3 rounded-md border border-blue-500/50 bg-blue-500/5">
                                        <Label htmlFor={`return-${item.id}`} className="text-xs font-medium text-blue-700 dark:text-blue-400">You have {status.borrowedByMe} borrowed</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id={`return-${item.id}`}
                                                type="number"
                                                placeholder="Qty"
                                                className="h-9 w-20"
                                                value={returnQuantities[item.id] || ''}
                                                onChange={e => setReturnQuantities(prev => ({...prev, [item.id]: e.target.value}))}
                                                min={1}
                                                max={status.borrowedByMe}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9"
                                                onClick={() => handleReturn(item.id)}
                                                disabled={!returnQuantities[item.id] || parseInt(returnQuantities[item.id] || '0') <= 0}
                                            >
                                                <CornerUpLeft className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Return</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor={`checkout-${item.id}`} className={cn("text-sm font-medium", status.available === 0 && 'text-muted-foreground')}>Checkout Quantity</Label>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => handleQuantityButtonClick(item.id, -1)} disabled={status.available === 0}><Minus className="h-4 w-4"/></Button>
                                        <Input
                                            id={`checkout-${item.id}`}
                                            type="number"
                                            className="w-16 text-center h-9"
                                            value={checkoutQty}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                if (isNaN(val)) setCheckoutQuantities(prev => ({...prev, [item.id]: 1}));
                                                else if (val > status.available) {
                                                    toast({variant: 'destructive', title: `Only ${status.available} units available.`});
                                                    setCheckoutQuantities(prev => ({...prev, [item.id]: status.available}));
                                                } else {
                                                     setCheckoutQuantities(prev => ({...prev, [item.id]: val}));
                                                }
                                            }}
                                            min={1}
                                            max={status.available}
                                            disabled={status.available === 0}
                                        />
                                        <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => handleQuantityButtonClick(item.id, 1)} disabled={status.available === 0}><Plus className="h-4 w-4"/></Button>
                                        <Button 
                                            className="flex-1 h-9"
                                            onClick={() => handleCheckout(item.id)}
                                            disabled={status.available === 0 || checkoutQty <= 0}
                                        >
                                            <LogIn className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Checkout</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                         <div className="border-t text-center p-2">
                             <p className="text-xs text-muted-foreground">
                                Last used: {new Date(item.lastUsed).toLocaleDateString()}
                            </p>
                         </div>
                    </Card>
                )
              })
            ) : (
              <div className="col-span-full text-center py-10">
                <p>No equipment found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

    