# Chakrai - Mental Wellness & Therapy Application

## Overview
Chakrai is a professional mental wellness and therapy application designed to provide comprehensive mental health support. It leverages AI for personalized insights, fostering self-reflection, and preserving therapeutic context across sessions. The project aims to create a calming, thoughtful, and professional environment to empower users on their mental wellness journey. Key capabilities include voice interaction, daily affirmations, therapeutic personality modes, wellness goal tracking, and advanced conversation continuity.

## User Preferences
- NO FAKE DATA EVER: Absolutely no mock, placeholder, or hardcoded fake information in this medical application - deployment ready system requires authentic data only
- Persistent memory system: Bot MUST have persistent memory to remember users across sessions and build personality profiles
- Self-reflection through mirroring: Core purpose is reflection of self through the bot's learned personality mirror
- Original voice system: Maintain only the 4 approved voices (James, Brian, Alexandra, Carla)
- Voice functionality: ElevenLabs voices must work properly - user extremely frustrated with voice system failures
- CRITICAL STABILITY ISSUE: User experiencing repeated app breakdowns and runtime errors - app stability is top priority
- Critical priority: Voice system and component errors causing significant user frustration - must maintain working state
- Communication style: Direct, technical communication preferred - user extremely frustrated with app instability
- User expectation: App should work consistently without breaking when attempting basic interactions like voice chat
- Cost consideration: Using local Piper TTS instead of ElevenLabs to avoid $350 subscription costs - user will run Piper server locally
- VOICE SYSTEM FIXED: Implemented Web Audio API-based recorder that creates proper WAV files - bypasses MediaRecorder WebM issues completely
- PERSONALITY REFLECTION RESTORED: Reverted to working static analysis system that was functional 12 hours ago - provides comprehensive psychological insights without AI dependency
- DELETE FUNCTIONALITY IMPLEMENTED: Added working red trash icon delete buttons directly to journal entry cards with confirmation dialogs - bypasses edit mode completely (August 13, 2025)
- INTERFACE TRANSFORMATION COMPLETE: Replaced bland interface with visually engaging dashboard and redesigned meditation component with animations, gradients, and interactive elements (August 13, 2025)
- MODULAR MEMORY ARCHITECTURE IMPLEMENTED: Built comprehensive modular memory system with SemanticMemoryService, ConversationContinuityService, MemoryConnectionService, MemoryRetrievalService, and MemoryAnalyticsService for robust therapeutic conversation memory (August 13, 2025)
- Identity reflection: Bot should reflect user's persona, identity, and mannerisms over time
- Color scheme preference: MUST maintain consistent blue therapeutic theme throughout - user strongly rejects colorful "rainbow" designs

## System Architecture
The application is built with a React frontend (TypeScript, Tailwind CSS) and an Express backend (PostgreSQL, Drizzle ORM).

**Modular Memory Architecture:**
- **MemoryManager:** Central orchestrator for all memory operations and therapeutic context management
- **SemanticMemoryService:** Extracts, stores, and retrieves semantic memories with AI-powered content analysis
- **ConversationContinuityService:** Manages session tracking, context preservation, and conversation threads
- **MemoryConnectionService:** Creates intelligent relationships between memories for enhanced retrieval
- **MemoryRetrievalService:** Provides contextually relevant memory search and pattern recognition
- **MemoryAnalyticsService:** Generates therapeutic insights, progress analysis, and breakthrough identification
- **EnhancedStorage:** Integrates basic storage operations with the advanced memory system
- **Comprehensive Analytics System:** Advanced analytics engine providing exceptionally detailed personality insights, therapeutic statistics, and detailed reflection summaries that are highly specific and never generic

**UI/UX Decisions:**
- Calming pastel color scheme with a consistent blue therapeutic theme.
- Modular `Layout.tsx` for consistent component structure and error handling.
- Collapsible sidebar navigation.
- Professional, space-optimized layouts with touch-friendly interaction targets.
- Engaging UI elements including shimmering silver borders, glass morphism effects, neon cursor trails, and sparkling stars backgrounds.
- Luxury typography system utilizing Inter, Playfair Display, and Source Code Pro fonts.
- Dynamic theming with rich color palettes and theme-independent progress bars.
- Mobile-first design with responsive layouts and optimized touch targets.
- Accessible design with ARIA compliance, keyboard navigation, and screen reader support.

**Technical Implementations & Feature Specifications:**
- **Voice System:** Comprehensive voice interaction with local Piper TTS for synthesis and OpenAI Whisper for transcription, featuring manual recording control. Uses Amy voice model locally to avoid subscription costs.
- **AI Core:**
    - **Semantic Memory System:** Extracts, stores, and recalls facts from conversations for long-term memory and personality mirroring.
    - **Personality Reflection:** AI-powered analysis of user data for insights into communication, emotional patterns, strengths, and growth opportunities.
    - **Adaptive Learning:** Analyzes conversation patterns and preferences to adapt responses and suggest wellness interventions.
    - **Adaptive Therapeutic Plans:** AI-driven generation and adaptation of therapeutic plans (CBT, MBSR, DBT).
    - **Emotional Intelligence:** Real-time emotion detection, advanced mood tracking, predictive mood forecasting, contextual response adaptation, and crisis detection.
    - **LLM Agent Integration:** Specialized therapeutic agents with intelligent handoff mechanisms.
- **Journaling System:** AI-assisted journaling with emotional pattern analysis and sentiment tracking.
- **Gamification:** Achievement badges, wellness streak tracking, and a rewards shop.
- **Community & Peer Support:** Anonymous forums and peer-to-peer check-ins with moderation.
- **Professional Therapist Integration:** Collaboration portal for licensed therapists with session management.
- **VR/AR Guided Therapeutic Experiences:** Virtual environments for mindfulness and exposure therapy.
- **Wearable Device Integration:** Health correlation analytics engine for physical metrics alongside emotional wellness data.
- **Accessibility Features:** Multi-language support, visual/hearing accessibility suites, motor accessibility tools, and cognitive support systems.
- **Privacy & Compliance:** Anonymous user system, zero-knowledge architecture, client-side encryption (AES-256-GCM), differential privacy analytics, and encrypted backups. Chakrai is positioned as a "Wellness Companion."
- **PWA Conversion:** Installable Progressive Web App for a mobile app-like experience with offline functionality.
- **Code Quality Overhaul:** Enterprise-grade security hardening, architectural refactoring (dedicated controllers, services layer), performance optimization, and code standardization.

## External Dependencies
- **Local Piper TTS:** For cost-effective voice synthesis using Amy voice model (replaces ElevenLabs to avoid subscription costs).
- **OpenAI API:** For GPT-4o powered chat responses, semantic memory extraction, personality analysis, adaptive learning, emotional intelligence, and crisis detection.
- **Supabase:** For community features (forums, posts, replies, peer check-ins).
- **PostgreSQL:** Primary database for core application functionality.
- **Stripe:** For subscription monetization and payment processing.
- **horoscope-app-api.vercel.app:** External API for daily horoscope data.
- **Radix UI:** For accessible UI components.