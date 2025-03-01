// src/components/layout/Header.tsx
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Heart className="h-6 w-6 text-rose-500 mr-2" />
            <span className="font-semibold text-xl text-gray-900">
              Mindful AI
            </span>
          </Link>
          
          <div className="flex space-x-2">
            <Link href="/assessment">
              <Button variant="outline" className="hidden sm:inline-flex">
                Start Assessment
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}