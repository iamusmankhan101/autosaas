import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {Inter, Noto_Nastaliq_Urdu, Noto_Naskh_Arabic} from 'next/font/google';
import "../globals.css";

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

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const isRtl = locale === 'ur';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className={`${inter.variable} ${notoNastaliqUrdu.variable} ${notoNaskhArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground bg-slate-50 dark:bg-slate-950 font-sans">
        <NextIntlClientProvider messages={messages}>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto w-full">
                <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

