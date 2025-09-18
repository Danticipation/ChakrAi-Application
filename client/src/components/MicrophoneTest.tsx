// src/components/MicrophoneTest.tsx
import { useState } from "react";
import type { FC } from "react";
import { Mic, Square } from "lucide-react";

const MicrophoneTest: FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const log = (message: string) => {
    console.log(message);
    setTestResults((prev) => [...prev, message]);
  };

  const runMicrophoneTest = async () => {
    setTestResults([]);
    log("🔧 Starting comprehensive microphone test...");

    // Test 1: Check browser support (feature detection, not truthiness)
    log(`📱 Browser: ${navigator.userAgent.slice(0, 50)}...`);
    log(`🎧 MediaDevices: ${"mediaDevices" in navigator ? "✅" : "❌"}`);
    log(`🎤 getUserMedia: ${"mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices ? "✅" : "❌"}`);
    log(`📊 MediaRecorder: ${"MediaRecorder" in window ? "✅" : "❌"}`);

    if (!("mediaDevices" in navigator) || !("getUserMedia" in navigator.mediaDevices)) {
      log("❌ getUserMedia not supported");
      return;
    }

    if (!("MediaRecorder" in window)) {
      log("❌ MediaRecorder not supported");
      return;
    }

    // Test 2: Basic permission test
    try {
      log("🔍 Testing basic microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      log("✅ Basic microphone access granted");

      try {
        const recorder = new MediaRecorder(stream);
        log("✅ MediaRecorder created successfully");
        log(`💡 State: ${recorder.state}, MIME: ${recorder.mimeType}`);
        recorder.stop();
      } catch (recorderError) {
        log(`❌ MediaRecorder error: ${String(recorderError)}`);
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (error) {
      const err = error as { name?: string; message?: string };
      log(`❌ Microphone access failed: ${err.name ?? "Error"} - ${err.message ?? ""}`);
      return;
    }

    // Test 3: MIME type support
    log("🧪 Testing MIME type support:");
    const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/wav"];
    for (const type of mimeTypes) {
      const supported = "MediaRecorder" in window ? MediaRecorder.isTypeSupported(type) : false;
      log(`  ${type}: ${supported ? "✅" : "❌"}`);
    }

    log("🎉 Test complete! Ready to try recording.");
  };

  const startTestRecording = async () => {
    try {
      log("🎤 Starting test recording...");
      // Guard: ensure APIs exist (satisfies type-check + runtime)
      if (!("mediaDevices" in navigator) || !("getUserMedia" in navigator.mediaDevices) || !("MediaRecorder" in window)) {
        log("❌ Recording not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        log(`💾 Audio chunk: ${event.data.size} bytes`);
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        log("🛑 Recording stopped");
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          log(`🎵 Final audio blob: ${blob.size} bytes`);
        } else {
          log("❌ No audio data captured");
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(500); // gather data every 500ms
      setIsRecording(true);
      log("✅ Recording started");
    } catch (error) {
      log(`❌ Recording failed: ${String(error)}`);
    }
  };

  const stopTestRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      log("⏹️ Stopping recording...");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Mic className="text-blue-400" />
          Mobile Microphone Diagnostic
        </h2>

        <div className="space-y-4">
          <button
            onClick={runMicrophoneTest}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
          >
            Run Diagnostic Test
          </button>

          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopTestRecording : startTestRecording}
              className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isRecording ? (
                <>
                  <Square className="inline mr-2" size={16} />
                  Stop Test Recording
                </>
              ) : (
                <>
                  <Mic className="inline mr-2" size={16} />
                  Start Test Recording
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2">Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-400 text-sm">Click "Run Diagnostic Test" to begin</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result.includes("✅") ? (
                      <span className="text-green-400">{result}</span>
                    ) : result.includes("❌") ? (
                      <span className="text-red-400">{result}</span>
                    ) : result.includes("⚠️") ? (
                      <span className="text-yellow-400">{result}</span>
                    ) : (
                      <span className="text-gray-300">{result}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneTest;
