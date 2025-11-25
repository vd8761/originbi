import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/app/ClientProvider';

export const metadata: Metadata = {
  title: 'OriginBI Login',
  description:
    'A modern, visually appealing login screen with a testimonial carousel, designed to showcase a professional and engaging user authentication experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-brand-light-primary dark:bg-brand-dark-primary text-brand-text-light-primary dark:text-brand-text-primary font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
