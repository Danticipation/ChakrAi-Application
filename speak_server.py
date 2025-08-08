from flask import Flask, request, send_file, jsonify
from piper import PiperVoice
import uuid
import os
import tempfile

# Try to import whisper for local transcription
try:
    import whisper
    WHISPER_AVAILABLE = True
    print("Loading Whisper model for transcription...")
    whisper_model = whisper.load_model("base")
    print("Whisper model loaded successfully")
except ImportError:
    WHISPER_AVAILABLE = False
    whisper_model = None
    print("Whisper not available. Install with: pip install openai-whisper")

app = Flask(__name__)

# Load the Amy voice model
print("Loading Piper voice model...")
voice = PiperVoice.load(
    model_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx",
    config_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx.json"
)
print("Piper voice model loaded successfully")

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.json
        text = data.get("text", "")
        
        if not text:
            return {"error": "Text is required"}, 400
        
        # Generate unique filename in temp directory
        temp_dir = tempfile.gettempdir()
        filename = os.path.join(temp_dir, f"output_{uuid.uuid4().hex}.wav")
        
        # Synthesize speech with Piper
        wav = voice.synthesize(text)
        
        # Write to file
        with open(filename, "wb") as f:
            f.write(wav)
        
        # Return the audio file
        return send_file(filename, mimetype="audio/wav", as_attachment=False)
        
    except Exception as e:
        print(f"Error in speech synthesis: {e}")
        return {"error": "Failed to generate speech"}, 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if not WHISPER_AVAILABLE:
        return jsonify({"error": "Whisper not available. Install with: pip install openai-whisper"}), 503
    
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400
        
        # Save uploaded file temporarily
        temp_dir = tempfile.gettempdir()
        temp_filename = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex}.wav")
        
        audio_file.save(temp_filename)
        
        try:
            # Transcribe with Whisper
            result = whisper_model.transcribe(temp_filename)
            transcription = result["text"].strip()
            
            # Clean up temp file
            os.remove(temp_filename)
            
            return jsonify({
                "text": transcription,
                "language": result.get("language", "en")
            })
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            raise e
            
    except Exception as e:
        print(f"Error in transcription: {e}")
        return jsonify({"error": "Failed to transcribe audio"}), 500

@app.route('/health', methods=['GET'])
def health():
    services = {
        "status": "healthy",
        "services": {
            "piper_tts": "available",
            "whisper_transcription": "available" if WHISPER_AVAILABLE else "unavailable"
        }
    }
    return jsonify(services)

if __name__ == '__main__':
    print("Starting Piper TTS + Whisper server...")
    print("Voice model: Amy (en_US-amy-medium)")
    if WHISPER_AVAILABLE:
        print("Transcription: Whisper (base model)")
    else:
        print("Transcription: Not available (install openai-whisper)")
    app.run(host='0.0.0.0', port=5005, debug=False)