# Piper TTS Integration Setup

## 🚀 Quick Start

### 1. Install Python Dependencies
```bash
pip install flask piper-tts openai-whisper torch numpy
```
Or install from the requirements file:
```bash
pip install -r piper_requirements.txt
```

### 2. Start the Piper TTS Server
```bash
python speak_server.py
```

The server will start on port 5005 and load:
- Amy voice model for TTS
- Whisper base model for transcription (if available)

### 3. Test the Integration
Your Node.js app will automatically use local models when you:
- Send chat messages that generate TTS responses (uses Piper)
- Record voice messages for transcription (tries local Whisper first, falls back to OpenAI)
- The `/api/voice/text-to-speech` endpoint now calls the local Piper server
- The `/api/voice/transcribe-enhanced` endpoint tries local Whisper first

## 🔧 Configuration

### Voice Model Path
Update the model paths in `speak_server.py` if your Piper models are in a different location:
```python
voice = PiperVoice.load(
    model_path="YOUR_PATH/en_US-amy-medium.onnx",
    config_path="YOUR_PATH/en_US-amy-medium.onnx.json"
)
```

### Server Settings
- **Port**: 5005 (change in `speak_server.py` if needed)
- **Host**: 0.0.0.0 (accessible from your Node.js app)

## 🧪 Testing

### Test TTS directly:
```bash
curl -X POST http://localhost:5005/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Piper TTS!"}'
```

### Test transcription directly:
```bash
curl -X POST http://localhost:5005/transcribe \
  -F "audio=@your_audio_file.wav"
```

### Test through your Node.js app:
```bash
# TTS
curl -X POST http://localhost:5000/api/voice/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Chakrai using Piper!"}'

# Transcription  
curl -X POST http://localhost:5000/api/voice/transcribe-enhanced \
  -F "audio=@your_audio_file.wav"
```

## 🔄 Integration Details

### What Changed:
1. **Created**: `speak_server.py` - Python Flask server with Piper TTS + Whisper transcription
2. **Modified**: `server/routes/voice.js` - Updated TTS to use local Piper, transcription tries local Whisper first
3. **Voice Mapping**: All voice requests now use Amy model (can be expanded later)
4. **Transcription Fallback**: Local Whisper → OpenAI Whisper → Error

### API Flow:

**Text-to-Speech:**
1. Frontend sends text to `/api/voice/text-to-speech`
2. Node.js server scrubs text and forwards to Piper server (port 5005)
3. Piper generates WAV audio and returns it
4. Node.js streams audio back to frontend

**Speech-to-Text:**
1. Frontend sends audio to `/api/voice/transcribe-enhanced`
2. Node.js server tries local Whisper first (port 5005)
3. If local fails, falls back to OpenAI Whisper API
4. Returns transcription with source indicator

## 🆘 Troubleshooting

### "Piper server is not running" error:
- Make sure `python speak_server.py` is running
- Check if port 5005 is available
- Verify the Amy model files exist at the specified path

### Model loading errors:
- Ensure you have the correct Piper model files
- Update the model paths in `speak_server.py` to match your setup