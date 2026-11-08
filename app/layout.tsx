import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HR Global Express — Website Admin',
  description: 'Manage HR Global Express website content and media.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
