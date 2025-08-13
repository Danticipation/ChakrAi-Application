# Chakrai - Mental Wellness & Therapy Application

Chakrai is a comprehensive AI-powered mental wellness companion featuring local Piper TTS integration, modular memory architecture for therapeutic continuity, and healthcare-grade data integrity with zero hardcoded data throughout the platform.

## Features Overview

### Core Functionality
- **AI Conversations**: OpenAI GPT-4o with anti-hallucination system and therapeutic context memory
- **Local Voice System**: Piper TTS (Amy voice) running locally to avoid subscription costs
- **Modular Memory Architecture**: Comprehensive memory services for therapeutic continuity
- **Authentic Analytics**: Real-time dashboard statistics calculated from actual database queries
- **Enhanced Journal Interface**: Redesigned with engaging visuals and mood selection
- **Data Integrity**: Zero hardcoded data - all functionality driven by authentic database content

### Premium Features (Subscription Required)
- **Unlimited AI Conversations**: Remove 10/month limit for free users
- **Advanced Analytics**: Detailed emotional patterns and longitudinal trends
- **Voice Features**: Full voice synthesis and speech-to-text capabilities
- **Export Capabilities**: PDF/CSV reports for healthcare providers
- **Personality Insights**: Deep AI analysis of communication patterns and growth areas

### Advanced Capabilities
- **Progressive Web App**: Installable mobile app with offline functionality
- **Anonymous Privacy**: Device fingerprint-based identification, no personal data required
- **Professional Integration**: EHR systems, insurance compatibility, therapist portal
- **Multi-Device Sync**: Seamless experience across all devices
- **6 Luxury Themes**: Sophisticated color schemes with glass morphism effects
- **Memory System**: AI maintains contextual personality insights across sessions

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite with Tailwind CSS luxury design system
- **Backend**: Express.js + TypeScript with comprehensive API endpoints
- **Database**: PostgreSQL with Drizzle ORM and complete schema management
- **Payments**: Stripe integration with subscription management and webhooks
- **AI Services**: OpenAI GPT-4o with anti-hallucination system, Local Piper TTS (Amy voice), Whisper STT
- **Authentication**: SecureAuthManager for consistent user identification across all endpoints
- **Memory System**: Modular memory architecture with 5 specialized services for therapeutic continuity
- **Data Integrity**: Zero hardcoded data with authentic analytics from database queries

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   # Required Core Services
   OPENAI_API_KEY=your_openai_key
   DATABASE_URL=your_postgresql_url
   
   # Subscription System (Required for Premium Features)
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Local Voice System
   # Piper TTS runs locally - no external API key needed
   ```

3. **Initialize Database**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000` to access Chakrai Mental Wellness Companion.

## Monetization Model

### Free Tier
- 10 AI conversations per month
- Basic mood tracking and journaling
- Community support access
- Standard analytics

### Premium Tier ($9.99/month)
- Unlimited AI conversations
- Advanced emotional intelligence features
- Voice synthesis and speech-to-text
- Professional exports and EHR integration
- Deep personality insights and analytics

## Documentation Suite

- **[PRODUCT_FEATURES.md](PRODUCT_FEATURES.md)**: Complete feature specifications and capabilities
- **[TECH_DOCS.md](TECH_DOCS.md)**: Development guides, API reference, and architecture
- **[SECURITY.md](SECURITY.md)**: Privacy compliance, security measures, and data protection
- **[RECENT_UPDATES.md](RECENT_UPDATES.md)**: Latest system improvements and achievements

## Privacy & Compliance

Chakrai implements zero-knowledge architecture with complete user data isolation. Anonymous users can access all features through device fingerprinting, with seamless migration to registered accounts. Full GDPR/HIPAA compliance with enterprise-grade security measures.

## Support & Professional Integration

Compatible with healthcare systems through FHIR standards, insurance reporting, and professional therapist portal. Comprehensive crisis detection with immediate intervention resources and professional escalation pathways.

## License

Proprietary mental wellness platform with enterprise licensing available.