/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_API_URL?: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_ELEVENLABS_API_KEY?: string
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}