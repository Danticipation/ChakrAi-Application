# Chakrai - Mental Wellness & Therapy Application

## Overview
Chakrai is a professional mental wellness and therapy application designed for individuals seeking therapeutic support. It features a calming, thoughtful design with soothing pastel colors to create a welcoming, professional environment. Key capabilities include voice interaction, daily affirmations, therapeutic personality modes, and wellness goal tracking. The project aims to provide comprehensive mental health support, leveraging AI for personalized insights and fostering self-reflection.

## User Preferences
- **Persistent memory system**: Bot MUST have persistent memory to remember users across sessions and build personality profiles
- **Self-reflection through mirroring**: Core purpose is reflection of self through the bot's learned personality mirror
- **Original voice system**: Maintain only the 4 approved voices (James, Brian, Alexandra, Carla)
- **Voice functionality**: ElevenLabs voices must work properly - user extremely frustrated with voice system failures
- **Critical priority**: Voice system is causing significant user frustration and must be resolved immediately
- **Communication style**: Direct, technical communication preferred
- **Identity reflection**: Bot should reflect user's persona, identity, and mannerisms over time
- **Color scheme preference**: MUST maintain consistent blue therapeutic theme throughout - user strongly rejects colorful "rainbow" designs

## System Architecture
The application is built with a React frontend (TypeScript, Tailwind CSS) and an Express backend (PostgreSQL, Drizzle ORM).

**UI/UX Decisions:**
- Calming pastel color scheme: soft blue (#ADD8E6), pale green (#98FB98), gentle lavender (#E6E6FA).
- Consistent blue therapeutic theme for visual cohesion.
- Modular `Layout.tsx` for component structure and error boundaries.
- Collapsible sidebar navigation with 6 intuitive sections for organized access.
- Professional, space-optimized layouts with touch-friendly interaction targets.
- Engaging UI with shimmering silver borders, glass morphism effects, and subtle animations (e.g., neon cursor trail, sparkling stars background).
- Luxury typography system with Inter and Playfair Display fonts for a refined look, and Source Code Pro for character clarity.
- Dynamic theming system with rich color palettes and theme-independent progress bars.
- Mobile-first design with responsive layouts, optimized touch targets, and enhanced scrolling.
- Accessible design with ARIA compliance, keyboard navigation, and screen reader support.

**Technical Implementations & Feature Specifications:**
- **Voice System:** Comprehensive voice interaction with ElevenLabs for high-quality voice synthesis (8 voices: James, Brian, Alexandra, Carla, Hope, Bronson, Marcus, Charlotte) and OpenAI Whisper for transcription. Includes voice loading indicators and manual control for recording.
- **AI Core:**
    - **Semantic Memory System:** Extracts, stores, and recalls important facts from conversations for long-term memory and personality mirroring. Supports contextual recall and dynamic integration into AI responses.
    - **Personality Reflection:** AI-powered analysis of journal entries and mood patterns to provide personalized insights into communication style, emotional patterns, strengths, and growth opportunities.
    - **Adaptive Learning:** Analyzes conversation patterns and user preferences to adapt responses, suggest mindfulness exercises, and provide dynamic wellness recommendations.
    - **Adaptive Therapeutic Plans:** AI-driven generation and adaptation of therapeutic plans (CBT, MBSR, DBT) based on real-time analytics and user progress.
    - **Emotional Intelligence:** Real-time emotion detection, advanced mood tracking, predictive mood forecasting, and contextual response adaptation based on user emotional states. Includes crisis detection and response.
    - **LLM Agent Integration:** Specialized therapeutic agents (CBT Coach, Mindfulness Guide, Self-Compassion Coach, Anxiety Specialist) with intelligent handoff mechanisms.
    - **AI Performance Monitoring:** Internal dashboard to track AI response quality, therapeutic effectiveness, and crisis detection accuracy.
- **Journaling System:** AI-assisted journaling with emotional pattern analysis, sentiment tracking, and exportable professional reports.
- **Gamification:** Achievement badge system, wellness streak tracking, activity tracking, and a rewards shop for positive reinforcement.
- **Community & Peer Support:** Anonymous support forums and peer-to-peer check-ins with moderation.
- **Professional Therapist Integration:** Collaboration portal for licensed therapists with session management and automated insight sharing.
- **VR/AR Guided Therapeutic Experiences:** Virtual environments for mindfulness, relaxation, and exposure therapy with session tracking and progress analysis.
- **Wearable Device Integration:** Health correlation analytics engine for physical health metrics (heart rate, sleep, steps) alongside emotional wellness data.
- **Accessibility Features:** Multi-language support, visual and hearing accessibility suites, motor accessibility tools, and cognitive support systems.
- **Privacy & Compliance:** Complete anonymous user system using device fingerprinting, zero-knowledge architecture, client-side AES-256-GCM encryption, differential privacy analytics, and encrypted backups. Eliminates all "Therapist" claims, positioning Chakrai as a "Wellness Companion."
- **PWA Conversion:** Installable Progressive Web App (PWA) for mobile app-like experience with offline functionality and optimized icons.

## External Dependencies
- **ElevenLabs API:** For high-quality voice synthesis.
- **OpenAI API:** For GPT-4o powered chat responses, semantic memory extraction, personality analysis, adaptive learning, emotional intelligence, and crisis detection.
- **Supabase:** Used specifically for community features (forums, posts, replies, peer check-ins) for real-time capabilities and anonymous posting.
- **PostgreSQL:** Primary database for core application functionality.
- **Stripe:** For subscription monetization and payment processing.
- **horoscope-app-api.vercel.app:** External API for daily horoscope data.
- **Radix UI:** For accessible UI components (select, slider).