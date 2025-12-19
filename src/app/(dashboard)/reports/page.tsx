
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Calendar as CalendarIcon, Filter, Loader2 } from "lucide-react";
import { useFirestore } from "@/contexts/FirestoreContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type LogSortOption = 'timestamp-desc' | 'timestamp-asc' | 'user-asc' | 'user-desc' | 'item-asc' | 'item-desc';


export default function ReportsPage() {
    const { chemicals, equipment, usageLogs, loading } = useFirestore();
    const [userFilter, setUserFilter] = useState<string>('all');
    const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [sortOption, setSortOption] = useState<LogSortOption>('timestamp-desc');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const exportToCsv = (filename: string, rows: any[]) => {
        if (!rows || rows.length === 0) {
            return;
        }
        const separator = ',';
        const keys = Object.keys(rows[0]);
        const csvContent =
            keys.join(separator) +
            '\n' +
            rows.map(row => {
                return keys.map(k => {
                    let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                    cell = cell instanceof Date
                        ? cell.toLocaleString()
                        : cell.toString().replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            }).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const enrichedLogs = useMemo(() => {
        return usageLogs.map(log => {
            const item = log.itemType === 'chemical' 
                ? chemicals.find(c => c.id === log.itemId)
                : equipment.find(e => e.id === log.itemId);
            return {
                ...log,
                userName: log.userEmail || 'Unknown',
                itemName: item?.name || 'Unknown Item',
            }
        });
    }, [usageLogs, chemicals, equipment]);

    const filteredAndSortedLogs = useMemo(() => {
        let result = enrichedLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            const isAfterStartDate = !date?.from || logDate >= date.from;
            const isBeforeEndDate = !date?.to || logDate <= date.to;
            const userMatch = userFilter === 'all' || log.userId === userFilter;
            const itemTypeMatch = itemTypeFilter === 'all' || log.itemType === itemTypeFilter;
            return isAfterStartDate && isBeforeEndDate && userMatch && itemTypeMatch;
        });

        switch (sortOption) {
            case 'timestamp-desc':
                result.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                break;
            case 'timestamp-asc':
                result.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                break;
            case 'user-asc':
                result.sort((a,b) => a.userName.localeCompare(b.userName));
                break;
            case 'user-desc':
                result.sort((a,b) => b.userName.localeCompare(a.userName));
                break;
            case 'item-asc':
                result.sort((a,b) => a.itemName.localeCompare(b.itemName));
                break;
            case 'item-desc':
                 result.sort((a,b) => b.itemName.localeCompare(a.itemName));
                break;
        }

        return result;
    }, [enrichedLogs, userFilter, itemTypeFilter, date, sortOption]);

    const handleExportLogs = () => {
        const dataToExport = filteredAndSortedLogs.map(({ id, userId, itemId, ...rest}) => rest);
        exportToCsv('chemstock_usage_log.csv', dataToExport);
    }
    
    const setDatePreset = (days: string) => {
        const numDays = parseInt(days);
        if (isNaN(numDays)) {
            setDate(undefined);
            return;
        }
        setDate({ from: subDays(new Date(), numDays), to: new Date() });
    }

    const clearFilters = () => {
        setDate(undefined);
        setUserFilter('all');
        setItemTypeFilter('all');
    }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2 text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and export inventory reports.</p>
      </div>
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <Tabs defaultValue="chemicals" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chemicals">Chemicals</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>
            <TabsContent value="chemicals">
                <Card>
                    <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                        <div>
                            <CardTitle>Chemicals Inventory</CardTitle>
                            <CardDescription>A complete list of all chemicals in the inventory.</CardDescription>
                        </div>
                        <Button onClick={() => exportToCsv('chemstock_chemicals_report.csv', chemicals)} className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                             <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Formula</TableHead>
                                    <TableHead>CAS Number</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {chemicals.map(chemical => (
                                    <TableRow key={chemical.id}>
                                    <TableCell className="font-medium">{chemical.name}</TableCell>
                                    <TableCell>{chemical.formula}</TableCell>
                                    <TableCell>{chemical.casNumber}</TableCell>
                                    <TableCell className="text-right">{chemical.quantity.toFixed(3)} {chemical.unit}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="grid gap-4 md:hidden">
                            {chemicals.map(chemical => (
                                <Card key={chemical.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium">{chemical.name}</div>
                                        <div className="font-bold text-right">{chemical.quantity.toFixed(3)} {chemical.unit}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{chemical.formula}</div>
                                    <div className="text-xs text-muted-foreground">CAS: {chemical.casNumber}</div>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="equipment">
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                            <div>
                                <CardTitle>Equipment Inventory</CardTitle>
                                <CardDescription>A complete list of all equipment in the inventory.</CardDescription>
                            </div>
                            <Button onClick={() => exportToCsv('chemstock_equipment_report.csv', equipment)} className="w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Total Quantity</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {equipment.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell className="text-right">{item.totalQuantity}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="grid gap-4 md:hidden">
                            {equipment.map(item => (
                                 <Card key={item.id} className="p-4">
                                     <div className="flex justify-between items-start">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="font-bold text-right">{item.totalQuantity} units</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{item.category}</div>
                                 </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="usage">
           <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle>Usage</CardTitle>
                    <CardDescription>A detailed log of all chemical and equipment usage.</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4"/> Filters</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="end">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Filter by User</p>
                                    <Select value={userFilter} onValueChange={setUserFilter}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="Filter by User" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div>
                                    <p className="text-sm font-medium mb-2">Filter by Item Type</p>
                                    <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                                        <SelectTrigger className="w-full md:w-[200px]">
                                            <SelectValue placeholder="Filter by Item Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="chemical">Chemical</SelectItem>
                                            <SelectItem value="equipment">Equipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Filter by Date</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Select onValueChange={setDatePreset}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select preset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7">Last 7 Days</SelectItem>
                                                <SelectItem value="30">Last 30 Days</SelectItem>
                                                <SelectItem value="90">Last 3 Months</SelectItem>
                                                <SelectItem value="180">Last 6 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date?.from ? (
                                                        date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y"))
                                                    ) : (
                                                        <span>Custom range</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                 <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">Clear Filters</Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                     <Select value={sortOption} onValueChange={(v) => setSortOption(v as LogSortOption)}>
                        <SelectTrigger className="w-full flex-1 md:w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="timestamp-desc">Date (Newest)</SelectItem>
                            <SelectItem value="timestamp-asc">Date (Oldest)</SelectItem>
                            <SelectItem value="faculty-asc">Faculty (A-Z)</SelectItem>
                            <SelectItem value="faculty-desc">Faculty (Z-A)</SelectItem>
                            <SelectItem value="item-asc">Item (A-Z)</SelectItem>
                            <SelectItem value="item-desc">Item (Z-A)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExportLogs} className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedLogs.length > 0 ? filteredAndSortedLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{log.userName}</TableCell>
                          <TableCell>{log.itemName}</TableCell>
                          <TableCell>
                              <Badge variant={log.action === 'Reported Damaged' ? 'destructive' : 'secondary'}>{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.quantity > 0 ? `${log.quantity} ${log.unit}` : '-'}
                          </TableCell>
                           <TableCell className="max-w-[200px] truncate">{log.notes || '-'}</TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">No usage logs found for the selected criteria.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
              </div>
              <div className="grid gap-4 md:hidden">
                  {filteredAndSortedLogs.length > 0 ? filteredAndSortedLogs.map(log => (
                        <Card key={log.id} className="p-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="font-medium">{log.itemName}</div>
                                    <Badge variant={log.action === 'Reported Damaged' ? 'destructive' : 'secondary'}>{log.action}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    by {log.userName} on {new Date(log.timestamp).toLocaleDateString()}
                                </div>
                                {log.quantity > 0 && <div className="font-semibold">{log.quantity} {log.unit}</div>}
                                {log.notes && <p className="text-xs text-muted-foreground">Note: {log.notes}</p>}
                            </div>
                        </Card>
                  )) : (
                      <div className="text-center text-muted-foreground py-10">
                          No usage logs found for the selected criteria.
                      </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summary">
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                    <CardDescription>Work in progress. This section will contain summary charts and graphs.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-60">
                    <p className="text-muted-foreground">Coming Soon</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    