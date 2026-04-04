import { Ollama } from 'ollama';

// Initialize Ollama client for local development
const ollama = new Ollama({
  host: process.env['OLLAMA_HOST'] || 'http://localhost:11434'
});

export interface OllamaResponse {
  message: {
    content: string;
    role: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Check if Ollama is available for development mode
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const models = await ollama.list();
    return models.models && models.models.length > 0;
  } catch (error: any) {
    console.log('Ollama not available:', error?.message);
    return false;
  }
}

// Get available models from Ollama
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await ollama.list();
    return response.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    return [];
  }
}

// Generate chat response using Ollama
export async function generateOllamaResponse(
  messages: OllamaMessage[],
  model: string = 'llama3:8b'
): Promise<string> {
  try {
    console.log(`🦙 Generating Ollama response with model: ${model}`);
    
    const response = await ollama.chat({
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 150
      }
    });

    if (response?.message?.content) {
      console.log('✅ Ollama response generated successfully');
      return response.message.content.trim();
    } else {
      throw new Error('Invalid response format from Ollama');
    }
  } catch (error) {
    console.error('❌ Ollama generation error:', error);
    throw error;
  }
}

// Analyze journal entry using Ollama
export async function analyzeJournalWithOllama(
  content: string,
  title: string,
  mood: string,
  previousEntries: string[] = []
): Promise<any> {
  try {
    console.log('🦙 Starting Ollama journal analysis');
    
    const contextInfo = previousEntries.length > 0 
      ? `\n\nPrevious entries context: ${previousEntries.slice(0, 3).join(' ')}`
      : '';

    const analysisPrompt = `Analyze this journal entry for therapeutic insights. Respond with valid JSON only.

Journal Entry:
Title: "${title}"
Content: "${content}"
Current Mood: ${mood}${contextInfo}

Provide analysis in this exact JSON format:
{
  "sentimentScore": number between -1.0 and 1.0,
  "emotionalIntensity": number between 0 and 100,
  "keyInsights": array of 2-4 specific insights about the person's situation,
  "emotionDistribution": object with emotion names as keys and counts as values,
  "riskLevel": "low", "medium", or "high",
  "recommendedActions": array of 2-4 specific therapeutic suggestions,
  "themes": array of 2-4 main themes from the content,
  "confidenceScore": number between 0.0 and 1.0
}

Focus on what the person is actually dealing with, not generic wellness advice.`;

    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content: 'You are a therapeutic AI assistant specializing in journal analysis. Provide specific, contextual insights about what the person is actually experiencing. Respond with valid JSON only.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ];

    const response = await ollama.chat({
      model: process.env['OLLAMA_MODEL'] || 'llama3.1',
      messages,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.8,
        num_predict: 500
      }
    });

    if (response?.message?.content) {
      try {
        const analysis = JSON.parse(response.message.content);
        console.log('✅ Ollama journal analysis completed');
        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse Ollama JSON response:', parseError);
        // Return fallback structure
        return {
          sentimentScore: 0,
          emotionalIntensity: 50,
          keyInsights: ['Analysis completed with local AI'],
          emotionDistribution: { neutral: 1 },
          riskLevel: 'low',
          recommendedActions: ['Continue journaling regularly'],
          themes: ['self-reflection'],
          confidenceScore: 0.7
        };
      }
    } else {
      throw new Error('No content received from Ollama');
    }
  } catch (error) {
    console.error('❌ Ollama journal analysis error:', error);
    throw error;
  }
}

// Generate semantic memory analysis using Ollama
export async function generateSemanticMemoryWithOllama(
  userMessage: string,
  botReply: string
): Promise<string[]> {
  try {
    console.log('🦙 Extracting semantic memories with Ollama');
    
    const memoryPrompt = `Extract key facts and insights from this conversation that should be remembered for future interactions. Focus on personal details, preferences, experiences, and emotional states.

User said: "${userMessage}"
Bot replied: "${botReply}"

Extract 1-3 memorable facts in this format:
["fact 1", "fact 2", "fact 3"]

Only include facts that are:
- Specific to this user
- Worth remembering for future conversations
- Not generic or obvious

Respond with valid JSON array only.`;

    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content: 'You extract key facts from conversations for building user memory profiles. Focus on personal details, preferences, and specific situations. Respond with JSON array only.'
      },
      {
        role: 'user',
        content: memoryPrompt
      }
    ];

    const response = await ollama.chat({
      model: process.env['OLLAMA_MODEL'] || 'llama3.1',
      messages,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        num_predict: 100
      }
    });

    if (response?.message?.content) {
      try {
        const memories = JSON.parse(response.message.content);
        console.log('✅ Ollama semantic memories extracted:', memories.length);
        return Array.isArray(memories) ? memories : [];
      } catch (parseError) {
        console.error('❌ Failed to parse Ollama memories:', parseError);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Ollama semantic memory error:', error);
    return [];
  }
}

// Health check for Ollama service
export async function checkOllamaHealth(): Promise<{ status: string; models?: string[]; error?: string }> {
  try {
    const models = await getAvailableModels();
    return {
      status: 'healthy',
      models
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error?.message || 'Unknown error'
    };
  }
}