# Chakrai - Technical Documentation

## Architecture Overview

Chakrai is a comprehensive mental wellness platform built with modern web technologies, featuring local Piper TTS integration, AI-powered therapeutic support with modular memory architecture, and privacy-first design. The platform delivers healthcare-grade data integrity with zero hardcoded data and comprehensive analytics.

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with luxury design system and glass morphism effects
- **State Management**: TanStack Query for server state, React Context for local state
- **Authentication**: JWT tokens with device fingerprinting for anonymous users
- **Payments**: Stripe React components with subscription management
- **Progressive Web App**: Service worker with offline capabilities and installable features

#### Backend
- **Runtime**: Node.js with Express.js and TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Authentication**: JWT tokens with session management and device fingerprinting
- **Payments**: Stripe webhooks and subscription lifecycle management
- **AI Integration**: OpenAI GPT-4o for chat, Local Piper TTS (Amy voice), OpenAI Whisper STT
- **Memory Architecture**: Modular memory system with SemanticMemoryService, ConversationContinuityService, MemoryConnectionService, MemoryRetrievalService, MemoryAnalyticsService
- **Security**: AES-256 encryption, healthcare-grade data integrity, anti-hallucination system

#### Infrastructure
- **Development**: Vite dev server with MIME type resolution and HMR
- **Database**: PostgreSQL with Drizzle ORM and authentic data enforcement
- **Memory Architecture**: Comprehensive modular memory system for therapeutic context
- **Voice System**: Local Piper TTS server for cost-effective voice synthesis
- **Monitoring**: Healthcare-grade security auditing and comprehensive logging

## Database Schema

### Core User Management
```typescript
// User accounts with anonymous and registered support
users: {
  id: number (primary key)
  username: string
  email: string | null
  passwordHash: string | null
  deviceFingerprint: string | null
  isAnonymous: boolean
  subscriptionStatus: 'free' | 'premium'
  subscriptionId: string | null
  subscriptionExpiresAt: date | null
  customerId: string | null (Stripe customer ID)
  monthlyUsage: number
  lastUsageReset: date
  createdAt: date
  updatedAt: date
}

// Authentication tokens for session management
authTokens: {
  id: number (primary key)
  userId: number (foreign key)
  token: string
  expiresAt: date
  deviceInfo: string | null
  createdAt: date
}
```

### Subscription & Payment Management
```typescript
// Stripe subscription tracking
subscriptions: {
  id: number (primary key)
  userId: number (foreign key)
  stripeSubscriptionId: string
  stripePriceId: string
  status: string
  currentPeriodStart: date
  currentPeriodEnd: date
  cancelAtPeriodEnd: boolean
  createdAt: date
  updatedAt: date
}

// Usage tracking for freemium model
usageMetrics: {
  id: number (primary key)
  userId: number (foreign key)
  feature: string
  count: number
  month: number
  year: number
  createdAt: date
}
```

### Mental Wellness Data
```typescript
// Mood tracking with emotional analysis
moodEntries: {
  id: number (primary key)
  userId: number (foreign key)
  mood: string
  intensity: number
  emotion: string | null
  tags: string[]
  notes: text | null
  timestamp: date
  createdAt: date
}

// Therapeutic journaling with AI analysis
journalEntries: {
  id: number (primary key)
  userId: number (foreign key)
  title: string
  content: text
  mood: string | null
  tags: string[]
  isPrivate: boolean
  moodIntensity: number | null
  createdAt: date
  updatedAt: date
}

// AI conversation history
messages: {
  id: number (primary key)
  userId: number (foreign key)
  content: text
  role: 'user' | 'assistant'
  timestamp: date
  emotionalContext: jsonb | null
  responseType: string | null
}
```

### AI & Analytics
```typescript
// Semantic memory for AI personality development
semanticMemories: {
  id: number (primary key)
  userId: number (foreign key)
  content: text
  embedding: vector
  memoryType: string
  emotionalContext: jsonb
  temporalContext: jsonb
  accessCount: number
  lastAccessed: date
  createdAt: date
}

// Emotional intelligence analytics
emotionalPatterns: {
  id: number (primary key)
  userId: number (foreign key)
  patternType: string
  confidence: number
  triggerFactors: string[]
  recommendations: string[]
  detectedAt: date
  validUntil: date | null
}

// Predictive mood forecasting
moodForecasts: {
  id: number (primary key)
  userId: number (foreign key)
  predictedMood: string
  confidenceScore: number
  riskLevel: string
  triggerFactors: string[]
  preventiveRecommendations: string[]
  forecastDate: date
  createdAt: date
}
```

