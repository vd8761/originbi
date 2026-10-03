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
        {/* eslint-disable-next-line */}
        <script
          // Theme initialiser runs before paint to avoid flash of wrong theme.
          // suppressHydrationWarning on <html> ensures React ignores class mismatches.
          // This is the officially recommended pattern for dark-mode in Next.js App Router.
          // See: https://nextjs.org/docs/app/building-your-application/styling/dark-mode
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');if(s==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-brand-light-primary dark:bg-brand-dark-primary text-brand-text-light-primary dark:text-brand-text-primary font-sans">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
