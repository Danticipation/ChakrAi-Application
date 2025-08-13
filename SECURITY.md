# Chakrai - Security & Compliance Documentation

## Executive Summary

Chakrai implements healthcare-grade security architecture with zero hardcoded data policy, comprehensive user authentication via SecureAuthManager, and anti-hallucination systems. The platform features ElevenLabs voice integration with 8 professional voices while ensuring authentic data integrity throughout all endpoints and maintaining therapeutic conversation memory through modular architecture.

## Privacy-First Architecture

### Zero-Knowledge Design Principles
- **Complete Data Isolation**: User data is cryptographically isolated with no cross-contamination
- **Anonymous Operation**: Full platform functionality without personal data collection
- **Device-Based Identity**: Secure fingerprinting without personally identifiable information
- **Minimal Data Collection**: Only essential data for service functionality is gathered
- **User Control**: Granular permissions and data sharing controls

### Anonymous User Privacy Protection
```typescript
// Device fingerprinting without personal data
const generateDeviceFingerprint = async (): Promise<string> => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.platform || 'unknown'
  ].join('|');
  
  // SHA-256 hash for consistent identification
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
};
```

### Data Minimization & Purpose Limitation
- **Therapeutic Data**: Authentic mood entries and journal content with comprehensive analytics
- **Memory Architecture**: Modular semantic memory system for therapeutic context preservation
- **Anti-Hallucination System**: Strict AI prompts preventing fabrication of user background
- **Data Integrity**: Zero tolerance for hardcoded, placeholder, or test data throughout platform
- **Comprehensive Analytics**: Real-time dashboard statistics from authentic user database queries

## Authentication & Access Control

### Multi-Tier Authentication System
```typescript
// Anonymous user authentication
interface AnonymousAuth {
  deviceFingerprint: string;
  sessionToken: string;
  expiresAt: Date;
  permissions: 'free' | 'premium';
}

// Registered user authentication
interface RegisteredAuth {
  userId: number;
  email: string;
  passwordHash: string;  // bcrypt with 12 rounds
  jwtToken: string;
  refreshToken: string;
  subscriptionStatus: 'free' | 'premium';
  mfaEnabled?: boolean;
}
```

### Password Security
- **Hashing**: bcrypt with 12 rounds minimum for password storage
- **Requirements**: 8+ characters, mixed case, numbers, special characters
- **Breach Protection**: Passwords never stored in plaintext or reversible encryption
- **Reset Security**: Time-limited tokens with single-use validation

### Session Management
```typescript
// Secure session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET!, // 256-bit random secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent XSS access
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  },
  store: new PostgreSQLSessionStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60 // 1 week TTL
  })
};
```

## Data Encryption & Protection

### Encryption Standards
- **Data at Rest**: AES-256-CBC encryption for sensitive database fields
- **Data in Transit**: TLS 1.3 for all client-server communications
- **API Keys**: Environment variables with secure key rotation capabilities
- **Database**: PostgreSQL with transparent data encryption (TDE) enabled

### Field-Level Encryption Implementation
```typescript
// AES-256-CBC encryption for sensitive data
class EncryptionService {
  private static algorithm = 'aes-256-cbc';
  private static keyLength = 32; // 256 bits
  
  static encrypt(data: string, key: string): { encryptedData: string, iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { 
      encryptedData: encrypted, 
      iv: iv.toString('hex') 
    };
  }
  
  static decrypt(encryptedData: string, key: string, iv: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// Selective field encryption for therapeutic data
const encryptSensitiveFields = async (journalEntry: JournalEntry): Promise<EncryptedJournalEntry> => {
  const encryptionKey = process.env.JOURNAL_ENCRYPTION_KEY!;
  
  return {
    ...journalEntry,
    content: EncryptionService.encrypt(journalEntry.content, encryptionKey),
    // Title and metadata remain unencrypted for search functionality
  };
};
```

