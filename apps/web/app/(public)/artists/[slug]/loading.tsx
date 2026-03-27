import { ArtistProfileSkeleton } from '@/components/artist/ArtistProfileSkeleton';

export default function ArtistProfileLoading() {
  return (
    <div className="min-h-screen bg-white">
      <ArtistProfileSkeleton />
    </div>
  );
}
