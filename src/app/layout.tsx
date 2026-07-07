import type { Metadata } from 'next';
import { Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';

import { themeBootstrapScript, ThemeProvider } from '@/components/theme/theme-provider';
import { TelemetryProvider } from '@/lib/analytics/provider';

import './globals.css';

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta-sans',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luxa',
  description: 'Premium software and business systems command center.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="luxa-theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <ThemeProvider>
          <TelemetryProvider>{children}</TelemetryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
