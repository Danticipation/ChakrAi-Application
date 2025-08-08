from flask import Flask, request, send_file, jsonify
from piper import PiperVoice
import uuid
import os
import tempfile

app = Flask(__name__)

# Load the Amy voice model
print("Loading Piper voice model...")
try:
    voice = PiperVoice.load(
        model_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx",
        config_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx.json"
    )
    print("Piper voice model loaded successfully")
except Exception as e:
    print(f"Error loading Piper model: {e}")
    print("Make sure the model files exist at the specified path")
    voice = None

@app.route('/speak', methods=['POST'])
def speak():
    if voice is None:
        return jsonify({"error": "Piper voice model not loaded"}), 503
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        text = data.get("text", "")
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        print(f"Synthesizing text: {text[:50]}...")
        
        # Generate unique filename in temp directory
        temp_dir = tempfile.gettempdir()
        filename = os.path.join(temp_dir, f"output_{uuid.uuid4().hex}.wav")
        
        # Synthesize speech with Piper
        audio_data = voice.synthesize(text)
        
        # Write audio data to file
        with open(filename, "wb") as f:
            # Handle the audio data properly - convert to bytes
            if hasattr(audio_data, '__iter__') and not isinstance(audio_data, (str, bytes)):
                # If it's an iterable of chunks, combine them
                for chunk in audio_data:
                    f.write(bytes(chunk))
            else:
                # If it's already bytes, write directly
                f.write(bytes(audio_data))
        
        print(f"Audio generated: {filename}")
        
        # Return the audio file
        return send_file(filename, mimetype="audio/wav", as_attachment=False)
        
    except Exception as e:
        print(f"Error in speech synthesis: {e}")
        return jsonify({"error": "Failed to generate speech"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "services": {
            "piper_tts": "available" if voice is not None else "unavailable"
        }
    })

if __name__ == '__main__':
    print("Starting Piper TTS server...")
    print("Voice model: Amy (en_US-amy-medium)" if voice else "Voice model: Not loaded")
    app.run(host='0.0.0.0', port=5005, debug=False)