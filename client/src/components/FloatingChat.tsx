import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, Square, Volume2, VolumeX, Move, Maximize2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';

// Utility Functions
const generateDeviceFingerprint = (): string => {
  return `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}_${navigator.language}`;
};

const generateSessionId = (): string => {
  const existingSessionId = sessionStorage.getItem('chakrai_session_id');
  if (existingSessionId) return existingSessionId;

  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem('chakrai_session_id', newSessionId);
  return newSessionId;
};

const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

// Types and Interfaces
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  timestamp: number;
}

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedVoice: string;
}

interface ChatApiResponse {
  success: boolean;
  message?: string;
  response?: string;
  audio?: string;
  error?: string;
}

interface TranscriptionResponse {
  success: boolean;
  transcription?: string;
  error?: string;
}

interface ChatHistoryResponse {
  success: boolean;
  messages?: Message[];
  error?: string;
}

// Main Component
const FloatingChat: React.FC<FloatingChatProps> = ({ isOpen, onToggle, selectedVoice }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  
  // Dragging and resizing state
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [size, setSize] = useState({ width: 384, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Refs for persistent values and DOM elements
  const sessionIdRef = useRef<string>(generateSessionId());
  const deviceFingerprintRef = useRef<string>(generateDeviceFingerprint());
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const queryClient = useQueryClient();

  // Utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const constrainToViewport = useCallback((pos: { x: number; y: number }, dimensions: { width: number; height: number }) => {
    const maxX = window.innerWidth - dimensions.width;
    const maxY = window.innerHeight - dimensions.height;
    return {
      x: Math.max(0, Math.min(maxX, pos.x)),
      y: Math.max(0, Math.min(maxY, pos.y))
    };
  }, []);

  // Window resize handler to keep chat in bounds
  const handleWindowResize = useCallback(() => {
    setPosition(prev => constrainToViewport(prev, size));
  }, [size, constrainToViewport]);

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [handleWindowResize]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Mouse event handlers for dragging with proper bounds checking
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPos = constrainToViewport({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }, size);
      setPosition(newPos);
    }
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(800, resizeStart.width + (e.clientX - resizeStart.x)));
      const newHeight = Math.max(400, Math.min(700, resizeStart.height + (e.clientY - resizeStart.y)));
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size, constrainToViewport]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    e.preventDefault();
    e.stopPropagation();
  }, [size]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isDragging ? 'grabbing' : 'nw-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // API functions with proper error handling
  const loadChatHistory = useCallback(async (): Promise<void> => {
    try {
      const response: AxiosResponse<ChatHistoryResponse> = await axios.get('/api/chat/history/1?limit=50', {
        headers: {
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });

      if (response.data.success && response.data.messages) {
        const messagesWithIds = response.data.messages.map(msg => ({
          ...msg,
          id: msg.id || generateUniqueId()
        }));
        setMessages(messagesWithIds);
      } else {
        // Only show greeting if no chat history exists
        setMessages([{
          id: generateUniqueId(),
          sender: 'bot',
          text: 'Hello! I\'m Chakrai, How are you feeling today?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Fallback to greeting message
      setMessages([{
        id: generateUniqueId(),
        sender: 'bot',
        text: 'Hello! I\'m Chakrai, How are you feeling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      }]);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    const timestamp = Date.now();
    const userMessage: Message = {
      id: generateUniqueId(),
      sender: 'user',
      text: text.trim(),
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: AxiosResponse<ChatApiResponse> = await axios.post('/api/chat', {
        message: text.trim(),
        context: 'floating_chat'
      }, {
        headers: {
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });

      if (response.data.success) {
        const botTimestamp = Date.now();
        const botMessage: Message = {
          id: generateUniqueId(),
          sender: 'bot',
          text: response.data.message || response.data.response || 'Sorry, I couldn\'t process that.',
          time: new Date(botTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: botTimestamp
        };

        setMessages(prev => [...prev, botMessage]);

        // Auto-play voice response if voice is enabled
        if (selectedVoice && (response.data.message || response.data.response)) {
          playVoiceResponse(response.data.message || response.data.response || '');
        }
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorTimestamp = Date.now();
      const errorMessage: Message = {
        id: generateUniqueId(),
        sender: 'bot',
        text: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        time: new Date(errorTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: errorTimestamp
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVoice]);

  const playVoiceResponse = useCallback(async (text: string): Promise<void> => {
    if (!selectedVoice || isPlayingVoice) return;

    setIsPlayingVoice(true);
    try {
      const response = await axios.post('/api/text-to-speech', {
        text,
        voice: selectedVoice
      }, { responseType: 'blob' });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = 0.8;
      audioRef.current.onended = () => {
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      try {
        await audioRef.current.play();
      } catch (playError) {
        console.error('Autoplay prevented:', playError);
        setIsPlayingVoice(false);
        URL.revokeObjectURL(audioUrl);
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      setIsPlayingVoice(false);
    }
  }, [selectedVoice, isPlayingVoice]);

  const stopVoice = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingVoice(false);
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Test MIME type support
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: selectedMimeType || 'audio/webm' 
          });
          await sendAudioToWhisper(audioBlob);
          audioChunksRef.current = [];
        }
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      setIsRecording(true);
      recorder.start(1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const sendAudioToWhisper = useCallback(async (audioBlob: Blob): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('userId', '1');
      
      const response: AxiosResponse<TranscriptionResponse> = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Device-Fingerprint': deviceFingerprintRef.current,
          'X-Session-Id': sessionIdRef.current
        }
      });
      
      if (response.data.success && response.data.transcription) {
        await sendMessage(response.data.transcription);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  }, [sendMessage]);

  // Event handlers
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  }, [inputMessage, sendMessage]);

  const handleMicrophoneToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Load chat history when component opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen, messages.length, loadChatHistory]);

  // Cleanup when component closes or unmounts
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopRecording();
    }
  }, [isOpen, isRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Render collapsed button when closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border-2 border-silver"
        style={{
          backgroundColor: `var(--theme-primary)`,
          color: 'white',
          zIndex: 1000,
          right: `${position.x}px`,
          bottom: `${window.innerHeight - position.y - 60}px`
        }}
        aria-label="Open chat assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // Main chat interface
  return (
    <div
      ref={chatRef}
      className="fixed rounded-2xl shadow-2xl flex flex-col border-2 border-silver"
      style={{
        backgroundColor: `var(--theme-background)`,
        zIndex: 1000,
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label="Chakrai Chat Assistant"
      aria-modal="true"
    >
      {/* Header */}
      <div 
        className="p-4 rounded-t-2xl flex items-center justify-between border-b drag-handle cursor-grab"
        style={{ 
          backgroundColor: `var(--theme-surface)`,
          borderColor: `var(--theme-accent)`
        }}
        role="banner"
      >
        <div className="flex items-center space-x-2 drag-handle">
          <Move size={16} className="theme-text drag-handle opacity-50" aria-hidden="true" />
          <MessageCircle size={20} className="theme-text drag-handle" aria-hidden="true" />
          <h3 className="font-semibold theme-text drag-handle">Chakrai Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs theme-text-secondary" aria-label={`Chat window size: ${size.width} by ${size.height} pixels`}>
            {size.width}x{size.height}
          </span>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/10 rounded theme-text"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3" 
        style={{ userSelect: 'text' }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                message.sender === 'user' 
                  ? 'rounded-br-md' 
                  : 'rounded-bl-md'
              }`}
              style={{
                backgroundColor: message.sender === 'user' 
                  ? `var(--theme-primary)` 
                  : `var(--theme-surface)`,
                border: message.sender === 'user' ? 'none' : `1px solid var(--theme-accent)`
              }}
              role={message.sender === 'user' ? 'article' : 'article'}
              aria-label={`${message.sender === 'user' ? 'Your' : 'Assistant'} message at ${message.time}`}
            >
              <p className="text-sm">{message.text}</p>
              <span className="text-xs theme-text-secondary mt-1 block">{message.time}</span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div 
              className="p-3 rounded-2xl"
              style={{
                backgroundColor: `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`
              }}
              role="status"
              aria-label="Assistant is typing"
            >
              <div className="flex space-x-1">
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: `var(--theme-accent)` }}
                  aria-hidden="true"
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.1s'
                  }}
                  aria-hidden="true"
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: `var(--theme-accent)`,
                    animationDelay: '0.2s'
                  }}
                  aria-hidden="true"
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        className="p-4 border-t"
        style={{ borderColor: `var(--theme-accent)` }}
        role="form"
        aria-label="Message input area"
      >
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full rounded-xl px-4 py-2 theme-text focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
              style={{
                backgroundColor: `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`
              }}
              disabled={isLoading || isRecording}
              aria-label="Type your message"
              aria-describedby="input-help"
            />
            <span id="input-help" className="sr-only">
              Press Enter to send message, Shift+Enter for new line
            </span>
          </div>
          
          {/* Voice controls */}
          {selectedVoice && (
            <button
              onClick={isPlayingVoice ? stopVoice : undefined}
              className="p-2 rounded-xl transition-colors theme-text"
              style={{
                backgroundColor: isPlayingVoice 
                  ? '#ef4444' 
                  : `var(--theme-surface)`,
                border: `1px solid var(--theme-accent)`
              }}
              disabled={!isPlayingVoice}
              aria-label={isPlayingVoice ? "Stop voice playback" : "Voice playback"}
            >
              {isPlayingVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}

          {/* Microphone button */}
          <button
            onClick={handleMicrophoneToggle}
            className={`p-2 rounded-xl transition-colors ${
              isRecording ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: isRecording 
                ? '#ef4444' 
                : `var(--theme-primary)`,
              border: `1px solid var(--theme-accent)`,
              color: 'white'
            }}
            disabled={isLoading}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
          >
            {isRecording ? (
              <Square size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(inputMessage)}
            className="p-2 rounded-xl transition-colors disabled:opacity-50 theme-text border-2 border-silver"
            style={{
              backgroundColor: `var(--theme-primary)`,
              color: 'white'
            }}
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        
        {isRecording && (
          <div 
            className="mt-2 text-center"
            role="status"
            aria-live="polite"
          >
            <span className="text-sm theme-text-secondary">
              🎤 Recording... Click microphone to stop
            </span>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(-45deg, transparent 0%, transparent 30%, var(--theme-accent) 30%, var(--theme-accent) 35%, transparent 35%, transparent 65%, var(--theme-accent) 65%, var(--theme-accent) 70%, transparent 70%)`
        }}
        onMouseDown={handleResizeStart}
        aria-label="Resize chat window"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleResizeStart(e as any);
          }
        }}
      />
    </div>
  );
};

export default FloatingChat;