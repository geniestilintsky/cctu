import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { PLATFORM } from '@/lib/config';
import Providers from '@/components/providers';

/**
 * Inter for the interface (dense, neutral, great at small sizes) and Fraunces
 * for display — an optical-size serif that gives the headlines the editorial
 * weight a university brand should carry without feeling stuffy.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: `${PLATFORM.name} — ${PLATFORM.university} learning materials`,
    template: `%s · ${PLATFORM.name}`,
  },
  description: `Past exams, quizzes, tutorials, handouts, books and theses for ${PLATFORM.university}, organised by faculty, department and course.`,
  keywords: [
    'CCTU',
    'Cape Coast Technical University',
    'past questions',
    'past exams',
    'course materials',
    'handouts',
    'Ghana university',
  ],
  openGraph: {
    title: `${PLATFORM.name}`,
    description: `Every past question, handout and tutorial for ${PLATFORM.university} — in one place.`,
    type: 'website',
  },
  icons: { icon: '/cctu-crest.png' },
};

export const viewport: Viewport = {
  themeColor: '#0D2947',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
