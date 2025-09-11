export const speakWithElevenLabs = async (text: string): Promise<void> => {
  try {
    console.log('🎤 Attempting ElevenLabs TTS for:', text.substring(0, 50) + '...');
    
    const response = await fetch('/api/tts/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text,
        voice: 'rachel'  // Add default voice
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API failed:', response.status, errorText);
      throw new Error(`TTS API failed with status: ${response.status}`);
    }

    console.log('✅ ElevenLabs TTS response received');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        console.log('🔊 ElevenLabs audio playback completed');
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = () => {
        console.error('❌ Audio playback failed');
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error);
    throw error;
  }
};

// BROWSER TTS ENABLED FOR DEVELOPMENT
export const speakWithBrowserTTS = (text: string): Promise<void> => {
  console.log('🔊 Fall back Browser TTS');
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    // Try to use a pleasant voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Alex')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      reject(new Error(`Speech synthesis failed: ${event.error}`));
    };
    
    console.log('🔊 Playing text-to-speech:', text.substring(0, 50) + '...');
    window.speechSynthesis.speak(utterance);
  });
};

// NEW: Smart TTS that tries ElevenLabs first, falls back to browser TTS
export const speak = async (text: string): Promise<void> => {
  try {
    console.log('🎯 Smart TTS: Trying ElevenLabs first...');
    await speakWithElevenLabs(text);
    console.log('✅ ElevenLabs TTS successful');
  } catch (error: unknown) { // Explicitly type error as unknown
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('⚠️ ElevenLabs failed, falling back to browser TTS:', errorMessage);
    await speakWithBrowserTTS(text);
  }
};
