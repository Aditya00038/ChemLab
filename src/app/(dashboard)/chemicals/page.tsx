
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AlertTriangle, Search, Edit, Check, Pipette, Loader2, Download, Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast"

const LOW_STOCK_THRESHOLD = 50;
type SortOption = 'name-asc' | 'name-desc' | 'quantity-asc' | 'quantity-desc' | 'last-updated-desc' | 'last-updated-asc';
type StockFilter = 'all' | 'low' | 'ok' | 'out';

type Unit = 'g' | 'kg' | 'mL' | 'L';

type ChemicalCardState = {
  isEditing: boolean;
  setQuantity: string;
  useQuantity: string;
  unit: Unit;
  useUnit: Unit;
};

export default function ChemicalsPage() {
  const { chemicals, updateChemical, loading } = useFirestore();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [cardStates, setCardStates] = useState<Record<string, ChemicalCardState>>({});
  const [editMode, setEditMode] = useState(false);

  const { toast } = useToast();

  // Initialize card states when chemicals load
  useEffect(() => {
    const initialState: Record<string, ChemicalCardState> = {};
    chemicals.forEach(c => {
      initialState[c.id] = {
        isEditing: false,
        setQuantity: c.quantity.toString(),
        useQuantity: '',
        unit: c.unit,
        useUnit: c.unit,
      };
    });
    setCardStates(initialState);
  }, [chemicals.length]);

  const handleStateChange = (id: string, field: keyof ChemicalCardState, value: any) => {
    setCardStates(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const toggleEdit = (id: string) => {
    if (!editMode) {
      toast({ 
        variant: "destructive",
        title: "Edit Mode Disabled", 
        description: "Please enable Edit Mode to modify quantities." 
      });
      return;
    }
    const currentState = cardStates[id];
    if (currentState.isEditing) {
      handleSetQuantity(id);
    }
    handleStateChange(id, 'isEditing', !currentState.isEditing);
  };
  
  const handleSetQuantity = async (id: string) => {
    const state = cardStates[id];
    const newQuantity = parseFloat(state.setQuantity);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      await updateChemical(id, { quantity: newQuantity, unit: state.unit });
      toast({ title: "Quantity Updated", description: "Chemical quantity has been updated." });
    }
  };

  const handleUseQuantity = async (id: string) => {
    const state = cardStates[id];
    const chemical = chemicals.find(c => c.id === id);
    let amountToUse = parseFloat(state.useQuantity);
    
    if (chemical && !isNaN(amountToUse) && amountToUse > 0) {
      // Conversion logic using explicit unit sets to avoid TS narrowing complaints
      const massUnits = ['g', 'kg'] as const;
      const volUnits = ['mL', 'L'] as const;

      if ((massUnits as readonly string[]).includes(chemical.unit)) {
        if (state.useUnit === 'kg') amountToUse *= 1000;
        else if (!(massUnits as readonly string[]).includes(state.useUnit)) {
          toast({ variant: "destructive", title: "Invalid Unit", description: `Cannot use volume units for a mass-based chemical.` });
          return;
        }
      } else if ((volUnits as readonly string[]).includes(chemical.unit)) {
        if (state.useUnit === 'L') amountToUse *= 1000;
        else if (!(volUnits as readonly string[]).includes(state.useUnit)) {
          toast({ variant: "destructive", title: "Invalid Unit", description: `Cannot use mass units for a volume-based chemical.` });
          return;
        }
      }

      if (chemical.quantity >= amountToUse) {
        const newQuantity = chemical.quantity - amountToUse;
        await updateChemical(id, { quantity: newQuantity });
        handleStateChange(id, 'useQuantity', '');
        
        if (newQuantity < LOW_STOCK_THRESHOLD && newQuantity > 0) {
             toast({
                variant: "destructive",
                title: "Low Stock Alert",
                description: `Low stock for ${chemical.name}! Available: ${newQuantity.toFixed(2)} ${chemical.unit}. Please update.`,
            })
        }
      } else {
         toast({
            variant: "destructive",
            title: "Insufficient Quantity",
            description: `Not enough ${chemical.name} available.`,
        })
      }
    }
  };


  const filteredAndSortedChemicals = useMemo(() => {
    let result = chemicals
      .filter(chemical =>
        chemical.name.toLowerCase().includes(search.toLowerCase()) ||
        chemical.formula.toLowerCase().includes(search.toLowerCase()) ||
        chemical.casNumber.toLowerCase().includes(search.toLowerCase())
      ).filter(chemical => {
        if (stockFilter === 'low') return chemical.quantity > 0 && chemical.quantity < LOW_STOCK_THRESHOLD;
        if (stockFilter === 'out') return chemical.quantity === 0;
        if (stockFilter === 'ok') return chemical.quantity >= LOW_STOCK_THRESHOLD;
        return true;
      });

    switch (sortOption) {
        case 'name-asc':
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            result.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'quantity-asc':
            result.sort((a, b) => a.quantity - b.quantity);
            break;
        case 'quantity-desc':
            result.sort((a, b) => b.quantity - a.quantity);
            break;
        case 'last-updated-asc':
            result.sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
            break;
        case 'last-updated-desc':
            result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            break;
    }

    return result;
  }, [chemicals, search, stockFilter, sortOption]);

  const getStatusBadgeVariant = (quantity: number) => {
    if (quantity === 0) return 'destructive';
    if (quantity < LOW_STOCK_THRESHOLD) return 'warning';
    return 'default';
  }

  const getStatusText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < LOW_STOCK_THRESHOLD) return 'Low Stock';
    return 'Available';
  }

  const exportFilteredChemicals = () => {
    const csvContent = [
      ['Name', 'Formula', 'CAS Number', 'Quantity', 'Unit', 'Status', 'Last Updated'],
      ...filteredAndSortedChemicals.map(c => [
        c.name,
        c.formula,
        c.casNumber,
        c.quantity.toString(),
        c.unit,
        getStatusText(c.quantity),
        new Date(c.lastUpdated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemicals-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Export Complete", description: `${filteredAndSortedChemicals.length} chemicals exported.` });
  };

  return (
    <div className="flex flex-col gap-8">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Chemicals</h1>
            <p className="text-muted-foreground">Search and manage your chemical inventory.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Loading chemicals...</p>
          </div>
        ) : (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, formula, or CAS..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            {isAdmin && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50">
                                    {editMode ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                    <Label htmlFor="edit-mode" className="text-sm font-medium cursor-pointer">
                                        Edit Mode
                                    </Label>
                                    <Switch 
                                        id="edit-mode"
                                        checked={editMode} 
                                        onCheckedChange={setEditMode}
                                    />
                                </div>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={exportFilteredChemicals}
                                disabled={filteredAndSortedChemicals.length === 0}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export ({filteredAndSortedChemicals.length})
                            </Button>
                        </div>
                    </div>
                     <div className="flex gap-2 flex-wrap">
                        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                            <SelectTrigger className="w-full md:w-[150px]">
                                <SelectValue placeholder="Stock Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="ok">In Stock</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                                <SelectItem value="out">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                <SelectItem value="quantity-desc">Quantity (High-Low)</SelectItem>
                                <SelectItem value="quantity-asc">Quantity (Low-High)</SelectItem>
                                <SelectItem value="last-updated-desc">Last Updated (Newest)</SelectItem>
                                <SelectItem value="last-updated-asc">Last Updated (Oldest)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedChemicals.length > 0 ? (
                        filteredAndSortedChemicals.map(chemical => {
                            const isOutOfStock = chemical.quantity === 0;
                            const isLowStock = chemical.quantity > 0 && chemical.quantity < LOW_STOCK_THRESHOLD;
                            const state = cardStates[chemical.id] || { isEditing: false, setQuantity: chemical.quantity.toString(), useQuantity: '', unit: chemical.unit, useUnit: chemical.unit };
                            
                            return (
                                <Card key={chemical.id} className={cn("flex flex-col transition-all hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4", (isLowStock || isOutOfStock) && "border-destructive")}>
                                    <CardHeader className="flex-row justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{chemical.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{chemical.formula}</p>
                                            <p className="text-xs text-muted-foreground pt-1">CAS: {chemical.casNumber}</p>
                                        </div>
                                         <div>
                                            <Badge variant={isOutOfStock ? 'destructive' : isLowStock ? 'warning' : 'default'}>
                                                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Available'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col gap-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Available:</p>
                                            <div className="flex items-center gap-2">
                                                {state.isEditing ? (
                                                  <>
                                                    <Input type="number" value={state.setQuantity} onChange={(e) => handleStateChange(chemical.id, 'setQuantity', e.target.value)} className="w-24" />
                                                    <Select value={state.unit} onValueChange={(v) => handleStateChange(chemical.id, 'unit', v as 'g' | 'mL')}>
                                                        <SelectTrigger className="w-20"><SelectValue/></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="g">g</SelectItem>
                                                            <SelectItem value="mL">mL</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                  </>
                                                ) : (
                                                    <p className={cn("text-lg font-bold", (isLowStock || isOutOfStock) && "text-destructive")}>
                                                        {chemical.quantity.toFixed(3)} {chemical.unit}
                                                    </p>
                                                )}
                                                {editMode && (
                                                    <Button size="icon" variant="ghost" onClick={() => toggleEdit(chemical.id)}>
                                                        {state.isEditing ? <Check className="h-4 w-4 text-green-500"/> : <Edit className="h-4 w-4"/>}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                         <div className="space-y-2">
                                            <p className="text-sm font-medium">Use:</p>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" placeholder="Amount" value={state.useQuantity} onChange={(e) => handleStateChange(chemical.id, 'useQuantity', e.target.value)} className="w-20 flex-1" disabled={isOutOfStock} />
                                                <Select value={state.useUnit} onValueChange={(v) => handleStateChange(chemical.id, 'useUnit', v as Unit)} disabled={isOutOfStock}>
                                                    <SelectTrigger className="w-[80px]"><SelectValue/></SelectTrigger>
                                                    <SelectContent>
                                                      {chemical.unit === 'g' ? (
                                                        <>
                                                          <SelectItem value="g">g</SelectItem>
                                                          <SelectItem value="kg">kg</SelectItem>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <SelectItem value="mL">mL</SelectItem>
                                                          <SelectItem value="L">L</SelectItem>
                                                        </>
                                                      )}
                                                    </SelectContent>
                                                </Select>
                                                <Button size="sm" onClick={() => handleUseQuantity(chemical.id)} disabled={!state.useQuantity || isOutOfStock} className="px-3">
                                                    <Pipette className="mr-0 sm:mr-2 h-4 w-4" />
                                                    <span className="hidden sm:inline">Use</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                       <div className="col-span-full text-center py-10">
                            <p>No chemicals found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
        )}
    </div>
  );
}

    