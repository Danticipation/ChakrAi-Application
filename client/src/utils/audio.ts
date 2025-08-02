export const sendAudioToWhisper = async (audioBlob: Blob, setInput: (text: string) => void) => {
  try {
    console.log('Sending audio to Whisper API...');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    console.log('Transcription response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Transcription result:', data);

      if (data.text && data.text.trim()) {
        const transcription = data.text.trim();
        
        // Filter out common nonsensical transcriptions
        const nonsensicalPatterns = [
          /^[^\w\s]*$/, // Only symbols/emojis
          /^.{1,3}$/, // Very short (1-3 characters)
          /^(thank you|thanks|watching|subscribe)/i, // Common YouTube-like phrases
          /^[🧡❤️💙💚💛💜🖤🤍🤎]+$/, // Only heart emojis
          /^[\s.,!?\-]*$/, // Only punctuation/whitespace (dash escaped)
        ];
        
        const isNonsensical = nonsensicalPatterns.some(pattern => pattern.test(transcription));
        
        if (isNonsensical) {
          console.log('🚫 Transcription appears nonsensical, filtering out:', transcription);
          setInput(''); // Don't set nonsensical text
        } else {
          setInput(transcription);
          console.log('✅ Valid transcription set:', transcription);
        }
      } else {
        console.log('Empty transcription result');
        setInput(''); // Clear input instead of showing alert
      }
    } else {
      const errorData = await response.text();
      console.error('Transcription failed:', response.status, errorData);
      alert('Transcription service unavailable. Please try again later.');
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    alert('Failed to transcribe audio. Please check your internet connection and try again.');
  }
};

export const startRecording = async (
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  setIsRecording: (recording: boolean) => void,
  setInput: (text: string) => void
) => {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1,
        // Prevent system audio capture
        suppressLocalAudioPlayback: true,
        googEchoCancellation: true,
        googAutoGainControl: true,
        googNoiseSuppression: true,
        googHighpassFilter: true,
        googTypingNoiseDetection: true
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // CRITICAL FIX: Try MP4/WAV first for better OpenAI Whisper compatibility
    let mimeType = 'audio/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Browser does not support MP4 or WAV recording. WebM causes transcription failures.');
      }
    }
    
    console.log('🎵 MAIN CHAT using audio format:', mimeType);

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    // Silence detection setup
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    microphone.connect(analyser);

    let lastSoundTime = Date.now();
    let isContextClosed = false;
    let recordingStartTime = Date.now();
    const SILENCE_THRESHOLD = 15; // Lowered to be more sensitive to actual speech
    const SILENCE_DURATION = 3000; // Reduced to 3 seconds of continuous silence
    const MIN_RECORDING_DURATION = 2000; // Minimum 2 seconds before silence detection kicks in

    // Safe AudioContext cleanup
    const closeAudioContext = () => {
      if (!isContextClosed && audioContext.state !== 'closed') {
        audioContext.close().catch(err => console.warn('AudioContext close warning:', err));
        isContextClosed = true;
      }
    };

    // Simplified silence detection - only for very long pauses (disabled for now)
    const checkSilence = () => {
      if (mediaRecorder.state !== 'recording' || isContextClosed) return;
      
      // Disabled automatic silence detection to prevent cutting off natural speech
      // Only rely on manual stop or 45-second timeout
      requestAnimationFrame(checkSilence);
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      closeAudioContext();
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('🎵 MAIN CHAT audio blob type:', audioBlob.type, 'size:', audioBlob.size);
        
        // Validate audio blob before sending to transcription
        const recordingDuration = Date.now() - recordingStartTime;
        console.log(`📊 Recording analysis: ${audioBlob.size} bytes, ${recordingDuration}ms duration`);
        
        if (audioBlob.size < 2000) { // Reduced to 2KB - allow shorter legitimate speech
          console.log('🚫 Recording too small (< 2KB), likely just noise/silence. Skipping transcription.');
          setInput(''); // Clear any placeholder text
        } else if (recordingDuration < 800) { // Reduced to 0.8s minimum - allow shorter phrases
          console.log('🚫 Recording too short (< 0.8s), likely accidental tap. Skipping transcription.');
          setInput(''); // Clear any placeholder text
        } else {
          console.log(`🎤 Valid recording passed validation - sending to transcription`);
          await sendAudioToWhisper(audioBlob, setInput);
        }
      } else {
        console.log('🚫 No audio chunks recorded');
        setInput(''); // Clear any placeholder text
      }
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      closeAudioContext();
      alert('Recording error occurred. Please try again.');
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    
    // Start silence detection
    checkSilence();

    // Auto-stop recording after 45 seconds as safety measure
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        console.log('⏰ Auto-stopping due to 45-second time limit');
        stopRecording(mediaRecorderRef, setIsRecording);
        closeAudioContext();
      }
    }, 45000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    const err = error as any;
    if (err?.name === 'NotAllowedError') {
      alert('Microphone permission denied. Please allow microphone access and try again.');
    } else if (err?.name === 'NotFoundError') {
      alert('No microphone found. Please check your device.');
    } else {
      alert('Could not access microphone: ' + (err?.message || 'Unknown error'));
    }
  }
};

export const stopRecording = (
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>,
  setIsRecording: (recording: boolean) => void
) => {
  if (mediaRecorderRef.current?.state === 'recording') {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }
};

export const playElevenLabsAudio = async (
  base64Audio: string,
  voiceUsed: string,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
) => {
  try {
    const audioBlob = new Blob([
      Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
    ], { type: 'audio/mpeg' });

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audio.preload = 'auto';
    audio.volume = 0.8;

    try {
      await audio.play();
      console.log(`✓ ElevenLabs ${voiceUsed || 'voice'} played successfully`);
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
    } catch {
      const readyMessage = {
        sender: 'bot',
        text: '🔊 Audio ready - click anywhere to hear Carla voice',
        time: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, readyMessage]);

      const playOnClick = async () => {
        try {
          await audio.play();
          console.log('✓ ElevenLabs Carla voice played after user interaction');
          setMessages(prev => prev.filter(msg => msg.text !== readyMessage.text));
        } catch (err) {
          console.error('Audio play failed even with user gesture:', err);
        }

        document.removeEventListener('click', playOnClick);
        URL.revokeObjectURL(audioUrl);
      };

      document.addEventListener('click', playOnClick, { once: true });
    }
  } catch (error) {
    console.error('ElevenLabs audio processing failed:', error);
  }
};