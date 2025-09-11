import { storage } from "./src/storage.js";
import { openai, retryOpenAIRequest } from "./openaiRetry.js";
import type { UserMemory, UserFact } from "../shared/schema.ts";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface PersonalityProfile {
  communicationStyle: string;
  emotionalPatterns: string[];
  interests: string[];
  values: string[];
  speechPatterns: string[];
  humor: string;
  problemSolvingStyle: string;
  relationshipStyle: string;
  coreTraits: string[];
  lifePhilosophy: string;
  stressResponses: string[];
  motivations: string[];
  fears: string[];
  aspirations: string[];
  uniqueMannerisms: string[];
}

export interface ConversationAnalysis {
  personalInfo: string[];
  emotionalTone: string;
  communicationPatterns: string[];
  interests: string[];
  values: string[];
  stressIndicators: string[];
  goals: string[];
  relationships: string[];
  workLife: string[];
  hobbies: string[];
  uniqueExpressions: string[];
}

export async function analyzeConversationForPersonality(
  message: string,
  previousMessages: string[],
  existingProfile?: PersonalityProfile
): Promise<ConversationAnalysis> {
  try {
    // Quick extraction for basic facts
    const personalInfo = extractBasicPersonalInfo(message);
    const emotionalTone = detectBasicEmotion(message);
    
    // Only call OpenAI for complex analysis if message is substantial
    if (message.length < 20) {
      return {
        personalInfo,
        emotionalTone,
        communicationPatterns: [],
        interests: [],
        values: [],
        stressIndicators: message.toLowerCase().includes('stress') || message.toLowerCase().includes('worried') ? ['stress indicators detected'] : [],
        goals: [],
        relationships: [],
        workLife: [],
        hobbies: [],
        uniqueExpressions: []
      };
    }

    const context = previousMessages.slice(-3).join('\n'); // Reduced context for speed
    
    const prompt = `Analyze this message for key personality insights. Be concise.

Context: ${context}
Message: ${message}

Extract in JSON format:
{
  "personalInfo": ["key personal facts"],
  "emotionalTone": "emotional state",
  "communicationPatterns": ["style observations"],
  "interests": ["interests mentioned"],
  "values": ["values expressed"],
  "stressIndicators": ["stress signs"],
  "goals": ["goals mentioned"],
  "relationships": ["relationship context"],
  "workLife": ["work context"],
  "hobbies": ["hobbies mentioned"],
  "uniqueExpressions": ["unique expressions"]
}`;

    const response = await retryOpenAIRequest(() => 
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Extract personality insights quickly and concisely."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 300
      })
    );

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Merge with basic analysis
    return {
      personalInfo: [...personalInfo, ...(result.personalInfo || [])],
      emotionalTone: result.emotionalTone || emotionalTone,
      communicationPatterns: result.communicationPatterns || [],
      interests: result.interests || [],
      values: result.values || [],
      stressIndicators: result.stressIndicators || [],
      goals: result.goals || [],
      relationships: result.relationships || [],
      workLife: result.workLife || [],
      hobbies: result.hobbies || [],
      uniqueExpressions: result.uniqueExpressions || []
    };
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    return {
      personalInfo: extractBasicPersonalInfo(message),
      emotionalTone: detectBasicEmotion(message),
      communicationPatterns: [],
      interests: [],
      values: [],
      stressIndicators: [],
      goals: [],
      relationships: [],
      workLife: [],
      hobbies: [],
      uniqueExpressions: []
    };
  }
}

