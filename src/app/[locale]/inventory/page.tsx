'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, AlertTriangle, Package2 } from 'lucide-react';
import { useState } from 'react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('ALL');

  const inventory = useLiveQuery(
    () => {
      if (activeTab === 'ALL') return db.inventory.toArray();
      return db.inventory.filter(item => item.category === activeTab).toArray();
    },
    [activeTab]
  );

  const vendors = useLiveQuery(() => db.vendors.toArray());

  const totalOwed = vendors?.reduce((acc, curr) => acc + curr.udhaar_owed, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Inventory & Stock</h1>
          <p className="text-muted-foreground">Manage workshop parts, tires, and oil liters.</p>
        </div>
        <Button className="font-heading">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items in Stock</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inventory?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Vendor Udhaar (Owed)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">PKR {totalOwed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
          <CardDescription>View parts and low stock alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ALL" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="ALL">All Stock</TabsTrigger>
              <TabsTrigger value="PART">Parts</TabsTrigger>
              <TabsTrigger value="TIRE">Tires</TabsTrigger>
              <TabsTrigger value="OIL">Oil (Liters)</TabsTrigger>
            </TabsList>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No inventory found in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory?.map((item) => {
                      const isLowStock = item.quantity <= item.alert_threshold;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {item.name}
                            {isLowStock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={isLowStock ? 'text-amber-600' : ''}>
                              {item.quantity} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Update</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
