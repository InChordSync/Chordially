import Link from 'next/link';
import { Music, Users, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Discover & Support
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Independent Artists
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Chordially connects fans with artists through live sessions and direct support. 
              Drop a chord and show your love for the music that moves you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/artists/john-doe"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Music className="w-5 h-5" />
                <span>View Artist Profile</span>
              </Link>
              <Link
                href="/artists/sarah-smith"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Another Artist</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Sessions</h3>
            <p className="text-gray-600">
              Join artists as they perform live and share their creative process in real-time.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Direct Support</h3>
            <p className="text-gray-600">
              Support your favorite artists directly with instant micro-tips and donations.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
            <p className="text-gray-600">
              Connect with artists and fans who share your passion for great music.
            </p>
          </div>
        </div>
      </div>

      {/* Test Artists */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Featured Artists</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/artists/john-doe"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">John Doe</h3>
                <p className="text-sm text-gray-600">Acoustic, Folk, Indie</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/artists/sarah-smith"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                SS
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sarah Smith</h3>
                <p className="text-sm text-gray-600">Electronic, EDM, House</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
