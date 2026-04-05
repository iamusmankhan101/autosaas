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
      <body suppressHydrationWarning className="min-h-full flex items-center justify-center bg-[#f0ebe6] dark:bg-slate-950 font-sans p-3 md:p-4 lg:p-6 xl:p-8 relative text-foreground">
        
        {/* Soft Background Mesh for Premium Feel */}
        <div className="fixed top-0 right-0 w-[40vw] h-[40vw] bg-[#ffdec2] dark:bg-[#4a2e1d] rounded-full blur-[120px] opacity-60 pointer-events-none -translate-y-1/4 translate-x-1/4"></div>
        <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-[#e1d5cc] dark:bg-[#202738] rounded-full blur-[120px] opacity-60 pointer-events-none translate-y-1/4 -translate-x-1/4"></div>
        
        <NextIntlClientProvider messages={messages}>
          {/* Floating Application Shell */}
          <div className="relative w-full max-w-[1600px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex overflow-hidden ring-1 ring-black/5 dark:ring-white/10" style={{ minHeight: 'calc(100vh - 2rem)' }}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 relative bg-[#fcfcfd] dark:bg-[#0f172a]">
              <Header />
              <main className="flex-1 w-full pb-10">
                <div className="px-6 md:px-8 lg:px-10">
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

