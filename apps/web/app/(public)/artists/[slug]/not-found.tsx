import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function ArtistNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Artist not found</h1>
          <p className="text-gray-600">
            This artist page doesn't exist or has been disabled.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go home</span>
          </Link>
          
          <Link
            href="/discover"
            className="inline-flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Discover artists</span>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
