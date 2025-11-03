'use client'

import SimpleChatbot from '@/components/SimpleChatbot'

export default function TestChatbotPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chatbot Test Page
          </h1>
          <p className="text-gray-600">
            Testing simple chatbot interface for job description creation
          </p>
        </div>

        <SimpleChatbot />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This is a standalone test page that won't affect other components.</p>
          <p>Navigate back to <a href="/dashboard" className="text-blue-600 hover:underline">/dashboard</a> when done testing.</p>
        </div>
      </div>
    </div>
  )
}