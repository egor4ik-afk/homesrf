import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Личный кабинет',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
