# Piper TTS Integration Setup

## 🚀 Quick Start

### 1. Install Python Dependencies
```bash
pip install flask piper-tts
```

### 2. Start the Piper TTS Server
```bash
python speak_server.py
```

The server will start on port 5005 and load the Amy voice model.

### 3. Test the Integration
Your Node.js app will automatically use Piper TTS instead of ElevenLabs when you:
- Send chat messages that generate TTS responses
- The `/api/voice/text-to-speech` endpoint now calls the local Piper server

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

### Test the Piper server directly:
```bash
curl -X POST http://localhost:5005/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Piper TTS!"}'
```

### Test through your Node.js app:
```bash
curl -X POST http://localhost:5000/api/voice/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Chakrai using Piper!"}'
```

## 🔄 Integration Details

### What Changed:
1. **Created**: `speak_server.py` - Python Flask server for Piper TTS
2. **Modified**: `server/routes/voice.js` - Updated to call local Piper server instead of ElevenLabs
3. **Voice Mapping**: All voice requests now use Amy model (can be expanded later)

### API Flow:
1. Frontend sends text to `/api/voice/text-to-speech`
2. Node.js server scrubs text and forwards to Piper server (port 5005)
3. Piper generates WAV audio and returns it
4. Node.js streams audio back to frontend

## 🆘 Troubleshooting

### "Piper server is not running" error:
- Make sure `python speak_server.py` is running
- Check if port 5005 is available
- Verify the Amy model files exist at the specified path

### Model loading errors:
- Ensure you have the correct Piper model files
- Update the model paths in `speak_server.py` to match your setup