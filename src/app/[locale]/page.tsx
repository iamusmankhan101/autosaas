import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookUser, Wrench } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function Index({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await import(`../../../messages/${locale}.json`).then((m) => m.default.Index);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-heading">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
            <span className="text-2xl font-bold text-green-600">PKR</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-muted-foreground text-green-600">
              +20.1% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Udhaar</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">12,500</div>
            <p className="text-xs text-muted-foreground">
              Needs collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">3 Pending</Badge>
              <Badge variant="default" className="bg-amber-500">5 In Progress</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      { /* Quick Actions */ }
      <div className="grid gap-4 md:grid-cols-2">
         <Card>
            <CardHeader>
              <CardTitle>Khata (Ledger)</CardTitle>
              <CardDescription>Manage customer debts and uncollected payments.</CardDescription>
            </CardHeader>
            <CardContent>
               <Link href="/khata" className="w-full flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium">
                  Go to Khata <ArrowRight className="h-4 w-4" />
               </Link>
            </CardContent>
         </Card>
         <Card>
            <CardHeader>
              <CardTitle>Job Cards</CardTitle>
              <CardDescription>Create repair estimates and track vehicle workflows.</CardDescription>
            </CardHeader>
            <CardContent>
               <Link href="/jobs" className="w-full flex items-center justify-between px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors text-sm font-medium">
                  Manage Jobs <ArrowRight className="h-4 w-4" />
               </Link>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
