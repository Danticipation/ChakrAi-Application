import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, MicOff, Volume2, VolumeX, Bot, User, 
  Sparkles, Heart, Brain, MessageCircle, Copy, 
  MoreVertical, Settings, Zap, Loader2
} from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
  id: string;
}

interface BeautifulChatProps {
  selectedVoice: string;
  voiceStatus: 'idle' | 'recording' | 'processing';
  onVoiceToggle: () => void;
  onSendMessage: (message: string) => void;
  messages: Message[];
  chatInput: string;
  setChatInput: (input: string) => void;
  isAiTyping?: boolean;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-md max-w-xs">
    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <Brain className="w-4 h-4 text-white" />
    </div>
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
    </div>
  </div>
);

const MessageBubble = ({ message, isUser }: { message: Message; isUser: boolean }) => {
  const [showActions, setShowActions] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        } shadow-lg`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Brain className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Message Container */}
        <div 
          className="relative"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Message Bubble */}
          <div className={`relative p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            isUser 
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/30 rounded-br-md' 
              : 'bg-white/10 border-white/20 rounded-bl-md hover:bg-white/15'
          } shadow-lg`}>
            
            {/* Message Text */}
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
            
            {/* Time */}
            <div className={`text-xs mt-2 ${
              isUser ? 'text-purple-200' : 'text-white/60'
            }`}>
              {message.time}
            </div>

            {/* Message Actions */}
            {showActions && (
              <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                <div className="flex space-x-1">
                  <button
                    onClick={copyToClipboard}
                    className="p-1 rounded-lg bg-black/20 hover:bg-black/40 transition-colors duration-200"
                  >
                    <Copy className="w-3 h-3 text-white/80" />
                  </button>
                  <button className="p-1 rounded-lg bg-black/20 hover:bg-black/40 transition-colors duration-200">
                    <MoreVertical className="w-3 h-3 text-white/80" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActions = ({ onActionClick }: { onActionClick: (action: string) => void }) => {
  const actions = [
    { id: 'feelings', label: 'Share my feelings', icon: Heart, color: 'from-rose-500 to-pink-500' },
    { id: 'goal', label: 'Set a wellness goal', icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { id: 'thoughts', label: 'Journal my thoughts', icon: MessageCircle, color: 'from-green-500 to-teal-500' },
    { id: 'meditation', label: 'Guided meditation', icon: Sparkles, color: 'from-purple-500 to-indigo-500' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onActionClick(action.label)}
            className={`p-3 rounded-xl bg-gradient-to-r ${action.color} bg-opacity-20 border border-white/20 hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{action.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const BeautifulChat: React.FC<BeautifulChatProps> = ({
  selectedVoice,
  voiceStatus,
  onVoiceToggle,
  onSendMessage,
  messages,
  chatInput,
  setChatInput,
  isAiTyping = false
}) => {
  const [showQuickActions, setShowQuickActions] = useState(messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    
    setShowQuickActions(false);
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setChatInput(action);
    setShowQuickActions(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Chakrai</h2>
              <p className="text-blue-200 text-sm">Your AI Wellness Companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-300">
              <Volume2 className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-300">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 relative z-10 overflow-y-auto p-6 space-y-1">
        
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Welcome to your reflection journey!</h3>
            <p className="text-blue-200 max-w-md mx-auto leading-relaxed">
              I'm Chakrai, your personal AI wellness companion. I'm here to listen and help you explore your thoughts and emotions.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id || `${message.sender}-${message.time}`}
            message={message}
            isUser={message.sender === 'user'}
          />
        ))}

        {/* Typing Indicator */}
        {isAiTyping && (
          <div className="flex justify-start">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 p-6 bg-white/5 backdrop-blur-sm border-t border-white/10">
        
        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mb-4">
            <QuickActions onActionClick={handleQuickAction} />
          </div>
        )}

        {/* Input */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts, feelings, or ask me anything..."
              className="w-full p-4 pr-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
              rows={1}
              style={{ 
                minHeight: '56px',
                maxHeight: '120px',
                height: Math.min(120, Math.max(56, chatInput.split('\n').length * 24 + 32))
              }}
            />
            
            {/* Character count */}
            {chatInput.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-white/40">
                {chatInput.length}
              </div>
            )}
          </div>

          {/* Voice Button */}
          <button
            onClick={onVoiceToggle}
            className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
              voiceStatus === 'recording' 
                ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' 
                : voiceStatus === 'processing'
                ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {voiceStatus === 'recording' ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : voiceStatus === 'processing' ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!chatInput.trim()}
            className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
              chatInput.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-xl'
                : 'bg-white/10 cursor-not-allowed opacity-50'
            }`}
          >
            <Send className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Voice Status */}
        {voiceStatus !== 'idle' && (
          <div className="mt-3 flex items-center justify-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              voiceStatus === 'recording' ? 'bg-red-400 animate-pulse' : 'bg-yellow-400 animate-spin'
            }`} />
            <span className="text-white/70">
              {voiceStatus === 'recording' ? 'Recording...' : 'Processing...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeautifulChat;