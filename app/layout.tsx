import './globals.css';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Splithouse — Roommate Expenses',
  description: 'Split rent, bills and groceries with your roommates.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
