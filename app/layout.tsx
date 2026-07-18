import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RelaxNet — быстрый и надёжный VPN',
  description: 'RelaxNet PRO: стабильный VPN с оплатой в рублях и мгновенной выдачей ключа на почту.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-bg text-white min-h-screen antialiased">{children}</body>
    </html>
  );
}
