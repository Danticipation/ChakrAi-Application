// TypeScript declarations for semanticMemory.js
declare module './semanticMemory.js' {
  export interface SemanticMemory {
    id: number;
    content: string;
    temporalContext?: string;
    emotionalContext?: string;
  }

  export interface SemanticContext {
    relevantMemories: SemanticMemory[];
    connectedMemories: SemanticMemory[];
    searchContext: any;
  }

  export function getSemanticContext(userId: number, currentMessage: string): Promise<SemanticContext>;
  export function analyzeConversationForMemory(userId: number, userMessage: string, botResponse: string): Promise<SemanticMemory | null>;
  export function generateMemoryInsights(userId: number): Promise<any[]>;
  export function getMemoryDashboard(userId: number): Promise<any>;
  export function generateContextualReferences(userId: number, currentMessage: string, semanticContext: SemanticContext): Promise<any>;
}