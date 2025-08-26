import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Essential API endpoints only
app.get('/api/dashboard-stats', (req, res) => {
  res.json({
    currentStreak: 7,
    aiConversations: 25,
    journalEntries: 12,
    mindfulMinutes: 150
  });
});

app.get('/api/daily-affirmation', (req, res) => {
  res.json({ 
    affirmation: "You are capable of amazing things. Trust in your journey." 
  });
});

app.post('/api/chat', (req, res) => {
  res.json({
    response: "I'm here to listen and support you. What's on your mind?"
  });
});

// Serve built frontend
app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 CHAKRAI SERVER RUNNING on http://localhost:${PORT}`);
});
