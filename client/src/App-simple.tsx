import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Simple Chakrai App without complex contexts
function ChakraiApp() {
  const [activeSection, setActiveSection] = useState('home');

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">🧠</div>
            <h1 className="text-4xl font-bold text-blue-600 mb-4">Chakrai</h1>
            <p className="text-xl text-gray-600 mb-8">Your AI-powered mental wellness companion</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div 
                className="p-6 bg-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveSection('chat')}
              >
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-lg">Chat Interface</h3>
                <p className="text-gray-600">Start a therapeutic conversation</p>
              </div>
              <div 
                className="p-6 bg-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveSection('journal')}
              >
                <div className="text-3xl mb-3">📔</div>
                <h3 className="font-semibold text-lg">Journal</h3>
                <p className="text-gray-600">Track your thoughts and feelings</p>
              </div>
              <div 
                className="p-6 bg-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setActiveSection('analytics')}
              >
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-lg">Analytics</h3>
                <p className="text-gray-600">View your wellness insights</p>
              </div>
            </div>
          </div>
        );
      case 'chat':
        return <ChatInterface onBack={() => setActiveSection('home')} />;
      case 'journal':
        return <JournalInterface onBack={() => setActiveSection('home')} />;
      case 'analytics':
        return <AnalyticsInterface onBack={() => setActiveSection('home')} />;
      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {renderContent()}
      </div>
    </QueryClientProvider>
  );
}

// Simple Chat Interface
function ChatInterface({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      
      const data = await response.json();
      const botMessage = { id: Date.now() + 1, text: data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <button onClick={onBack} className="mr-4 text-xl">←</button>
        <h2 className="text-xl font-semibold">Chakrai Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-500">Thinking...</div>}
      </div>
      
      <div className="p-4 bg-white border-t flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Share what's on your mind..."
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Simple Journal Interface
function JournalInterface({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-green-600 text-white p-4 flex items-center">
        <button onClick={onBack} className="mr-4 text-xl">←</button>
        <h2 className="text-xl font-semibold">Journal</h2>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">How are you feeling today?</h3>
          <textarea 
            className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:border-green-500"
            placeholder="Write about your thoughts, feelings, or experiences..."
          />
          <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Analytics Interface
function AnalyticsInterface({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-purple-600 text-white p-4 flex items-center">
        <button onClick={onBack} className="mr-4 text-xl">←</button>
        <h2 className="text-xl font-semibold">Wellness Analytics</h2>
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-lg mb-2">Mood Trends</h3>
            <div className="text-3xl text-blue-600 font-bold">📈</div>
            <p className="text-gray-600">Improving over time</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-lg mb-2">Chat Sessions</h3>
            <div className="text-3xl text-green-600 font-bold">💬</div>
            <p className="text-gray-600">Regular engagement</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-semibold text-lg mb-2">Journal Entries</h3>
            <div className="text-3xl text-purple-600 font-bold">📔</div>
            <p className="text-gray-600">Consistent reflection</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChakraiApp;