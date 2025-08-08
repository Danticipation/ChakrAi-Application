from flask import Flask, request, send_file
from piper import PiperVoice
import uuid
import os
import tempfile

app = Flask(__name__)

# Load the Amy voice model
voice = PiperVoice.load(
    model_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx",
    config_path="C:/Piper/models/en_US-amy-medium/en_US-amy-medium.onnx.json"
)

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

@app.route('/health', methods=['GET'])
def health():
    return {"status": "healthy", "service": "Piper TTS"}

if __name__ == '__main__':
    print("Starting Piper TTS server...")
    print("Voice model: Amy (en_US-amy-medium)")
    app.run(host='0.0.0.0', port=5005, debug=False)