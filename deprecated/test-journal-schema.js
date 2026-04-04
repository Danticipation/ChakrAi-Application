// Quick test to verify journal entries table schema
import { db } from './server/db.js';
import { journalEntries } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testJournalSchema() {
  try {
    console.log('🔍 Testing journal entries table schema...');
    
    // Try to insert a minimal test entry
    const testEntry = {
      userId: 123456,
      content: 'Test entry for schema validation',
      isPrivate: true,
      createdAt: new Date()
    };
    
    console.log('📝 Attempting test insert...');
    const [result] = await db.insert(journalEntries).values(testEntry).returning();
    console.log('✅ Test insert successful:', result);
    
    // Clean up - delete the test entry
    if (result?.id) {
      await db.delete(journalEntries).where(eq(journalEntries.id, result.id));
      console.log('🧹 Test entry cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
    console.error('Error details:', error.message);
  }
}

testJournalSchema();