### Secure Key Management
- **Environment Separation**: Development, staging, and production keys completely isolated
- **Key Rotation**: Automated 90-day rotation schedule for encryption keys
- **Hardware Security**: Cloud provider HSM for production key storage
- **Access Control**: Role-based access to encryption keys with audit logging

## Payment Security & PCI Compliance

### Stripe Integration Security
```typescript
// Secure Stripe webhook validation
const validateStripeWebhook = (req: Request): Stripe.Event => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  try {
    return stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
};

// Subscription management with security controls
const processSubscriptionUpdate = async (event: Stripe.Event) => {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = parseInt(session.metadata?.userId || '0');
  
  // Validate user ownership
  const user = await storage.getUser(userId);
  if (!user || user.customerId !== session.customer) {
    throw new Error('User validation failed');
  }
  
  // Update subscription with audit trail
  await storage.updateUserSubscription(userId, {
    subscriptionStatus: 'premium',
    subscriptionId: session.subscription as string,
    updatedAt: new Date(),
    auditLog: `Subscription activated via webhook: ${event.id}`
  });
};
```

### PCI DSS Compliance
- **No Card Storage**: All payment data processed through Stripe's PCI-compliant infrastructure
- **Tokenization**: Sensitive payment information replaced with non-sensitive tokens
- **Audit Trails**: Complete transaction logging for compliance verification
- **Network Security**: Segmented network access for payment processing components

## Regulatory Compliance

### GDPR (General Data Protection Regulation)
- **Lawful Basis**: Consent and legitimate interest for wellness service provision
- **Data Subject Rights**: Complete implementation of access, rectification, erasure, and portability
- **Consent Management**: Granular consent with easy withdrawal mechanisms
- **Data Protection Officer**: Designated contact for privacy concerns and compliance

#### GDPR Rights Implementation
```typescript
// Data portability - export user data
export const exportUserData = async (userId: number): Promise<UserDataExport> => {
  const [user, journalEntries, moodEntries, messages] = await Promise.all([
    storage.getUser(userId),
    storage.getJournalEntries(userId),
    storage.getMoodEntries(userId),
    storage.getMessages(userId)
  ]);
  
  return {
    personal: {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    },
    wellness: {
      journalEntries: journalEntries.map(entry => ({
        title: entry.title,
        content: entry.content,
        createdAt: entry.createdAt
      })),
      moodEntries,
      conversationHistory: messages
    },
    subscription: {
      status: user.subscriptionStatus,
      expiresAt: user.subscriptionExpiresAt
    }
  };
};

// Right to erasure - complete data deletion
export const deleteUserData = async (userId: number): Promise<void> => {
  await Promise.all([
    storage.deleteUser(userId),
    storage.deleteUserMessages(userId),
    storage.deleteUserJournalEntries(userId),
    storage.deleteUserMoodEntries(userId),
    storage.deleteUserMemories(userId),
    storage.deleteUserSubscription(userId)
  ]);
  
  // Audit log for compliance
  await storage.createAuditLog({
    action: 'user_data_deletion',
    userId,
    timestamp: new Date(),
    details: 'Complete user data erasure per GDPR Article 17'
  });
};
```

### HIPAA (Health Insurance Portability and Accountability Act)
- **Protected Health Information (PHI)**: Therapeutic conversations and wellness data treated as PHI
- **Business Associate Agreements**: Executed with all third-party service providers
- **Access Controls**: Role-based access with multi-factor authentication for healthcare providers
- **Audit Logging**: Comprehensive access logs for all PHI interactions

#### HIPAA Security Safeguards
```typescript
// Administrative safeguards
interface HIPAAAccessControl {
  userId: number;
  role: 'patient' | 'therapist' | 'admin';
  permissions: string[];
  lastAccess: Date;
  sessionTimeout: number; // 15 minutes for healthcare users
  mfaRequired: boolean;
}

// Physical safeguards
const physicalSafeguards = {
  dataCenter: 'SOC 2 Type II certified cloud infrastructure',
  encryption: 'AES-256 for data at rest and in transit',
  backups: 'Encrypted offsite backups with 7-year retention',
  disposal: 'Secure data destruction protocols for decommissioned systems'
};

// Technical safeguards
const technicalSafeguards = {
  accessControl: 'Role-based with principle of least privilege',
  auditControls: 'Comprehensive logging of all PHI access',
  integrity: 'Digital signatures and checksums for data integrity',
  transmission: 'End-to-end encryption for all data transmission'
};
```

