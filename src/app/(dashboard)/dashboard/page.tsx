
"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Beaker, FlaskConical, AlertTriangle, PackageX, Eye, Inbox, ListChecks, Atom, Loader2 } from "lucide-react";
import { useFirestore } from "@/contexts/FirestoreContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const LOW_STOCK_THRESHOLD = 50;

export default function Dashboard() {
  const { chemicals, equipment, loading } = useFirestore();
  
  const totalChemicals = chemicals.length;
  const totalEquipment = equipment.length; // Count distinct equipment types, not total quantity
  const lowStockChemicals = chemicals.filter(c => c.quantity > 0 && c.quantity < LOW_STOCK_THRESHOLD);
  const outOfStockChemicals = chemicals.filter(c => c.quantity === 0);

  const priorityItems = [...outOfStockChemicals, ...lowStockChemicals];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A quick overview of your laboratory inventory.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Chemicals
            </CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChemicals}</div>
            <p className="text-xs text-muted-foreground">
              Unique chemical types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Equipment
            </CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
            <p className="text-xs text-muted-foreground">
              Distinct equipment types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockChemicals.length}</div>
            <p className="text-xs text-muted-foreground">
              Chemicals that need reordering
            </p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Out of Stock
            </CardTitle>
            <PackageX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockChemicals.length}</div>
            <p className="text-xs text-muted-foreground">
              Chemicals to restock immediately
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
         <Card>
          <CardHeader>
            <CardTitle>Low & Out of Stock Chemicals</CardTitle>
            <CardDescription>
              These chemicals need to be reordered soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {priorityItems.length > 0 ? priorityItems.slice(0, 5).map(chemical => (
                        <TableRow key={chemical.id}>
                            <TableCell className="font-medium">{chemical.name}</TableCell>
                            <TableCell>{chemical.formula}</TableCell>
                            <TableCell className="text-right font-medium" >
                                <span className={chemical.quantity === 0 ? 'text-destructive' : 'text-amber-500'}>
                                    {chemical.quantity} {chemical.unit}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={chemical.quantity === 0 ? 'destructive' : 'warning'}>
                                    {chemical.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">No low or out of stock chemicals.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
             <div className="grid gap-4 sm:hidden">
                {priorityItems.length > 0 ? priorityItems.slice(0, 5).map(chemical => (
                    <div key={chemical.id} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                        <div>
                            <p className="font-medium">{chemical.name} <span className="text-xs text-muted-foreground">({chemical.formula})</span></p>
                            <p className={`text-sm font-bold ${chemical.quantity === 0 ? 'text-destructive' : 'text-amber-500'}`}>
                                {chemical.quantity} {chemical.unit}
                            </p>
                        </div>
                        <Badge variant={chemical.quantity === 0 ? 'destructive' : 'warning'}>
                            {chemical.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                    </div>
                )) : (
                    <div className="text-center text-muted-foreground py-4">No low or out of stock chemicals.</div>
                )}
             </div>
          </CardContent>
        </Card>
        <div className="grid gap-8 sm:grid-cols-2">
           <Link href="/chemicals">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold mb-2">
                  Chemicals Inventory
                </CardTitle>
                <CardDescription>
                  Manage your available chemicals.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/equipment">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Beaker className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold mb-2">
                  Equipment Inventory
                </CardTitle>
                <CardDescription>
                  Manage and track lab equipment.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/chemical-viewer">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Atom className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold mb-2">
                  Viewer
                </CardTitle>
                <CardDescription>
                  Look up properties of chemicals.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/reports">
            <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
                 <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <ListChecks className="h-8 w-8 text-primary" />
                </div>
                 <CardTitle className="text-xl font-semibold mb-2">
                  Inventory Reports
                </CardTitle>
                <CardDescription>
                  View and export detailed inventory reports.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
