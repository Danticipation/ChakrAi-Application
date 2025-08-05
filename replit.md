# Chakrai - Mental Wellness & Therapy Application

## Overview
Chakrai is a professional mental wellness and therapy application designed for individuals seeking therapeutic support. It aims to provide comprehensive mental health support, leveraging AI for personalized insights and fostering self-reflection. Key capabilities include voice interaction, daily affirmations, therapeutic personality modes, wellness goal tracking, and advanced conversation continuity for cross-session therapeutic context preservation. The project's vision is to create a calming, thoughtful, and professional environment to empower users on their mental wellness journey.

## Recent Changes (August 2025)
- **Conversation Continuity Enhancer**: Implemented comprehensive cross-session context preservation system with conversation sessions, threads, and intelligent session-to-session continuity bridging
- **Database Enhancement**: Added conversation_sessions, conversation_threads, and session_continuity tables for sophisticated conversation tracking
- **Advanced Session Management**: Created ConversationContinuityManager service for intelligent context preservation, session analysis, and cross-session therapeutic continuity
- **UI Component**: Added ConversationContinuityDisplay component for visualizing conversation history, active threads, and cross-session context
- **Modular Route Architecture**: Successfully refactored monolithic 4125-line routes.ts into 9 focused modules (chat, user, mood, memory, content, analytics, admin, community, voice) for improved maintainability and scalability
- **Voice System Recovery**: Extracted and preserved ElevenLabs TTS integration, enhanced transcription with audio quality analysis, and text scrubbing utilities from legacy routes
- **Legacy Code Management**: Archived massive legacy routes.ts file as routes-legacy-4125-lines.ts while maintaining full backward compatibility through modular structure

## User Preferences
- **Persistent memory system**: Bot MUST have persistent memory to remember users across sessions and build personality profiles
- **Self-reflection through mirroring**: Core purpose is reflection of self through the bot's learned personality mirror
- **Original voice system**: Maintain only the 4 approved voices (James, Brian, Alexandra, Carla)
- **Voice functionality**: ElevenLabs voices must work properly - user extremely frustrated with voice system failures
- **CRITICAL STABILITY ISSUE**: User experiencing repeated app breakdowns and runtime errors - app stability is top priority
- **Critical priority**: Voice system and component errors causing significant user frustration - must maintain working state
- **Communication style**: Direct, technical communication preferred - user extremely frustrated with app instability
- **User expectation**: App should work consistently without breaking when attempting basic interactions like voice chat
- **VOICE SYSTEM FIXED**: Implemented Web Audio API-based recorder that creates proper WAV files - bypasses MediaRecorder WebM issues completely
- **Identity reflection**: Bot should reflect user's persona, identity, and mannerisms over time
- **Color scheme preference**: MUST maintain consistent blue therapeutic theme throughout - user strongly rejects colorful "rainbow" designs

## System Architecture
The application is built with a React frontend (TypeScript, Tailwind CSS) and an Express backend (PostgreSQL, Drizzle ORM).

**UI/UX Decisions:**
- Calming pastel color scheme: soft blue (#ADD8E6), pale green (#98FB98), gentle lavender (#E6E6FA), with a consistent blue therapeutic theme.
- Modular `Layout.tsx` for consistent component structure and error handling.
- Collapsible sidebar navigation for organized access to features.
- Professional, space-optimized layouts with touch-friendly interaction targets.
- Engaging UI elements include shimmering silver borders, glass morphism effects, neon cursor trails, and sparkling stars backgrounds.
- Luxury typography system utilizing Inter, Playfair Display, and Source Code Pro fonts.
- Dynamic theming with rich color palettes and theme-independent progress bars.
- Mobile-first design with responsive layouts, optimized touch targets, and enhanced scrolling.
- Accessible design with ARIA compliance, keyboard navigation, and screen reader support.

**Technical Implementations & Feature Specifications:**
- **Voice System:** Comprehensive voice interaction with ElevenLabs for synthesis and OpenAI Whisper for transcription, featuring manual recording control.
- **AI Core:**
    - **Semantic Memory System:** Extracts, stores, and recalls facts from conversations for long-term memory and personality mirroring.
    - **Personality Reflection:** AI-powered analysis of user data to provide insights into communication, emotional patterns, strengths, and growth opportunities.
    - **Adaptive Learning:** Analyzes conversation patterns and preferences to adapt responses, suggest mindfulness exercises, and provide wellness recommendations.
    - **Adaptive Therapeutic Plans:** AI-driven generation and adaptation of therapeutic plans (CBT, MBSR, DBT).
    - **Emotional Intelligence:** Real-time emotion detection, advanced mood tracking, predictive mood forecasting, and contextual response adaptation, including crisis detection.
    - **LLM Agent Integration:** Specialized therapeutic agents (e.g., CBT Coach, Mindfulness Guide) with intelligent handoff mechanisms.
- **Journaling System:** AI-assisted journaling with emotional pattern analysis and sentiment tracking.
- **Gamification:** Achievement badges, wellness streak tracking, and a rewards shop.
- **Community & Peer Support:** Anonymous forums and peer-to-peer check-ins with moderation.
- **Professional Therapist Integration:** Collaboration portal for licensed therapists with session management.
- **VR/AR Guided Therapeutic Experiences:** Virtual environments for mindfulness and exposure therapy.
- **Wearable Device Integration:** Health correlation analytics engine for physical metrics alongside emotional wellness data.
- **Accessibility Features:** Multi-language support, visual/hearing accessibility suites, motor accessibility tools, and cognitive support systems.
- **Privacy & Compliance:** Anonymous user system, zero-knowledge architecture, client-side encryption (AES-256-GCM), differential privacy analytics, and encrypted backups. Chakrai is positioned as a "Wellness Companion."
- **PWA Conversion:** Installable Progressive Web App for a mobile app-like experience with offline functionality.
- **Code Quality Overhaul:** Enterprise-grade security hardening, architectural refactoring (dedicated controllers, services layer), performance optimization (memory utilities, health checks), and code standardization (ESLint, Prettier, TypeScript strict mode).

## External Dependencies
- **ElevenLabs API:** For high-quality voice synthesis.
- **OpenAI API:** For GPT-4o powered chat responses, semantic memory extraction, personality analysis, adaptive learning, emotional intelligence, and crisis detection.
- **Supabase:** For community features (forums, posts, replies, peer check-ins).
- **PostgreSQL:** Primary database for core application functionality.
- **Stripe:** For subscription monetization and payment processing.
- **horoscope-app-api.vercel.app:** External API for daily horoscope data.
- **Radix UI:** For accessible UI components.