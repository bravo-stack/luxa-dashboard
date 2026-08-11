import type { Metadata } from 'next';
import { Geist_Mono, IBM_Plex_Sans } from 'next/font/google';

import { ThemeBootstrapScript } from '@/components/theme/theme-bootstrap-script';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { TelemetryProvider } from '@/lib/analytics/provider';
import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme';

import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/luxa-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="system"
      className={`${ibmPlexSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootstrapScript html={THEME_BOOTSTRAP_SCRIPT} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <TelemetryProvider>{children}</TelemetryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
