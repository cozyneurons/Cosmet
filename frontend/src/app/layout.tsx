import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cosmet - Cosmetic Ingredient Safety Analyzer',
  description: 'AI-powered cosmetic ingredient safety analysis. Get personalized safety assessments based on your skin type and allergen profile in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
