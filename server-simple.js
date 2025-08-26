import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple routes for the dashboard
app.get('/api/users/anonymous', (req, res) => {
  res.json({
    id: 1,
    userId: 1,
    username: 'anonymous_user',
    isAnonymous: true,
    createdAt: new Date().toISOString()
  });
});

app.post('/api/users/anonymous', (req, res) => {
  res.json({
    id: 1,
    userId: 1,
    username: 'anonymous_user',
    isAnonymous: true,
    createdAt: new Date().toISOString()
  });
});

app.post('/api/create-new-user', (req, res) => {
  res.json({
    success: true,
    userId: 1,
    message: 'User authenticated successfully',
    isAnonymous: true
  });
});

app.get('/api/users/:userId', (req, res) => {
  res.json({
    id: parseInt(req.params.userId),
    userId: parseInt(req.params.userId),
    username: 'user_' + req.params.userId,
    isAnonymous: true,
    createdAt: new Date().toISOString()
  });
});

app.get('/api/recent-entries', (req, res) => {
  res.json({
    journalEntries: [
      { id: 1, content: "Today I felt grateful for small moments", createdAt: new Date().toISOString() }
    ],
    moodEntries: [
      { id: 1, mood: "content", value: 7, createdAt: new Date().toISOString() }
    ]
  });
});

app.get('/api/dashboard-data', (req, res) => {
  res.json({
    overview: {
      currentWellnessScore: 75,
      emotionalVolatility: 20,
      therapeuticEngagement: 85,
      totalJournalEntries: 12,
      totalMoodEntries: 8,
      averageMood: 7.5
    },
    charts: {
      moodTrend: [{ date: '2025-01-01', value: 7, emotion: 'content' }],
      wellnessTrend: [{ date: '2025-01-01', value: 70 }]
    }
  });
});

app.get('/api/streak-stats', (req, res) => {
  res.json({ currentStreak: 7, longestStreak: 15 });
});

app.get('/api/weekly-summary', (req, res) => {
  res.json({ summary: 'Great progress this week!' });
});

app.get('/api/dashboard-stats', (req, res) => {
  res.json({
    currentStreak: 7,
    aiConversations: 25,
    journalEntries: 12,
    mindfulMinutes: 150,
    totalConversations: 25,
    totalJournalEntries: 12,
    totalMindfulMinutes: 150,
    weeklyGoals: {
      journalEntries: { current: 3, target: 5 },
      meditation: { current: 15, target: 20 },
      aiSessions: { current: 8, target: 10 },
      moodCheckins: { current: 4, target: 7 }
    },
    wellnessScore: 85,
    goalCompletion: 75,
    recentChange: {
      streak: 1,
      conversations: 3,
      journalEntries: 2,
      mindfulMinutes: 15
    }
  });
});

app.get('/api/daily-affirmation', (req, res) => {
  const affirmations = [
    "You are capable of amazing things. Trust in your journey.",
    "Every step forward is progress, no matter how small.",
    "Your mental wellness matters. Take time for yourself today.",
    "You have the strength to overcome any challenge.",
    "Today is a new opportunity to grow and thrive."
  ];
  
  const today = new Date().getDate();
  const affirmation = affirmations[today % affirmations.length];
  
  res.json({ affirmation, text: affirmation });
});

app.get('/api/mood/today', (req, res) => {
  res.json({
    hasMoodToday: false,
    message: 'No mood logged today yet',
    suggestedMood: 'How are you feeling today?'
  });
});

app.get('/api/personality-insights', (req, res) => {
  res.json({
    psychologicalDimensions: {
      introspectionLevel: "Developing - beginning introspective journey",
      emotionalAwareness: "Emerging - building emotional vocabulary",
      therapeuticReceptivity: "Open - ready for therapeutic engagement",
      growthOrientation: "High - proactive approach to mental wellness"
    },
    uniqueCharacteristics: ["Beginning therapeutic journey with openness to self-discovery"],
    therapeuticPotential: "High potential for meaningful therapeutic progress"
  });
});

app.post('/api/transcribe', (req, res) => {
  res.json({ 
    success: false, 
    message: 'Voice transcription temporarily unavailable. Please type your message.' 
  });
});

app.get('/api/journal/entries', (req, res) => {
  res.json({
    entries: [
      { id: 1, content: "Today was a good day", createdAt: new Date().toISOString() }
    ]
  });
});

app.post('/api/chat', (req, res) => {
  res.json({
    response: "I'm here to listen and support you. What's on your mind today?",
    timestamp: new Date().toISOString()
  });
});

// Serve static files from the built client dist directory
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CHAKRAI SERVER RUNNING!`);
  console.log(`📍 Server accessible at http://localhost:${PORT}`);
  console.log(`🌟 Ready to see the REVOLUTIONARY dashboard!`);
});