## API Reference

### Authentication Endpoints

#### Anonymous User Management
```typescript
POST /api/users/anonymous
// Creates or retrieves anonymous user by device fingerprint
Body: { deviceFingerprint: string }
Response: { user: User, isNew: boolean }

POST /api/auth/register
// Converts anonymous user to registered account
Body: { email: string, password: string, deviceFingerprint?: string }
Response: { user: User, token: string }

POST /api/auth/login
// Authenticates registered user
Body: { email: string, password: string }
Response: { user: User, token: string }
```

### Subscription Management

#### Subscription Status & Usage
```typescript
GET /api/subscription/status
// Returns current subscription status and usage
Headers: Authorization: Bearer <token>
Response: {
  status: 'free' | 'premium',
  expiresAt: date | null,
  monthlyUsage: number,
  lastUsageReset: date
}

POST /api/subscription/usage
// Increments usage counter for feature tracking
Headers: Authorization: Bearer <token>
Body: { increment?: number }
Response: { monthlyUsage: number }
```

#### Payment Processing
```typescript
POST /api/subscription/create-checkout
// Creates Stripe checkout session
Headers: Authorization: Bearer <token>
Body: { planType: 'monthly' | 'yearly', deviceFingerprint?: string }
Response: { sessionId: string }

POST /api/subscription/webhook
// Stripe webhook handler for subscription events
Headers: stripe-signature: <signature>
Body: Stripe webhook payload (raw)
Response: { received: boolean }
```

### AI & Wellness Features

#### Conversation Management
```typescript
POST /api/chat
// AI conversation with personality mirroring
Headers: Authorization: Bearer <token>
Body: { message: string, selectedVoice?: string }
Response: { 
  reply: string, 
  audioData?: string,
  emotionalState?: object,
  usageCount: number 
}

POST /api/voice/tts
// Text-to-speech conversion
Headers: Authorization: Bearer <token>
Body: { text: string, voice: string }
Response: { audioData: string }
```

#### Wellness Tracking
```typescript
POST /api/mood-entries
// Create mood entry with analysis
Headers: Authorization: Bearer <token>
Body: { mood: string, intensity: number, notes?: string, tags?: string[] }
Response: { entry: MoodEntry, analysis?: object }

GET /api/mood-entries
// Retrieve mood history
Headers: Authorization: Bearer <token>
Query: { limit?: number, offset?: number }
Response: { entries: MoodEntry[], total: number }

POST /api/journal-entries
// Create journal entry with AI analysis
Headers: Authorization: Bearer <token>
Body: { title: string, content: string, isPrivate?: boolean }
Response: { entry: JournalEntry, insights?: object }
```

#### Analytics & Insights
```typescript
GET /api/analytics/dashboard
// Comprehensive wellness analytics
Headers: Authorization: Bearer <token>
Response: {
  overview: object,
  charts: object,
  insights: string,
  trends: object[]
}

GET /api/personality-reflection
// AI personality analysis
Headers: Authorization: Bearer <token>
Response: {
  traits: string[],
  strengths: string[],
  growthAreas: string[],
  communicationStyle: string
}
```

## Development Setup

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL 14+ database
- OpenAI API key for AI features
- Stripe account for payment processing
- ElevenLabs API key for voice features (optional)

### Environment Configuration
```bash
# Core Services
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@localhost:5432/trai
SESSION_SECRET=your-session-secret

# Subscription System
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# Local Voice System - Piper TTS
# Run Piper server locally: python speak_server.py
# No external API keys required

# Development Settings
NODE_ENV=development
```

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd trai-mental-wellness
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb trai_development
   
   # Run migrations
   npm run db:push
   ```

3. **Stripe Configuration**
   ```bash
   # Create products and prices in Stripe Dashboard
   # Update environment variables with price IDs
   # Configure webhook endpoint: /api/subscription/webhook
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Build & Deployment

#### Production Build
```bash
npm run build
npm run start
```

#### Database Migrations
```bash
# Push schema changes
npm run db:push

# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

## Voice System Integration

### Local Piper TTS Configuration
```typescript
// Local Piper TTS Configuration using Amy voice model
const PIPER_VOICE_CONFIG = {
  'Amy': 'amy',  // Cost-effective local voice synthesis
  model: 'en_US-amy-medium',
  sampleRate: 22050,
  bitRate: 16
};

// Audio generation with local Piper TTS server
async function generateSpeech(text: string): Promise<string> {
  const response = await fetch('/api/voice/piper-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: scrubTextForTTS(text), voice: 'amy' })
  });
  
  const { audioData } = await response.json();
  return audioData; // WAV audio file for local processing
}

// Web Audio API recorder (bypasses MediaRecorder WebM issues)
async function createAudioRecorder(): Promise<MediaRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext({ sampleRate: 16000 });
  const source = context.createMediaStreamSource(stream);
  
  // Creates proper WAV files for processing
  return new MediaRecorder(stream, {
    mimeType: 'audio/wav'
  });
}
```

### Speech-to-Text Integration
```typescript
// OpenAI Whisper for voice journaling
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  
  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    body: formData
  });
  
  const { transcript } = await response.json();
  return transcript;
}
```

## Security Implementation

### Authentication & Authorization
```typescript
// JWT token verification middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Anonymous user session management
export const getOrCreateAnonymousUser = async (deviceFingerprint: string): Promise<User> => {
  let user = await storage.getUserByDeviceFingerprint(deviceFingerprint);
  
  if (!user) {
    user = await storage.createUser({
      username: `anon_${deviceFingerprint.slice(0, 8)}`,
      deviceFingerprint,
      isAnonymous: true,
      subscriptionStatus: 'free'
    });
  }
  
  return user;
};
```

### Data Encryption & Privacy
```typescript
// AES-256 encryption for sensitive data
const encrypt = (text: string, key: string): { encryptedData: string, iv: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encryptedData: encrypted, iv: iv.toString('hex') };
};

const decrypt = (encryptedData: string, key: string, iv: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

## Performance Optimization

### Database Query Optimization
- Use Drizzle ORM with type-safe queries and automatic query optimization
- Implement connection pooling for PostgreSQL database connections
- Add database indexes for frequently queried fields (userId, timestamp, deviceFingerprint)
- Use pagination for large data sets and implement efficient offset/limit queries

### Frontend Performance
- Implement React.memo for expensive components to prevent unnecessary re-renders
- Use TanStack Query for efficient server state management with automatic caching
- Lazy load components and routes to reduce initial bundle size
- Optimize images and assets with appropriate compression and formats

### AI Service Integration
- Implement request batching for OpenAI API calls to reduce latency
- Add response caching for repeated queries to minimize API usage costs
- Use streaming responses for long-form AI content generation
- Implement fallback strategies for service unavailability

## Monitoring & Analytics

### Application Monitoring
```typescript
// Error tracking and performance monitoring
const logError = (error: Error, context: object) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context
  });
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Implementation for error tracking service
  }
};

// Performance metrics tracking
const trackPerformance = (operation: string, duration: number, metadata?: object) => {
  console.log({
    timestamp: new Date().toISOString(),
    operation,
    duration,
    metadata
  });
};
```

### User Analytics
- Track feature usage patterns for subscription optimization
- Monitor conversion rates from free to premium subscriptions
- Analyze user engagement patterns and retention metrics
- Implement privacy-compliant analytics with user consent management

## Testing Strategy

### Unit Testing
```typescript
// Example test for subscription management
describe('Subscription Management', () => {
  it('should track usage correctly for free users', async () => {
    const user = await createTestUser({ subscriptionStatus: 'free' });
    
    // Simulate AI conversation usage
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ message: 'Hello' });
    
    expect(response.status).toBe(200);
    expect(response.body.usageCount).toBe(1);
  });
  
  it('should block free users after usage limit', async () => {
    const user = await createTestUser({ 
      subscriptionStatus: 'free',
      monthlyUsage: 10 // At limit
    });
    
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ message: 'Hello' });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('usage limit');
  });
});
```

### Integration Testing
- Test complete user journeys from registration to subscription
- Verify Stripe webhook handling and subscription lifecycle events
- Test anonymous user to registered user migration flows
- Validate AI service integrations with mock responses

### End-to-End Testing
- Test complete subscription purchase flows in staging environment
- Verify mobile PWA functionality across different devices
- Test voice features with actual ElevenLabs integration
- Validate crisis detection and intervention workflows

## Deployment & DevOps

### Environment Management
- Use environment-specific configuration files for different deployment stages
- Implement secure secret management for API keys and sensitive configuration
- Set up automated database migrations and schema validation
- Configure monitoring and alerting for production environments

### Scaling Considerations
- Implement horizontal scaling for Express.js backend with load balancing
- Use connection pooling and read replicas for database scaling
- Implement caching strategies for frequently accessed data
- Design API rate limiting to handle traffic spikes and abuse prevention

TraI's technical architecture provides a solid foundation for scalable, secure mental wellness platform with comprehensive subscription management and AI-powered therapeutic features.