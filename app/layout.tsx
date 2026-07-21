import type { Metadata } from 'next';
import { Instrument_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const instrumentSans = Instrument_Sans({
  variable: '--font-instrument-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Finance Tracker',
  description: 'Personal finance tracker — budgets, accounts, and emergency fund.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} h-full`}>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
