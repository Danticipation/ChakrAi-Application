-- HIPAA-compliant identity tables
CREATE TABLE IF NOT EXISTS installs (
  adid TEXT PRIMARY KEY,
  did_hash TEXT NOT NULL,
  platform TEXT NOT NULL,
  attested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid UUID PRIMARY KEY,
  adid TEXT NOT NULL REFERENCES installs(adid),
  uid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_devices (
  uid TEXT NOT NULL,
  adid TEXT NOT NULL REFERENCES installs(adid),
  udid TEXT NOT NULL UNIQUE,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (uid, adid)
);

CREATE TABLE IF NOT EXISTS agent_memory_facts (
  uid TEXT NOT NULL,
  fact_id TEXT NOT NULL,
  type TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (uid, fact_id)
);

CREATE TABLE IF NOT EXISTS agent_memory_summaries (
  uid TEXT NOT NULL,
  period TEXT NOT NULL,
  version TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (uid, period, version)
);

-- Unique constraint to prevent multiple users per device
CREATE UNIQUE INDEX IF NOT EXISTS user_devices_adid_unique ON user_devices(adid);
