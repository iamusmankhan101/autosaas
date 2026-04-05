import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {Inter, Noto_Nastaliq_Urdu, Noto_Naskh_Arabic} from 'next/font/google';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: '--font-noto-urdu-heading',
  weight: ['400', '700'],
  subsets: ['arabic'],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: '--font-noto-arabic',
  weight: ['400', '700'],
  subsets: ['arabic'],
});

import {AuthProvider} from '@/components/AuthProvider';
import AppLayout from '@/components/AppLayout';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const locale = 'en';

  return (
    <html lang={locale} dir="ltr" className={`${inter.variable} ${notoNastaliqUrdu.variable} ${notoNaskhArabic.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full bg-white font-sans relative text-foreground overflow-x-hidden">
        
        
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

