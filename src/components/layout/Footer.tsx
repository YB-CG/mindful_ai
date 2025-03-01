// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-rose-500 mr-2" />
              <span className="font-semibold text-lg text-gray-900">
                Mindful AI
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              A safe, private space for mental wellness
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Resources</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://www.nami.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    NAMI
                  </a>
                </li>
                <li>
                  <a href="https://www.samhsa.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    SAMHSA
                  </a>
                </li>
                <li>
                  <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    988 Lifeline
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Emergency</h3>
              <ul className="space-y-1">
                <li className="text-sm text-gray-600">
                  Call <strong>988</strong> (US)
                </li>
                <li className="text-sm text-gray-600">
                  Text HOME to <strong>741741</strong>
                </li>
                <li className="text-sm text-red-600 font-medium">
                  Call 911 for immediate danger
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Navigation</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/assessment" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                    Chat Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            This application is not a substitute for professional mental health care.
            If you are in crisis, please call a crisis hotline or emergency services immediately.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © {new Date().getFullYear()} Mindful AI. All conversations are private and not stored.
          </p>
        </div>
      </div>
    </footer>
  );
}