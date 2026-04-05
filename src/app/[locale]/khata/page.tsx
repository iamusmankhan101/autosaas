'use client';

import { useTranslations } from 'next-intl';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Search, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function KhataPage() {
  const t = useTranslations('Khata');
  const [searchTerm, setSearchTerm] = useState('');

  const customers = useLiveQuery(
    () => db.customers
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
            .toArray(),
    [searchTerm]
  );

  const totalUdhaar = customers?.reduce((acc, curr) => acc + curr.total_udhaar, 0) || 0;

  const handleWhatsApp = (phone: string, amount: number) => {
    // Basic Deep Link: WhatsApp requires country code, assume all are Pakistani (+92) if not specified
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '92' + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith('92') && !formattedPhone.startsWith('+92')) {
      formattedPhone = '92' + formattedPhone;
    }
    
    // Remove '+' for the wa.me link
    formattedPhone = formattedPhone.replace('+', '');
    
    // Urdu Reminder Text
    const text = encodeURIComponent(`السلام علیکم،\nجناب، آپ کا ہماری ورکشاپ کی طرف PKR ${amount} کا ادھار باقی ہے۔ براہ کرم جلد ادائیگی کریں۔ شکریہ!`);
    
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
        </div>
        <Button className="font-heading">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_customer')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">{t('total_udhaar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">PKR {totalUdhaar.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center gap-2 max-w-sm">
             <Search className="h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search name or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Outstanding (Udhaar)</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right text-destructive font-bold">
                      {customer.total_udhaar.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {customer.total_udhaar > 0 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleWhatsApp(customer.phone, customer.total_udhaar)}
                          title={t('remind_whatsapp')}
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
