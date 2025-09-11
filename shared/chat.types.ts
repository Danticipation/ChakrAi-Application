// Types shared by client & server (NO Node APIs)
export type ChatRequest = { message: string; model?: string };
export type ChatResponse = {
  message: string;
  response: string;
  stage: string;
  timestamp: string;
  memoryStatus: 'BULLETPROOF_ACTIVE' | 'FALLBACK_MODE';
  messagesSaved: number;
  conversationHistory: number;
  userMessageId?: number;
  aiMessageId?: number;
};
