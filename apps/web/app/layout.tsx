import type { CSSProperties, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Caveat, Fredoka, Nunito } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/Providers';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800'],
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['500', '600', '700'],
});

const caveat = Caveat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-caveat',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Ближе',
  description: 'Тёплое пространство для близости и спокойных разговоров',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${nunito.variable} ${fredoka.variable} ${caveat.variable}`}>
      <body
        className="font-sans antialiased"
        style={
          {
            '--font-sans': 'var(--font-nunito), system-ui, sans-serif',
            '--font-display': 'var(--font-fredoka), var(--font-nunito), sans-serif',
            '--font-hand': 'var(--font-caveat), cursive',
          } as CSSProperties
        }
      >
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
