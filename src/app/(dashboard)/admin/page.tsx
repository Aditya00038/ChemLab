"use client";

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/contexts/FirestoreContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, Edit, Save, X, Trash2, Search, Plus, Download, Upload, 
  AlertTriangle, CheckCircle, Loader2, Lock, Users, Table as TableIcon,
  LayoutGrid, Undo, Redo, Filter, SortAsc, Copy, Clipboard
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { 
  sanitizeString, 
  validateQuantity, 
  isValidCASNumber,
  RateLimiter,
  debounce,
  validateCSVFile,
  validateChemicalData
} from '@/lib/validation';
import { 
  logAuditAction, 
  createChemicalAuditLog, 
  createEquipmentAuditLog 
} from '@/lib/auditLog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDoc, doc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type EditingState = {
  id: string;
  field: string;
  value: string;
};

type ViewMode = 'card' | 'spreadsheet';

// Rate limiter for save operations (10 per minute)
const saveRateLimiter = new RateLimiter(10, 60000);

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { chemicals, equipment, updateChemical, updateEquipment, usageLogs, loading: dataLoading } = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [editingCell, setEditingCell] = useState<EditingState | null>(null);
  const [searchChemical, setSearchChemical] = useState('');
  const [searchEquipment, setSearchEquipment] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedChemicals, setSelectedChemicals] = useState<Set<string>>(new Set());
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [csvImportDialogOpen, setCSVImportDialogOpen] = useState(false);
  const [csvPreviewData, setCSVPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'chemicals' | 'equipment'>('chemicals');

  // Debounced search handlers
  const debouncedSearchChemical = useCallback(
    debounce((value: string) => setSearchChemical(value), 300),
    []
  );

  const debouncedSearchEquipment = useCallback(
    debounce((value: string) => setSearchEquipment(value), 300),
    []
  );

  // Calculate equipment availability from usage logs (same as equipment page)
  const equipmentAvailability = useMemo(() => {
    const availability: { [key: string]: number } = {};
    equipment.forEach(item => {
      const allCheckedOut = usageLogs
        .filter(log => log.itemId === item.id && log.action === 'Checked Out')
        .reduce((sum, log) => sum + log.quantity, 0);

      const allReturned = usageLogs
        .filter(log => log.itemId === item.id && (log.action === 'Returned' || log.action === 'Reported Damaged'))
        .reduce((sum, log) => sum + log.quantity, 0);

      const inUse = allCheckedOut - allReturned;
      availability[item.id] = item.totalQuantity - inUse;
    });
    return availability;
  }, [equipment, usageLogs]);

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    router.push('/dashboard');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin permissions.</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (authLoading || dataLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Stats Cards Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field, value: String(currentValue) });
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  const handleSaveChemical = async (id: string) => {
    if (!editingCell || !user) return;

    // Rate limiting check
    if (!saveRateLimiter.isAllowed(user.uid)) {
      toast({ 
        variant: "destructive", 
        title: "Too many requests", 
        description: "Please wait before making more changes." 
      });
      return;
    }

    try {
      const chemical = chemicals.find(c => c.id === id);
      if (!chemical) return;

      const updateData: any = {};
      
      if (editingCell.field === 'quantity') {
        const validation = validateQuantity(editingCell.value);
        if (!validation.valid) {
          toast({ 
            variant: "destructive", 
            title: "Invalid quantity", 
            description: validation.error || "Please enter a valid number" 
          });
          return;
        }
        updateData.quantity = validation.value;
      } else if (editingCell.field === 'unit') {
        updateData.unit = sanitizeString(editingCell.value);
      } else if (editingCell.field === 'formula') {
        updateData.formula = sanitizeString(editingCell.value);
      } else if (editingCell.field === 'casNumber') {
        const casNum = sanitizeString(editingCell.value);
        if (casNum && !isValidCASNumber(casNum)) {
          toast({ 
            variant: "destructive", 
            title: "Invalid CAS Number", 
            description: "CAS number must be in format XX-XX-X" 
          });
          return;
        }
        updateData.casNumber = casNum;
      } else if (editingCell.field === 'category') {
        updateData.category = sanitizeString(editingCell.value);
      }

      // Store before state for audit log
      const beforeState = { [editingCell.field]: (chemical as any)[editingCell.field] };
      const afterState = updateData;

      await updateChemical(id, updateData);
      
      // Log the audit action
      await logAuditAction(
        createChemicalAuditLog(
          'update',
          user.uid,
          user.email || 'unknown',
          id,
          chemical.name,
          beforeState,
          afterState
        )
      );
      
      toast({
        title: "✅ Updated Successfully",
        description: `Chemical ${editingCell.field} has been updated.`,
      });
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating chemical:', error);
      
      // Log failed attempt
      if (user) {
        await logAuditAction({
          userId: user.uid,
          userEmail: user.email || 'unknown',
          action: 'update',
          resource: 'chemical',
          resourceId: id,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update chemical. Please try again.",
      });
    }
  };

  const handleSaveEquipment = async (id: string) => {
    if (!editingCell || !user) return;

    // Rate limiting check
    if (!saveRateLimiter.isAllowed(user.uid)) {
      toast({ 
        variant: "destructive", 
        title: "Too many requests", 
        description: "Please wait before making more changes." 
      });
      return;
    }

    try {
      const equip = equipment.find(e => e.id === id);
      if (!equip) return;

      const updateData: any = {};
      
      if (editingCell.field === 'totalQuantity') {
        const validation = validateQuantity(editingCell.value);
        if (!validation.valid) {
          toast({ 
            variant: "destructive", 
            title: "Invalid quantity", 
            description: validation.error || "Please enter a valid number" 
          });
          return;
        }
        updateData.totalQuantity = validation.value;
        // availableQuantity removed - always calculated from usage logs
      } else if (editingCell.field === 'condition') {
        updateData.condition = sanitizeString(editingCell.value);
      } else if (editingCell.field === 'category') {
        updateData.category = sanitizeString(editingCell.value);
      }

      // Store before state for audit log
      const beforeState = { [editingCell.field]: (equip as any)[editingCell.field] };
      const afterState = updateData;

      await updateEquipment(id, updateData);
      
      // Log the audit action
      await logAuditAction(
        createEquipmentAuditLog(
          'update',
          user.uid,
          user.email || 'unknown',
          id,
          equip.name,
          beforeState,
          afterState
        )
      );
      
      toast({
        title: "✅ Updated Successfully",
        description: `Equipment ${editingCell.field} has been updated.`,
      });
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating equipment:', error);
      
      // Log failed attempt
      if (user) {
        await logAuditAction({
          userId: user.uid,
          userEmail: user.email || 'unknown',
          action: 'update',
          resource: 'equipment',
          resourceId: id,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update equipment. Please try again.",
      });
    }
  };

  const filteredChemicals = useMemo(() => {
    return chemicals.filter(c =>
      c.name.toLowerCase().includes(searchChemical.toLowerCase()) ||
      c.formula.toLowerCase().includes(searchChemical.toLowerCase()) ||
      c.casNumber.toLowerCase().includes(searchChemical.toLowerCase())
    );
  }, [chemicals, searchChemical]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(e =>
      e.name.toLowerCase().includes(searchEquipment.toLowerCase()) ||
      e.category.toLowerCase().includes(searchEquipment.toLowerCase())
    );
  }, [equipment, searchEquipment]);

  const exportChemicalsCSV = () => {
    const headers = ['Name', 'Formula', 'CAS Number', 'Quantity', 'Unit', 'Category'];
    const rows = chemicals.map(c => [
      c.name,
      c.formula,
      c.casNumber,
      c.quantity,
      c.unit,
      c.category
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chemicals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportEquipmentCSV = () => {
    const headers = ['Name', 'Total Quantity', 'Available Quantity', 'Category', 'Condition'];
    const rows = equipment.map(e => [
      e.name,
      e.totalQuantity,
      equipmentAvailability[e.id] || 0,
      e.category,
      e.condition
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (!user) return;

    try {
      const itemsToDelete = deleteTarget === 'chemicals' 
        ? Array.from(selectedChemicals)
        : Array.from(selectedEquipment);

      setIsImporting(true); // Reuse for loading state
      
      let successCount = 0;
      let failCount = 0;

      for (const id of itemsToDelete) {
        try {
          await deleteDoc(doc(db, deleteTarget, id));
          
          // Log audit action
          const item = deleteTarget === 'chemicals'
            ? chemicals.find(c => c.id === id)
            : equipment.find(e => e.id === id);

          if (item) {
            await logAuditAction({
              userId: user.uid,
              userEmail: user.email || 'unknown',
              action: 'bulk_delete',
              resource: deleteTarget === 'chemicals' ? 'chemical' : 'equipment',
              resourceId: id,
              resourceName: item.name,
              success: true,
            });
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to delete ${id}:`, error);
          failCount++;
        }
      }

      // Clear selection
      if (deleteTarget === 'chemicals') {
        setSelectedChemicals(new Set());
      } else {
        setSelectedEquipment(new Set());
      }

      setDeleteDialogOpen(false);
      setIsImporting(false);

      toast({
        title: "✅ Bulk Delete Complete",
        description: `Successfully deleted ${successCount} items${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      setIsImporting(false);
      toast({
        variant: "destructive",
        title: "Bulk Delete Failed",
        description: "An error occurred during bulk deletion.",
      });
    }
  };

  // CSV Import Handler
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: validation.error,
      });
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          variant: "destructive",
          title: "Empty CSV",
          description: "CSV file must contain headers and at least one data row.",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['Name', 'Formula', 'CAS Number', 'Quantity', 'Unit', 'Category'];
      
      // Basic header validation
      const hasRequiredHeaders = expectedHeaders.every(h => 
        headers.some(header => header.toLowerCase() === h.toLowerCase())
      );

      if (!hasRequiredHeaders) {
        toast({
          variant: "destructive",
          title: "Invalid CSV Format",
          description: `CSV must have headers: ${expectedHeaders.join(', ')}`,
        });
        return;
      }

      // Parse data rows
      const previewData = lines.slice(1, 11).map((line, idx) => { // Preview first 10
        const values = line.split(',').map(v => v.trim());
        const [name, formula, casNumber, quantity, unit, category] = values;
        
        const chemicalData = {
          name: name || `Chemical ${idx + 1}`,
          formula: formula || '',
          casNumber: casNumber || '',
          quantity: parseFloat(quantity) || 0,
          unit: unit || 'g',
          category: category || 'Uncategorized',
        };

        // Validate each row
        const validation = validateChemicalData(chemicalData);
        return {
          ...chemicalData,
          valid: validation.valid,
          error: validation.errors.join(', '),
        };
      });

      setCSVPreviewData(previewData);
      setCSVImportDialogOpen(true);
    } catch (error) {
      console.error('CSV parse error:', error);
      toast({
        variant: "destructive",
        title: "Parse Error",
        description: "Failed to parse CSV file. Please check the format.",
      });
    }
  };

  // Confirm CSV Import
  const confirmCSVImport = async () => {
    if (!user) return;

    try {
      setIsImporting(true);
      
      let successCount = 0;
      let failCount = 0;

      for (const item of csvPreviewData) {
        if (!item.valid) {
          failCount++;
          continue;
        }

        try {
          const { valid, error, ...chemicalData } = item;
          await addDoc(collection(db, 'chemicals'), {
            ...chemicalData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Log audit action
          await logAuditAction({
            userId: user.uid,
            userEmail: user.email || 'unknown',
            action: 'import',
            resource: 'chemical',
            resourceName: chemicalData.name,
            metadata: { source: 'csv' },
            success: true,
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to import ${item.name}:`, error);
          failCount++;
        }
      }

      setCSVImportDialogOpen(false);
      setIsImporting(false);
      setCSVPreviewData([]);

      toast({
        title: "✅ Import Complete",
        description: `Successfully imported ${successCount} chemicals${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "An error occurred during import.",
      });
    }
  };

  const renderEditableCell = (
    id: string,
    field: string,
    value: any,
    onSave: (id: string) => void
  ) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            className="h-8 w-32"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(id);
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onSave(id)}>
            <Save className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span>{value}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleStartEdit(id, field, value)}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderSpreadsheetCell = (
    id: string,
    field: string,
    value: any,
    onSave: (id: string) => void
  ) => {
    const isEditing = editingCell?.id === id && editingCell?.field === field;
    const cellKey = `${id}-${field}`;

    if (isEditing) {
      return (
        <Input
          ref={(el) => {
            inputRefs.current[cellKey] = el;
          }}
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          className="h-8 min-w-[120px] border-2 border-primary"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave(id);
              setEditingCell(null);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              handleCancelEdit();
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              onSave(id);
              setEditingCell(null);
            }
          }}
          onBlur={() => {
            onSave(id);
          }}
        />
      );
    }

    return (
      <div
        className="min-h-[32px] px-2 py-1 cursor-pointer hover:bg-accent/50 rounded transition-colors"
        onClick={() => handleStartEdit(id, field, value)}
        onDoubleClick={() => handleStartEdit(id, field, value)}
      >
        {value || <span className="text-muted-foreground italic">Click to edit</span>}
      </div>
    );
  };

  return (
  <div className="flex flex-col gap-6 p-2 sm:p-4 md:p-6">
      {/* Header */}
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">Manage inventory, users, and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin Access
          </Badge>
          <Badge variant="outline">{user?.email}</Badge>
        </div>
      </div>

      {/* Stats Overview */}
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chemicals</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chemicals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chemicals.filter(c => c.quantity > 0 && c.quantity < 50).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="chemicals" className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-2 rounded-md bg-muted p-1">
          <TabsTrigger value="chemicals" className="flex-1 min-w-[100px]">Chemicals</TabsTrigger>
          <TabsTrigger value="equipment" className="flex-1 min-w-[100px]">Equipment</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 min-w-[100px]">Settings</TabsTrigger>
        </TabsList>

        {/* Chemicals Tab */}
        <TabsContent value="chemicals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chemicals Inventory</CardTitle>
                    <CardDescription>
                      {viewMode === 'spreadsheet' 
                        ? 'Excel-like editing - Click cells to edit, use Tab/Enter to navigate' 
                        : 'Edit quantities, formulas, CAS numbers, and more'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card View
                    </Button>
                    <Button
                      variant={viewMode === 'spreadsheet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('spreadsheet')}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Spreadsheet
                    </Button>
                  </div>
                </div>
                
                {/* Toolbar for Spreadsheet Mode */}
                {viewMode === 'spreadsheet' && (
                  <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedChemicals.size === 0}
                      onClick={() => {
                        setDeleteTarget('chemicals');
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedChemicals.size})
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="outline" size="sm" onClick={exportChemicalsCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('csv-import-chemicals')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    <input
                      id="csv-import-chemicals"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleCSVImport}
                    />
                    <Separator orientation="vertical" className="h-6" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedChemicals(new Set())}
                      disabled={selectedChemicals.size === 0}
                    >
                      Clear Selection
                    </Button>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {filteredChemicals.length} chemicals
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chemicals by name, formula, or CAS..."
                    defaultValue={searchChemical}
                    onChange={(e) => debouncedSearchChemical(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        {viewMode === 'spreadsheet' && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedChemicals.size === filteredChemicals.length && filteredChemicals.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedChemicals(new Set(filteredChemicals.map(c => c.id)));
                                } else {
                                  setSelectedChemicals(new Set());
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        <TableHead>Name</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead>CAS Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChemicals.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={viewMode === 'spreadsheet' ? 8 : 7} 
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Search className="h-8 w-8 mb-2" />
                              <p>No chemicals found</p>
                              <p className="text-sm">Try adjusting your search</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredChemicals.map((chemical) => (
                          <TableRow 
                            key={chemical.id}
                            className={selectedChemicals.has(chemical.id) ? 'bg-muted/50' : ''}
                          >
                            {viewMode === 'spreadsheet' && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedChemicals.has(chemical.id)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedChemicals);
                                    if (checked) {
                                      newSet.add(chemical.id);
                                    } else {
                                      newSet.delete(chemical.id);
                                    }
                                    setSelectedChemicals(newSet);
                                  }}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{chemical.name}</TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(chemical.id, 'formula', chemical.formula, handleSaveChemical) :
                                renderEditableCell(chemical.id, 'formula', chemical.formula, handleSaveChemical)
                              }
                            </TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(chemical.id, 'casNumber', chemical.casNumber, handleSaveChemical) :
                                renderEditableCell(chemical.id, 'casNumber', chemical.casNumber, handleSaveChemical)
                              }
                            </TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(chemical.id, 'quantity', chemical.quantity.toFixed(3), handleSaveChemical) :
                                renderEditableCell(chemical.id, 'quantity', chemical.quantity.toFixed(3), handleSaveChemical)
                              }
                            </TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(chemical.id, 'unit', chemical.unit, handleSaveChemical) :
                                renderEditableCell(chemical.id, 'unit', chemical.unit, handleSaveChemical)
                              }
                            </TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(chemical.id, 'category', chemical.category, handleSaveChemical) :
                                renderEditableCell(chemical.id, 'category', chemical.category, handleSaveChemical)
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={chemical.quantity === 0 ? 'destructive' : chemical.quantity < 50 ? 'warning' : 'default'}>
                                {chemical.quantity === 0 ? 'Out of Stock' : chemical.quantity < 50 ? 'Low Stock' : 'In Stock'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Equipment Inventory</CardTitle>
                    <CardDescription>
                      {viewMode === 'spreadsheet' 
                        ? 'Excel-like editing - Click cells to edit, use Tab/Enter to navigate' 
                        : 'Edit quantities, conditions, and categories'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card View
                    </Button>
                    <Button
                      variant={viewMode === 'spreadsheet' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('spreadsheet')}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Spreadsheet
                    </Button>
                  </div>
                </div>
                
                {/* Toolbar for Spreadsheet Mode */}
                {viewMode === 'spreadsheet' && (
                  <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedEquipment.size === 0}
                      onClick={() => {
                        setDeleteTarget('equipment');
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedEquipment.size})
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="outline" size="sm" onClick={exportEquipmentCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedEquipment(new Set())}
                      disabled={selectedEquipment.size === 0}
                    >
                      Clear Selection
                    </Button>
                    <div className="ml-auto text-sm text-muted-foreground">
                      {filteredEquipment.length} equipment
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search equipment by name or category..."
                    defaultValue={searchEquipment}
                    onChange={(e) => debouncedSearchEquipment(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="rounded-md border overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        {viewMode === 'spreadsheet' && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedEquipment.size === filteredEquipment.length && filteredEquipment.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEquipment(new Set(filteredEquipment.map(e => e.id)));
                                } else {
                                  setSelectedEquipment(new Set());
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        <TableHead>Name</TableHead>
                        <TableHead>Total Quantity</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipment.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={viewMode === 'spreadsheet' ? 7 : 6} 
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <Search className="h-8 w-8 mb-2" />
                              <p>No equipment found</p>
                              <p className="text-sm">Try adjusting your search</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEquipment.map((item) => (
                          <TableRow 
                            key={item.id}
                            className={selectedEquipment.has(item.id) ? 'bg-muted/50' : ''}
                          >
                            {viewMode === 'spreadsheet' && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedEquipment.has(item.id)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedEquipment);
                                    if (checked) {
                                      newSet.add(item.id);
                                    } else {
                                      newSet.delete(item.id);
                                    }
                                    setSelectedEquipment(newSet);
                                  }}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(item.id, 'totalQuantity', item.totalQuantity, handleSaveEquipment) :
                                renderEditableCell(item.id, 'totalQuantity', item.totalQuantity, handleSaveEquipment)
                              }
                            </TableCell>
                            <TableCell>{equipmentAvailability[item.id] || 0}</TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(item.id, 'category', item.category, handleSaveEquipment) :
                                renderEditableCell(item.id, 'category', item.category, handleSaveEquipment)
                              }
                            </TableCell>
                            <TableCell>
                              {viewMode === 'spreadsheet' ? 
                                renderSpreadsheetCell(item.id, 'condition', item.condition, handleSaveEquipment) :
                                renderEditableCell(item.id, 'condition', item.condition, handleSaveEquipment)
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={equipmentAvailability[item.id] === 0 ? 'destructive' : 'default'}>
                                {equipmentAvailability[item.id] === 0 ? 'None Available' : `${equipmentAvailability[item.id]} Available`}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Admin Users</h3>
                <p className="text-sm text-muted-foreground">
                  Current admin: {user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  To add more admins, update the NEXT_PUBLIC_ADMIN_EMAILS in .env.local
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Low Stock Threshold</h3>
                <p className="text-sm text-muted-foreground">
                  Current threshold: 50 units
                </p>
                <p className="text-sm text-muted-foreground">
                  Chemicals below this quantity will be marked as low stock
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Backup & Export</h3>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
                  <Button variant="outline" onClick={exportChemicalsCSV} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Chemicals
                  </Button>
                  <Button variant="outline" onClick={exportEquipmentCSV} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Equipment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>
                {deleteTarget === 'chemicals' ? selectedChemicals.size : selectedEquipment.size} 
                {' '}{deleteTarget === 'chemicals' ? 'chemical(s)' : 'equipment item(s)'}
              </strong>
              {' '}from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isImporting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Preview Dialog */}
      <AlertDialog open={csvImportDialogOpen} onOpenChange={setCSVImportDialogOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>CSV Import Preview</AlertDialogTitle>
            <AlertDialogDescription>
              Review the data before importing. Invalid rows will be skipped.
              <span className="block mt-2 text-sm">
                <strong>{csvPreviewData.filter(d => d.valid).length}</strong> valid,{' '}
                <strong className="text-destructive">{csvPreviewData.filter(d => !d.valid).length}</strong> invalid
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>CAS</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvPreviewData.map((row, idx) => (
                  <TableRow key={idx} className={!row.valid ? 'bg-destructive/10' : ''}>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <span title={row.error}>
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.formula}</TableCell>
                    <TableCell>{row.casNumber}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>{row.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCSVImport}
              disabled={isImporting || csvPreviewData.filter(d => d.valid).length === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${csvPreviewData.filter(d => d.valid).length} Items`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
