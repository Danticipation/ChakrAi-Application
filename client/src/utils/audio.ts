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

    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      mimeType = 'audio/wav';
    }

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
    const SILENCE_THRESHOLD = 30; // Increased from 20 to reduce false positives
    const SILENCE_DURATION = 5000; // 5 seconds of silence
    const MIN_RECORDING_DURATION = 1000; // Minimum 1 second before silence detection kicks in

    // Safe AudioContext cleanup
    const closeAudioContext = () => {
      if (!isContextClosed && audioContext.state !== 'closed') {
        audioContext.close().catch(err => console.warn('AudioContext close warning:', err));
        isContextClosed = true;
      }
    };

    // Monitor audio levels for silence detection
    const checkSilence = () => {
      if (mediaRecorder.state !== 'recording' || isContextClosed) return;
      
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const currentTime = Date.now();
      
      if (volume > SILENCE_THRESHOLD) {
        lastSoundTime = currentTime;
      } else {
        // Only check for silence after minimum recording duration
        const recordingDuration = currentTime - recordingStartTime;
        if (recordingDuration > MIN_RECORDING_DURATION) {
          // Check if we've been silent for too long
          if (currentTime - lastSoundTime > SILENCE_DURATION) {
            console.log('🔇 Auto-stopping due to 5 seconds of silence (after 1s minimum)');
            stopRecording(mediaRecorderRef, setIsRecording);
            closeAudioContext();
            return;
          }
        }
      }
      
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
        
        // Validate audio blob before sending to transcription
        const recordingDuration = Date.now() - recordingStartTime;
        console.log(`📊 Recording analysis: ${audioBlob.size} bytes, ${recordingDuration}ms duration`);
        
        if (audioBlob.size < 5000) { // Increased from 1KB to 5KB - very small recordings are likely noise
          console.log('🚫 Recording too small (< 5KB), likely just noise/silence. Skipping transcription.');
          setInput(''); // Clear any placeholder text
        } else if (recordingDuration < 1500) { // Increased from 0.5s to 1.5s minimum
          console.log('🚫 Recording too short (< 1.5s), likely accidental tap. Skipping transcription.');
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