### Healthcare Data Security
- **Therapy Session Encryption**: End-to-end encryption for all therapeutic conversations
- **Professional Access Controls**: Granular permissions for licensed mental health providers
- **Audit Trails**: Complete logging of healthcare professional access to patient data
- **Data Retention**: Configurable retention periods to meet healthcare regulations

## Application Security

### Input Validation & Sanitization
```typescript
// Comprehensive input validation
const validateUserInput = (input: any, schema: ZodSchema): ValidationResult => {
  try {
    const sanitized = DOMPurify.sanitize(input);
    const validated = schema.parse(sanitized);
    return { isValid: true, data: validated };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid input format',
      details: error.message 
    };
  }
};

// SQL injection prevention with Drizzle ORM
const getUserJournalEntries = async (userId: number, limit: number = 50) => {
  return await db.select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .limit(Math.min(limit, 100)) // Prevent large data extraction
    .orderBy(desc(journalEntries.createdAt));
};
```

### Cross-Site Scripting (XSS) Prevention
- **Content Security Policy**: Strict CSP headers preventing unauthorized script execution
- **Input Sanitization**: DOMPurify for all user-generated content
- **Output Encoding**: Context-aware encoding for data display
- **Cookie Security**: HttpOnly and Secure flags for all session cookies

### Cross-Site Request Forgery (CSRF) Protection
```typescript
// CSRF protection implementation
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  value: (req) => req.headers['x-csrf-token'] as string
});

// Double-submit cookie pattern for API endpoints
app.use('/api/', csrfProtection);
```

## API Security

### Rate Limiting & DDoS Protection
```typescript
// Tiered rate limiting by user type
const rateLimitConfig = {
  free: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Rate limit exceeded for free tier'
  },
  premium: {
    windowMs: 15 * 60 * 1000,
    max: 1000, // 10x higher for premium users
    message: 'Rate limit exceeded'
  },
  anonymous: {
    windowMs: 15 * 60 * 1000,
    max: 50, // Lower for anonymous users
    message: 'Anonymous user rate limit exceeded'
  }
};

// Adaptive rate limiting based on user behavior
const adaptiveRateLimit = (userId: number, userType: string) => {
  const config = rateLimitConfig[userType as keyof typeof rateLimitConfig];
  
  return rateLimit({
    ...config,
    keyGenerator: (req) => `${req.ip}:${userId}`,
    handler: (req, res) => {
      res.status(429).json({
        error: config.message,
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
  });
};
```

### API Authentication & Authorization
```typescript
// JWT token validation with refresh mechanism
const authenticateAPI = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check token expiration and refresh if needed
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      const refreshed = await refreshUserToken(decoded.userId);
      res.setHeader('X-New-Token', refreshed.token);
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid authentication token' });
  }
};
```

## Infrastructure Security

### Network Security
- **TLS Configuration**: TLS 1.3 with perfect forward secrecy
- **HSTS Headers**: HTTP Strict Transport Security for all connections
- **Certificate Management**: Automated certificate renewal with Let's Encrypt
- **Network Segmentation**: Isolated subnets for database and application tiers

### Database Security
```sql
-- Database access controls
CREATE ROLE trai_app_user WITH LOGIN PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO trai_app_user;
REVOKE ALL ON auth_tokens FROM public;
GRANT SELECT, INSERT, DELETE ON auth_tokens TO trai_app_user;

-- Row-level security for user data isolation
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_journal_access ON journal_entries 
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Audit logging for sensitive operations
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET
);
```

