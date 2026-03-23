import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from './ClientProvider';

export const metadata: Metadata = {
  title: 'OriginBI Mind | Personalized Career Guidance',
  description:
    'Navigate your future with OriginBI Mind. Get expert advice from our AI Counsellor, take psychological assessments, and map out your personalized career roadmap for success.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('theme');
                if (stored === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="bg-brand-light-primary dark:bg-brand-dark-primary text-brand-text-light-primary dark:text-brand-text-primary font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
