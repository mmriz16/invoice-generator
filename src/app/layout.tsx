import type { Metadata } from 'next';
import React from 'react';
// eslint-disable-next-line camelcase
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: [ 'latin' ],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: [ 'latin' ],
});

export const metadata: Metadata = {
  title: 'Invoice Generator - PT Aghatis Karya Indonesia',
  description: 'Professional invoice generation and PDF export application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
