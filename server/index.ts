import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { hipaaAuthMiddleware } from "./auth/hipaaAuth.js";

// ---- Routes (keep only what you truly have) ----
// @ts-ignore
import journalRoutes from "./routes/journal.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.ts";
// @ts-ignore
import userRoutes from "./routes/user.js";
// @ts-ignore
import subscriptionRoutes from "./routes/subscription.js";
// @ts-ignore
import moodRoutes from "./routes/mood.js";
// @ts-ignore
import analyticsRoutes from "./routes/analytics.js";
// @ts-ignore
import textToSpeechRoutes from "./routes/textToSpeech.js";
// @ts-ignore
import ambientSoundsRoutes from "./routes/ambientSounds.js";

// ---- Setup ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET ?? "dev_secret"));

// ---- Public / API routes ----
app.use("/api/auth", authRoutes);

// Voice transcription (standalone; uses Node’s built-in fetch/FormData/Blob)
app.post("/api/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "Voice transcription temporarily unavailable" });
    }

    const formData = new FormData();
    // req.file.buffer is a Buffer, which is a subclass of Uint8Array.
    // To create a Blob, we can use the underlying ArrayBuffer.
    // req.file.buffer is a Node.js Buffer. To ensure compatibility with Blob,
    // we create a new Uint8Array from its contents.
    const audioBlob = new Blob([Buffer.from(req.file.buffer)], { type: req.file.mimetype });
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", response.status, text);
      return res.status(response.status).json({ error: `Transcription failed: ${response.status}` });
    }

    const result = (await response.json()) as { text?: string };
    return res.json({ text: result.text ?? "", success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Transcription error:", msg);
    return res.status(500).json({ error: "Transcription failed", details: msg });
  }
});

// ---- HIPAA Authentication Middleware ----
// CRITICAL: This must be enabled for production HIPAA compliance
app.use(hipaaAuthMiddleware);

app.use("/api/journal", journalRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/tts", textToSpeechRoutes);
app.use("/api/ambient-sounds", ambientSoundsRoutes);
app.use("/api", subscriptionRoutes);

// Health should be defined BEFORE the SPA wildcard
app.get("/healthz", (_req: Request, res: Response) => res.json({ ok: true }));

// ---- Serve client only in production ----
if (process.env.NODE_ENV === "production") {
  // Matches your Vite outDir: root/dist/public
  const staticDir = path.join(__dirname, "../dist/public");
  app.use(express.static(staticDir));

  // SPA fallback to built index.html
  app.get("*", (req: Request, res: Response) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/identity/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    return res.sendFile(path.join(staticDir, "index.html"));
  });
}

// ---- Error handler ----
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error("Server error:", e.message);
  res.status(500).json({ error: e.message });
});

// ---- Start server ----
const PORT = parseInt(process.env.PORT || "5001", 10); // Changed port to 5001
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CHAKRAI SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📍 Server accessible at http://localhost:${PORT}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