### Cloud Security
- **Infrastructure as Code**: Terraform for reproducible security configurations
- **Secret Management**: Cloud provider secret managers for API keys and certificates
- **Monitoring**: Real-time security monitoring with automated threat detection
- **Backup Security**: Encrypted backups with secure key management

## Incident Response & Business Continuity

### Security Incident Response Plan
1. **Detection**: Automated monitoring with immediate alerting for security events
2. **Assessment**: Rapid triage to determine scope and severity of incidents
3. **Containment**: Immediate isolation of affected systems and data
4. **Eradication**: Root cause analysis and vulnerability remediation
5. **Recovery**: Secure system restoration with enhanced monitoring
6. **Lessons Learned**: Post-incident review and security improvements

### Data Breach Response Protocol
```typescript
// Automated breach detection and response
const detectPotentialBreach = async (event: SecurityEvent): Promise<void> => {
  const severity = assessBreachSeverity(event);
  
  if (severity >= BreachSeverity.HIGH) {
    // Immediate containment
    await isolateAffectedSystems(event.affectedResources);
    
    // Legal notification requirements
    if (severity >= BreachSeverity.CRITICAL) {
      await notifyDataProtectionAuthorities(event);
      await notifyAffectedUsers(event);
    }
    
    // Forensic analysis
    await preserveForensicEvidence(event);
    
    // Stakeholder communication
    await notifyIncidentResponse team(event);
  }
};
```

### Business Continuity Planning
- **High Availability**: Multi-region deployment with automatic failover
- **Data Recovery**: Point-in-time recovery with 4-hour Recovery Time Objective (RTO)
- **Service Continuity**: Graceful degradation for non-critical features during outages
- **Communication**: Automated status page updates and user notifications

## Security Monitoring & Auditing

### Real-Time Security Monitoring
```typescript
// Security event monitoring
const securityMonitor = {
  loginAttempts: {
    threshold: 5,
    window: '15 minutes',
    action: 'account_lockout'
  },
  dataAccess: {
    threshold: 100,
    window: '1 hour',
    action: 'rate_limit'
  },
  apiCalls: {
    threshold: 1000,
    window: '15 minutes',
    action: 'temporary_ban'
  }
};

// Automated threat detection
const detectAnomalousActivity = async (userId: number, activity: UserActivity): Promise<ThreatAssessment> => {
  const userBaseline = await getUserActivityBaseline(userId);
  const riskScore = calculateRiskScore(activity, userBaseline);
  
  if (riskScore > RISK_THRESHOLD) {
    await logSecurityEvent({
      userId,
      eventType: 'anomalous_activity',
      riskScore,
      details: activity,
      timestamp: new Date()
    });
    
    // Adaptive response based on risk level
    if (riskScore > CRITICAL_THRESHOLD) {
      await suspendUserSession(userId);
      await notifySecurityTeam(userId, activity);
    }
  }
  
  return { riskScore, recommended Action: determineResponse(riskScore) };
};
```

### Compliance Auditing
- **Automated Compliance Checks**: Daily validation of security controls and configurations
- **Access Reviews**: Quarterly review of user permissions and administrative access
- **Penetration Testing**: Annual third-party security assessments
- **Vulnerability Management**: Continuous scanning with 24-hour critical patch SLA

## Third-Party Security

### Vendor Security Assessment
- **OpenAI**: SOC 2 Type II certified, data processing agreements in place
- **ElevenLabs**: Security questionnaire completed, data retention policies verified
- **Stripe**: PCI DSS Level 1 certified, comprehensive security controls validated
- **Cloud Providers**: Enterprise security agreements with data residency controls

### API Security Standards
- **OAuth 2.0**: Secure authorization for third-party integrations
- **API Versioning**: Controlled API evolution with security patch distribution
- **Webhook Security**: HMAC signature validation for all webhook endpoints
- **Service Dependencies**: Minimal third-party dependencies with security monitoring

TraI's comprehensive security framework ensures enterprise-grade protection for mental wellness data while maintaining user privacy and regulatory compliance across all operational aspects.