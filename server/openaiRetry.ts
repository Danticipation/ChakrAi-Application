import dotenv from 'dotenv';
dotenv.config();

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export async function retryOpenAIRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a network error that should be retried
      const shouldRetry = 
        error.code === 'EAI_AGAIN' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNRESET' ||
        error.message?.includes('fetch failed') ||
        (error.status >= 500) || 
        (error.status === 429);
      
      if (shouldRetry && attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000);
        console.log(`OpenAI request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

export { openai };