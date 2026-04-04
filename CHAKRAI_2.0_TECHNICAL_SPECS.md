# CHAKRAI 2.0: TECHNICAL SPECIFICATIONS
## Database Schema & API Documentation

**Version**: 1.0  
**Date**: January 19, 2025  

---

## DATABASE SCHEMA EXTENSIONS

### Biometric Engine Tables

```sql
-- Biometric device management
CREATE TABLE biometric_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  device_type TEXT NOT NULL, -- 'apple_watch', 'fitbit', 'oura', 'garmin'
  device_id TEXT NOT NULL,
  device_name TEXT,
  connection_status TEXT DEFAULT 'active',
  data_types TEXT[], -- ['heart_rate', 'hrv', 'sleep', 'activity']
  sync_frequency INTEGER DEFAULT 300,
  last_sync_at TIMESTAMP,
  auth_token TEXT, -- encrypted
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Time-series biometric readings
CREATE TABLE biometric_readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  device_id INTEGER NOT NULL REFERENCES biometric_devices(id),
  data_type TEXT NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL,
  quality DECIMAL(3,2) DEFAULT 1.0,
  confidence DECIMAL(3,2) DEFAULT 0.9,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Health predictions
CREATE TABLE health_predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  prediction_type TEXT NOT NULL, -- 'stress_episode', 'mood_decline'
  predicted_value DECIMAL(5,2),
  confidence DECIMAL(3,2) NOT NULL,
  timeframe TEXT NOT NULL, -- '15min', '1hour', '24hours'
  prediction_time TIMESTAMP NOT NULL,
  target_time TIMESTAMP NOT NULL,
  trigger_factors TEXT[],
  preventive_actions TEXT[],
  actual_outcome DECIMAL(5,2),
  accuracy DECIMAL(3,2),
  intervention_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Group Therapy Tables

```sql
-- Therapy groups
CREATE TABLE therapy_groups (
  id SERIAL PRIMARY KEY,
  group_key TEXT NOT NULL UNIQUE,
  session_type TEXT NOT NULL,
  max_participants INTEGER DEFAULT 6,
  current_participants INTEGER DEFAULT 0,
  compatibility_score DECIMAL(3,2),
  facilitation_style TEXT DEFAULT 'adaptive',
  status TEXT DEFAULT 'forming',
  therapeutic_goals TEXT[],
  session_plan JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group participants
CREATE TABLE group_participants (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES therapy_groups(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  anonymous_id TEXT NOT NULL,
  participation_style TEXT DEFAULT 'active',
  compatibility_score DECIMAL(3,2),
  therapeutic_goals TEXT[],
  current_mood TEXT,
  engagement_level DECIMAL(3,2) DEFAULT 0.5,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Group messages
CREATE TABLE group_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES therapy_groups(id),
  participant_id INTEGER NOT NULL REFERENCES group_participants(id),
  message_type TEXT NOT NULL, -- 'text', 'voice', 'reaction'
  content TEXT,
  sentiment DECIMAL(3,2), -- -1 to 1
  emotional_intensity INTEGER, -- 1-10
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Predictive Analytics Tables

```sql
-- Mental health assessments
CREATE TABLE mental_health_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  assessment_type TEXT NOT NULL,
  risk_level TEXT NOT NULL, -- 'low', 'moderate', 'high', 'critical'
  overall_risk_score DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  timeframe TEXT NOT NULL,
  primary_risk_factors TEXT[],
  protective_factors TEXT[],
  professional_escalation BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Voice health analysis
CREATE TABLE voice_health_analysis (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  assessment_id INTEGER REFERENCES mental_health_assessments(id),
  depression_score DECIMAL(3,2),
  anxiety_score DECIMAL(3,2),
  overall_mental_state_score DECIMAL(3,2),
  confidence DECIMAL(3,2),
  analysis_features JSONB NOT NULL,
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Content Generation Tables

```sql
-- Therapeutic content
CREATE TABLE therapeutic_content (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content_type TEXT NOT NULL, -- 'meditation', 'worksheet', 'story'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  personalizations JSONB,
  target_conditions TEXT[],
  therapeutic_goals TEXT[],
  difficulty_level INTEGER DEFAULT 1,
  estimated_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content usage tracking
CREATE TABLE content_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  content_id INTEGER NOT NULL REFERENCES therapeutic_content(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  completion_rate DECIMAL(3,2),
  user_rating INTEGER, -- 1-5
  effectiveness DECIMAL(3,2),
  mood_before TEXT,
  mood_after TEXT
);
```

---

## API ENDPOINTS

### Biometric APIs

```typescript
// Device Management
POST   /api/v2/biometric/devices
GET    /api/v2/biometric/devices
PUT    /api/v2/biometric/devices/:id
DELETE /api/v2/biometric/devices/:id

// Data Ingestion
POST   /api/v2/biometric/readings
GET    /api/v2/biometric/readings
GET    /api/v2/biometric/analysis
GET    /api/v2/biometric/predictions

// Interventions
GET    /api/v2/biometric/interventions
POST   /api/v2/biometric/interventions/respond
```

### Group Therapy APIs

```typescript
// Group Management
POST   /api/v2/therapy/groups/find-match
GET    /api/v2/therapy/groups
POST   /api/v2/therapy/groups/:id/join
PUT    /api/v2/therapy/groups/:id/leave

// Communication
POST   /api/v2/therapy/groups/:id/messages
GET    /api/v2/therapy/groups/:id/messages
GET    /api/v2/therapy/groups/:id/sentiment
```

### Predictive Analytics APIs

```typescript
// Risk Assessment
POST   /api/v2/prediction/assess
GET    /api/v2/prediction/assessments
GET    /api/v2/prediction/current-risk

// Pattern Analysis
GET    /api/v2/prediction/patterns
POST   /api/v2/prediction/voice-analysis
GET    /api/v2/prediction/correlations
```

### Content Generation APIs

```typescript
// Content Creation
POST   /api/v2/content/generate/meditation
POST   /api/v2/content/generate/worksheet
POST   /api/v2/content/generate/story

// Content Management
GET    /api/v2/content/library
PUT    /api/v2/content/:id/rating
POST   /api/v2/content/:id/feedback
```

---

## WEBSOCKET EVENTS

### Client-to-Server Events

```typescript
interface BiometricDataEvent {
  type: 'biometric_reading';
  data: {
    deviceType: string;
    dataType: string;
    value: number;
    timestamp: string;
  };
}

interface GroupMessageEvent {
  type: 'group_message';
  groupId: string;
  message: string;
  messageType: 'text' | 'voice';
}
```

### Server-to-Client Events

```typescript
interface StressPredictionEvent {
  type: 'stress_prediction';
  prediction: {
    level: number;
    confidence: number;
    timeToOnset: number;
    recommendations: string[];
  };
}

interface InterventionTriggerEvent {
  type: 'intervention_trigger';
  intervention: {
    type: string;
    content: string;
    urgency: 'low' | 'medium' | 'high';
  };
}
```

---

## PERFORMANCE REQUIREMENTS

### Scalability Targets
- **Biometric Ingestion**: 10,000 readings/second per server
- **Group Therapy**: 1,000 concurrent groups per server  
- **Prediction Engine**: 85%+ accuracy, sub-5s analysis
- **Content Generation**: sub-30s for complex content

### Database Optimization
```sql
-- Performance indexes
CREATE INDEX idx_biometric_readings_user_timestamp 
ON biometric_readings(user_id, timestamp DESC);

CREATE INDEX idx_group_messages_group_timestamp
ON group_messages(group_id, timestamp DESC);

CREATE INDEX idx_assessments_user_risk
ON mental_health_assessments(user_id, risk_level, created_at DESC);