function extractBasicPersonalInfo(message: string): string[] {
  const info: string[] = [];
  
  // Name extraction
  const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([a-zA-Z]+)/i);
  if (nameMatch) info.push(`Name: ${nameMatch[1]}`);
  
  // Job extraction
  const jobMatch = message.match(/(?:work as|job as|i'm a|i am a)\s+([\w\s]+?)(?:\.|,|$)/i);
  if (jobMatch?.[1]) info.push(`Occupation: ${jobMatch[1].trim()}`);
  
  return info;
}

function detectBasicEmotion(message: string): string {
  const stressWords = ['stress', 'worried', 'anxious', 'overwhelmed'];
  const happyWords = ['happy', 'excited', 'great', 'awesome', 'love'];
  const sadWords = ['sad', 'down', 'depressed', 'upset'];
  
  const lowerMessage = message.toLowerCase();
  
  if (stressWords.some(word => lowerMessage.includes(word))) return 'stressed';
  if (happyWords.some(word => lowerMessage.includes(word))) return 'positive';
  if (sadWords.some(word => lowerMessage.includes(word))) return 'sad';
  
  return 'neutral';
}

export async function buildPersonalityProfile(userId: number): Promise<PersonalityProfile> {
  try {
    const memories = await storage.getUserMemories(userId);
    const facts = await storage.getUserFacts(userId);
    
    const memoryText = memories.map((m: UserMemory) => m.memory).join('\n');
    const factText = facts.map((f: UserFact) => f.fact).join('\n');
    
    const prompt = `
Based on this comprehensive user data, create a detailed personality profile that captures their essence, communication style, and core identity:

User Memories:
${memoryText}

User Facts:
${factText}

Create a personality profile that would allow an AI to mirror this person's communication style, emotional patterns, and worldview. Be specific about:

1. How they communicate (formal/casual, direct/indirect, emotional/logical)
2. Their emotional patterns and typical responses
3. Their interests and what excites them
4. Their core values and beliefs
5. Their unique speech patterns and expressions
6. Their sense of humor style
7. How they approach problems
8. Their relationship and social style
9. Their core personality traits
10. Their life philosophy and worldview
11. How they handle stress
12. What motivates them
13. Their fears and concerns
14. Their aspirations and dreams
15. Their unique mannerisms and quirks

Respond with JSON in this exact format:
{
  "communicationStyle": "detailed description",
  "emotionalPatterns": ["pattern1", "pattern2"],
  "interests": ["interest1", "interest2"],
  "values": ["value1", "value2"],
  "speechPatterns": ["pattern1", "pattern2"],
  "humor": "humor style description",
  "problemSolvingStyle": "approach to problems",
  "relationshipStyle": "social and relationship approach",
  "coreTraits": ["trait1", "trait2"],
  "lifePhilosophy": "worldview and philosophy",
  "stressResponses": ["response1", "response2"],
  "motivations": ["motivation1", "motivation2"],
  "fears": ["fear1", "fear2"],
  "aspirations": ["aspiration1", "aspiration2"],
  "uniqueMannerisms": ["mannerism1", "mannerism2"]
}
`;

    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert personality psychologist. Create detailed personality profiles that capture the essence of a person's communication style and identity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      })
    );

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Error building personality profile:", error);
    return {
      communicationStyle: "Friendly and conversational",
      emotionalPatterns: ["Balanced emotional responses"],
      interests: ["General conversation"],
      values: ["Authenticity", "Growth"],
      speechPatterns: ["Natural flow"],
      humor: "Light and situational",
      problemSolvingStyle: "Analytical and thoughtful",
      relationshipStyle: "Open and supportive",
      coreTraits: ["Curious", "Empathetic"],
      lifePhilosophy: "Growth through experience",
      stressResponses: ["Seeks support"],
      motivations: ["Personal development"],
      fears: ["Being misunderstood"],
      aspirations: ["Self-improvement"],
      uniqueMannerisms: ["Thoughtful pauses"]
    };
  }
}

export async function generateMirroredResponse(
  message: string,
  personalityProfile: PersonalityProfile,
  conversationHistory: string[],
  personalityMode: string
): Promise<string> {
  try {
    const recentHistory = conversationHistory.slice(-6).join('\n');
    
    const prompt = `
You are responding as an AI that has learned to mirror the user's personality and communication style. Use this personality profile to respond in a way that reflects their own patterns back to them:

PERSONALITY PROFILE:
- Communication Style: ${personalityProfile.communicationStyle}
- Speech Patterns: ${personalityProfile.speechPatterns.join(', ')}
- Humor Style: ${personalityProfile.humor}
- Core Traits: ${personalityProfile.coreTraits.join(', ')}
- Values: ${personalityProfile.values.join(', ')}
- Unique Mannerisms: ${personalityProfile.uniqueMannerisms.join(', ')}
- Problem Solving: ${personalityProfile.problemSolvingStyle}
- Life Philosophy: ${personalityProfile.lifePhilosophy}

Recent conversation context:
${recentHistory}

Current personality mode: ${personalityMode}

User message: ${message}

Respond as if you are reflecting their own personality back to them. Use their communication style, incorporate their values, mirror their speech patterns, and respond in a way that feels like talking to themselves. Be authentic to their personality while being supportive and insightful.

Keep the response conversational and natural, as if it's coming from someone who truly understands them.
`;

    const response = await retryOpenAIRequest(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI companion that mirrors the user's personality and communication style back to them, creating a reflective conversation experience."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    );

    return response.choices[0]?.message?.content || "I understand what you're saying, and I can see how that reflects who you are.";
  } catch (error) {
    console.error("Error generating mirrored response:", error);
    return "I hear you, and I can sense the depth of what you're sharing.";
  }
}