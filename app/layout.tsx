import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Colossus App',
  description: 'Scaffolded by Colossus (template-nextjs-fullstack)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
