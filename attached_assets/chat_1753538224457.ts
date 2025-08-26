//utils/chat.ts
import { getCurrentUserId } from '@/utils/userSession';
import { updateUserActivity } from '@/utils/activity';
import { playElevenLabsAudio } from '@/utils/audio';

export const sendMessage = async ({
  input,
  messages,
  setMessages,
  setInput,
  setLoading,
  setIsLoadingVoice,
  selectedVoice
}) => {
  if (!input.trim()) return;

  const userMessage = {
    sender: 'user',
    text: input,
    time: new Date().toLocaleTimeString()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setLoading(true);

  try {
    const deviceFingerprintValue = `browser_${navigator.userAgent.slice(0, 50)}_${screen.width}x${screen.height}_${new Date().getTimezoneOffset()}`;

    let sessionId = localStorage.getItem('chakrai_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('chakrai_session_id', sessionId);
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Fingerprint': deviceFingerprintValue,
        'X-Session-Id': sessionId
      },
      body: JSON.stringify({
        message: input,
        voice: selectedVoice
      })
    });

    if (response.ok) {
      const data = await response.json();
      const botMessage = {
        sender: 'bot',
        text: data.response || data.message || 'I understand.',
        time: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);

      await updateUserActivity(getCurrentUserId(), 'chat_session');

      // Track tone analytics
      try {
        await fetch('/api/analytics/emotional-tone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: getCurrentUserId(),
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
            userId: getCurrentUserId(),
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