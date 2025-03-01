// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Lock, 
  MessageSquare, 
  ClipboardCheck,
  BookOpen 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-16 mb-10 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
                Your Mental Health Matters
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                A safe, private space where you can assess your mental well-being and 
                chat with our supportive AI companion. No accounts, no data saved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/assessment">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium">
                    Start Assessment
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" className="px-6 py-3 rounded-lg font-medium">
                    Go to Chat
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white p-6">
                <div className="flex items-center mb-6">
                  <Heart className="h-8 w-8 text-rose-500 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Mental Well-being Assessment
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Answer 10 questions to get insights into your current mental state and 
                  receive personalized support.
                </p>
                <hr className="my-6" />
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-blue-500 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Supportive AI Chat
                  </h2>
                </div>
                <p className="text-gray-600">
                  Discuss your thoughts and feelings with our AI assistant trained to 
                  provide empathetic, helpful responses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Complete Assessment
              </h3>
              <p className="text-gray-600">
                Answer 10 questions about your mental state, sleep patterns, and overall well-being.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Chat for Support
              </h3>
              <p className="text-gray-600">
                Engage in a conversation with our AI assistant, who will provide thoughtful responses based on your assessment.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                Learn & Grow
              </h3>
              <p className="text-gray-600">
                Access resources, coping strategies, and educational content about mental health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-16 mb-10 lg:mb-0">
              <div className="flex items-center mb-6">
                <Lock className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">
                  Your Privacy Matters
                </h2>
              </div>
              <p className="text-lg text-gray-700 mb-6">
                We prioritize your privacy and confidentiality. This application:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-indigo-600">✓</span>
                  <span>Does not require account creation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-indigo-600">✓</span>
                  <span>Does not store your assessment results or conversations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-indigo-600">✓</span>
                  <span>Deletes all data when you close the browser</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-1 text-indigo-600">✓</span>
                  <span>Uses secure, encrypted communication</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Important Note
                </h3>
                <p className="text-gray-600 mb-4">
                  This application is designed as a supportive tool and is not a substitute for professional mental health care.
                </p>
                <p className="text-gray-600 mb-4">
                  If you are experiencing severe symptoms or are in crisis, please contact a mental health professional or emergency services immediately.
                </p>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-red-700 font-medium">
                    In case of emergency:
                  </p>
                  <p className="text-red-700">
                    Call your local emergency number or mental health crisis hotline
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-600">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to Begin Your Mental Health Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Take a few minutes to complete our assessment and get personalized support.
          </p>
          <Link href="/assessment">
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-medium text-lg">
              Start Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}