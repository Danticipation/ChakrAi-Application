//utils/audio.ts
export const sendAudioToWhisper = async (audioBlob, setInput) => {
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
        setInput(data.text.trim());
        console.log('Input set to:', data.text.trim());
      } else {
        console.log('Empty transcription result');
        alert('No speech detected. Please try speaking louder or closer to the microphone.');
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

export const startRecording = async (mediaRecorderRef, audioChunksRef, setIsRecording, setInput) => {
  try {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
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

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToWhisper(audioBlob, setInput);
      } else {
        alert('No audio was recorded. Please try again.');
      }
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      alert('Recording error occurred. Please try again.');
    };

    mediaRecorder.start(1000);
    setIsRecording(true);

    setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        stopRecording(mediaRecorderRef, setIsRecording);
      }
    }, 30000);
  } catch (error) {
    console.error('Error accessing microphone:', error);
    const err = error;
    if (err?.name === 'NotAllowedError') {
      alert('Microphone permission denied. Please allow microphone access and try again.');
    } else if (err?.name === 'NotFoundError') {
      alert('No microphone found. Please check your device.');
    } else {
      alert('Could not access microphone: ' + (err?.message || 'Unknown error'));
    }
  }
};

export const stopRecording = (mediaRecorderRef, setIsRecording) => {
  if (mediaRecorderRef.current?.state === 'recording') {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }
};

export const playElevenLabsAudio = async (base64Audio, voiceUsed, setMessages) => {
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