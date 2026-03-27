import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Chordially',
    template: '%s | Chordially'
  },
  description: 'Discover and support independent artists on Chordially - your platform for live music and direct artist support.',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
