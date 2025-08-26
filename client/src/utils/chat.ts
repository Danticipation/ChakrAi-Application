import { getCurrentUserId, getAuthHeaders } from './unifiedUserSession';
import { updateUserActivity } from '@/utils/activity';
import { playElevenLabsAudio } from '@/utils/audio';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface SendMessageParams {
  input: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: (input: string) => void;
  setLoading: (loading: boolean) => void;
  setIsLoadingVoice: (loading: boolean) => void;
  selectedVoice: string;
}

export const sendMessage = async ({
  input,
  messages,
  setMessages,
  setInput,
  setLoading,
  setIsLoadingVoice,
  selectedVoice
}: SendMessageParams) => {
  if (!input.trim()) return;

  const userMessage: Message = {
    sender: 'user',
    text: input,
    time: new Date().toLocaleTimeString()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    // Use proper authenticated headers
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        message: input,
        voice: selectedVoice
      })
    });

    if (response.ok) {
      const data = await response.json();
      const botMessage: Message = {
        sender: 'bot',
        text: data.response || data.message || 'I understand.',
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);

      await updateUserActivity(await getCurrentUserId(), 'chat_session');

      // Track tone analytics
      try {
        await fetch('/api/analytics/emotional-tone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: await getCurrentUserId(),
            message: input,
            sessionId: Date.now().toString()
          })
        });
      } catch (error) {
        console.error('Analytics tracking failed:', error);
      }

      // Check agent handoff
      try {
        const handoffRes = await fetch('/api/agents/analyze-handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: await getCurrentUserId(),
            message: input,
            conversationHistory: messages.slice(-5)
          })
        });

        if (handoffRes.ok) {
          const handoffData = await handoffRes.json();
          if (handoffData.shouldHandoff && handoffData.confidence > 0.7 && handoffData.handoffMessage) {
            setMessages(prev => [...prev, {
              sender: 'bot',
              text: handoffData.handoffMessage + "\n\n*Click 'Specialists' to connect.*",
              time: new Date().toLocaleTimeString()
            }]);
          }
        }
      } catch (err) {
        console.error('Agent handoff analysis failed:', err);
      }

      if (data.audioUrl && data.audioUrl.length > 1000) {
        setIsLoadingVoice(true);
        await playElevenLabsAudio(data.audioUrl, data.voiceUsed, setMessages);
        setIsLoadingVoice(false);
      } else {
        if (data.error) console.error('Audio error:', data.error);
      }
    }
  } catch (err) {
    console.error('Message send error:', err);
  } finally {
    setLoading(false);
  }
};