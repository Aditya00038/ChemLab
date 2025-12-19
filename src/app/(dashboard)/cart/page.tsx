
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Download, ShoppingCart, Loader2, Search, Plus, Minus, Trash2, RefreshCcw, TrendingUp, Package, AlertTriangle, PlusCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LOW_STOCK_THRESHOLD = 50;
const SUGGESTED_REORDER_QUANTITY = 500;

type SortOption = 'name-asc' | 'name-desc' | 'quantity-asc' | 'quantity-desc';
type StockFilter = 'all' | 'out' | 'low';

const sellers = [
    { id: 'seller-1', name: 'ChemSupply Co.' },
    { id: 'seller-2', name: 'Global Lab Solutions' },
    { id: 'seller-3', name: 'American Scientific' }
]

export default function CartPage() {
    const { chemicals, loading } = useFirestore();
    const { isAdmin } = useAuth();
    const [search, setSearch] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('quantity-asc');
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [manualCartItems, setManualCartItems] = useState<Set<string>>(new Set());
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const [selectedChemicalId, setSelectedChemicalId] = useState<string>('');
    
    const lowStockItems = useMemo(() => {
        const autoDetected = chemicals.filter(c => c.quantity < LOW_STOCK_THRESHOLD);
        const manual = chemicals.filter(c => manualCartItems.has(c.id) && c.quantity >= LOW_STOCK_THRESHOLD);
        return [...autoDetected, ...manual];
    }, [chemicals, manualCartItems]);

    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        lowStockItems.forEach(item => {
            initialState[item.id] = true; // Select all by default
        });
        return initialState;
    });
    
    const [orderQuantities, setOrderQuantities] = useState<Record<string, string>>(() => {
        const initialState: Record<string, string> = {};
        lowStockItems.forEach(item => {
            initialState[item.id] = String(SUGGESTED_REORDER_QUANTITY);
        });
        return initialState;
    });

    const [selectedSeller, setSelectedSeller] = useState<string>('');
    const { toast } = useToast();

    const filteredAndSortedItems = useMemo(() => {
        let result = lowStockItems.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.formula.toLowerCase().includes(search.toLowerCase()) ||
            item.casNumber.toLowerCase().includes(search.toLowerCase())
        );

        if (stockFilter === 'out') {
            result = result.filter(item => item.quantity === 0);
        } else if (stockFilter === 'low') {
            result = result.filter(item => item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD);
        }

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
        }

        return result;
    }, [lowStockItems, search, sortOption, stockFilter]);

    const handleSelectAll = (checked: boolean) => {
        const newSelectedItems: Record<string, boolean> = {};
        filteredAndSortedItems.forEach(item => {
            newSelectedItems[item.id] = checked;
        });
        setSelectedItems(newSelectedItems);
    }

    const quickSetQuantity = (id: string, amount: number) => {
        setOrderQuantities(prev => ({
            ...prev,
            [id]: String(Math.max(0, (parseInt(prev[id] || '0') || 0) + amount))
        }));
    };

    const clearSelection = () => {
        setSelectedItems({});
        toast({ title: "Selection Cleared", description: "All items have been deselected." });
    };

    const autoFillSuggested = () => {
        const newQuantities: Record<string, string> = {};
        filteredAndSortedItems.forEach(item => {
            if (selectedItems[item.id]) {
                newQuantities[item.id] = String(SUGGESTED_REORDER_QUANTITY);
            }
        });
        setOrderQuantities(prev => ({ ...prev, ...newQuantities }));
        toast({ title: "Quantities Set", description: `Suggested quantities applied to ${Object.keys(newQuantities).length} items.` });
    };
    
    const handleSelectItem = (id: string, checked: boolean) => {
        setSelectedItems(prev => ({...prev, [id]: checked}));
    }
    
    const handleQuantityChange = (id: string, value: string) => {
        setOrderQuantities(prev => ({...prev, [id]: value}));
    }

    const itemsToOrder = useMemo(() => {
        return lowStockItems.filter(item => selectedItems[item.id]);
    }, [lowStockItems, selectedItems]);
    
    const allSelected = useMemo(() => {
        return filteredAndSortedItems.length > 0 && filteredAndSortedItems.every(item => selectedItems[item.id]);
    }, [filteredAndSortedItems, selectedItems]);

    const cartStats = useMemo(() => {
        const outOfStock = filteredAndSortedItems.filter(item => item.quantity === 0).length;
        const lowStock = filteredAndSortedItems.filter(item => item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD).length;
        const totalOrderValue = itemsToOrder.reduce((sum, item) => {
            const qty = parseInt(orderQuantities[item.id] || '0') || 0;
            return sum + qty;
        }, 0);
        return { outOfStock, lowStock, totalOrderValue, selectedCount: itemsToOrder.length };
    }, [filteredAndSortedItems, itemsToOrder, orderQuantities]);

    const availableChemicalsForAdd = useMemo(() => {
        return chemicals
            .filter(c => !lowStockItems.some(item => item.id === c.id))
            .filter(c => 
                c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
                c.formula.toLowerCase().includes(addSearch.toLowerCase()) ||
                c.casNumber.toLowerCase().includes(addSearch.toLowerCase())
            )
            .slice(0, 50); // Limit to 50 results for performance
    }, [chemicals, lowStockItems, addSearch]);

    const handleAddToCart = () => {
        if (!selectedChemicalId) {
            toast({ variant: 'destructive', title: "No chemical selected", description: "Please select a chemical to add."});
            return;
        }
        
        setManualCartItems(prev => new Set([...prev, selectedChemicalId]));
        setSelectedItems(prev => ({...prev, [selectedChemicalId]: true}));
        setOrderQuantities(prev => ({...prev, [selectedChemicalId]: String(SUGGESTED_REORDER_QUANTITY)}));
        
        const chemical = chemicals.find(c => c.id === selectedChemicalId);
        toast({ title: "Added to Cart", description: `${chemical?.name} has been added to your reorder list.` });
        
        setAddDialogOpen(false);
        setSelectedChemicalId('');
        setAddSearch('');
    };

    const handleRemoveManualItem = (id: string) => {
        setManualCartItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        setSelectedItems(prev => ({...prev, [id]: false}));
        toast({ title: "Removed from Cart", description: "Item has been removed from your reorder list." });
    };

    const downloadList = () => {
        if (itemsToOrder.length === 0) {
            toast({ variant: 'destructive', title: "No items selected", description: "Please select items to download."});
            return;
        }

        const csvRows = [
            ["ID", "Name", "Formula", "CAS Number", "Current Quantity", "Unit", "Order Quantity"],
            ...itemsToOrder.map(item => [
                item.id,
                item.name,
                item.formula,
                item.casNumber,
                item.quantity,
                item.unit,
                orderQuantities[item.id] || ''
            ])
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "chemical_order_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const placeOrder = () => {
        if (itemsToOrder.length === 0) {
             toast({ variant: 'destructive', title: "No items selected", description: "Please select items to order."});
             return;
        }
        if (!selectedSeller) {
            toast({ variant: 'destructive', title: "No seller selected", description: "Please select a seller to place the order."});
            return;
        }
        
        // In a real app, this would trigger an API call
        toast({ title: "Order Placed!", description: `Your order for ${itemsToOrder.length} items has been sent to ${sellers.find(s => s.id === selectedSeller)?.name}.`});
    }

    return (
        <div className="flex flex-col gap-8">
             <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
                <p className="text-muted-foreground">Review and order low-stock chemicals.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">Loading cart...</p>
              </div>
            ) : (
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4">
                        <div>
                            <CardTitle>Low & Out of Stock Items</CardTitle>
                            <CardDescription>
                               These items are running low. Select items and specify quantities to reorder.
                            </CardDescription>
                        </div>
                        
                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                        <div>
                                            <p className="text-2xl font-bold">{cartStats.outOfStock}</p>
                                            <p className="text-xs text-muted-foreground">Out of Stock</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-amber-500" />
                                        <div>
                                            <p className="text-2xl font-bold">{cartStats.lowStock}</p>
                                            <p className="text-xs text-muted-foreground">Low Stock</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-500" />
                                        <div>
                                            <p className="text-2xl font-bold">{cartStats.selectedCount}</p>
                                            <p className="text-xs text-muted-foreground">Items Selected</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-green-500" />
                                        <div>
                                            <p className="text-2xl font-bold">{cartStats.totalOrderValue}</p>
                                            <p className="text-xs text-muted-foreground">Total Units</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, formula, or CAS..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items</SelectItem>
                                        <SelectItem value="out">Out of Stock</SelectItem>
                                        <SelectItem value="low">Low Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quantity-asc">Quantity (Low-High)</SelectItem>
                                        <SelectItem value="quantity-desc">Quantity (High-Low)</SelectItem>
                                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex gap-2 flex-wrap">
                            {isAdmin && (
                                <>
                                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="default" size="sm">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Chemical Manually
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>Add Chemical to Reorder List</DialogTitle>
                                                <DialogDescription>
                                                    Search and select a chemical to add to your reorder cart.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex-1 overflow-hidden flex flex-col gap-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by name, formula, or CAS..."
                                                        value={addSearch}
                                                        onChange={(e) => setAddSearch(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <div className="flex-1 overflow-y-auto border rounded-md">
                                                    {availableChemicalsForAdd.length > 0 ? (
                                                        <div className="divide-y">
                                                            {availableChemicalsForAdd.map(chemical => (
                                                                <div
                                                                    key={chemical.id}
                                                                    className={cn(
                                                                        "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                                                        selectedChemicalId === chemical.id && "bg-primary/10 border-l-4 border-primary"
                                                                    )}
                                                                    onClick={() => setSelectedChemicalId(chemical.id)}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-medium">{chemical.name}</p>
                                                                            <p className="text-sm text-muted-foreground">{chemical.formula}</p>
                                                                            <p className="text-xs text-muted-foreground">CAS: {chemical.casNumber}</p>
                                                                        </div>
                                                                        <Badge variant="secondary">
                                                                            {chemical.quantity.toFixed(2)} {chemical.unit}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-muted-foreground">
                                                            {addSearch ? "No chemicals found matching your search." : "All chemicals are already in the cart."}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddToCart} disabled={!selectedChemicalId}>
                                                    Add to Cart
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    {itemsToOrder.length > 0 && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={autoFillSuggested}>
                                                <RefreshCcw className="mr-2 h-4 w-4" />
                                                Auto-fill Suggested ({SUGGESTED_REORDER_QUANTITY})
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={clearSelection}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Clear Selection
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                            checked={allSelected}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Current Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[150px]">Order Quantity</TableHead>
                                    {isAdmin && <TableHead className="w-[80px]">Action</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedItems.length > 0 ? filteredAndSortedItems.map(item => (
                                    <TableRow key={item.id} data-state={selectedItems[item.id] && "selected"} className={cn(
                                        "transition-colors",
                                        selectedItems[item.id] && "bg-muted/50"
                                    )}>
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedItems[item.id] || false}
                                                onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                                                aria-label={`Select ${item.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                <span className="text-muted-foreground text-xs">{item.formula}</span>
                                                <span className="text-muted-foreground text-xs">CAS: {item.casNumber}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-semibold",
                                                    item.quantity === 0 ? "text-destructive" : "text-amber-500"
                                                )}>
                                                    {item.quantity.toFixed(2)} {item.unit}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.quantity === 0 ? 
                                                <Badge variant="destructive">Out of Stock</Badge> :
                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">Low Stock</Badge>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8"
                                                    onClick={() => quickSetQuantity(item.id, -100)}
                                                    disabled={!selectedItems[item.id]}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    className="w-20 text-center"
                                                    value={orderQuantities[item.id] || ''}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    placeholder="0"
                                                    disabled={!selectedItems[item.id]}
                                                    aria-label={`Order quantity for ${item.name}`}
                                                />
                                                <span className="text-sm text-muted-foreground">{item.unit}</span>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-8 w-8"
                                                    onClick={() => quickSetQuantity(item.id, 100)}
                                                    disabled={!selectedItems[item.id]}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                {manualCartItems.has(item.id) && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleRemoveManualItem(item.id)}
                                                        title="Remove from cart"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                                            Your inventory is well-stocked! No items are running low.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={downloadList} disabled={itemsToOrder.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Download List
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={itemsToOrder.length === 0}>
                               <ShoppingCart className="mr-2 h-4 w-4" /> Place Order
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Your Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are about to place an order for {itemsToOrder.length} item(s). Please select a seller.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <Select onValueChange={setSelectedSeller} value={selectedSeller}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a seller..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sellers.map(seller => (
                                            <SelectItem key={seller.id} value={seller.id}>
                                                {seller.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={placeOrder} disabled={!selectedSeller}>
                                    Confirm Order
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
            )}
        </div>
    );
}

    