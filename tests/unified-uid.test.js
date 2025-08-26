// Unified UID System Tests
import request from 'supertest';
import { expect } from 'chai';

// We'll test against the running server instead of importing the app
const BASE_URL = 'http://localhost:5000';

describe('Unified UID System', () => {
  let agent;
  
  beforeEach(() => {
    // Create agent that maintains cookies across requests
    agent = request.agent(BASE_URL);
  });

  it('should assign same UID across mood and debug routes', async () => {
    // Step 1: Post a mood entry
    const moodResponse = await agent
      .post('/api/mood')
      .send({ mood: 'test', intensity: 7, notes: 'CI test' })
      .expect(200);
    
    expect(moodResponse.body.success).to.be.true;
    expect(moodResponse.body.moodEntry.uid).to.match(/^usr_[0-9a-f]+\.k\d+\./); 
    
    const moodUID = moodResponse.body.moodEntry.uid;
    
    // Step 2: Check whoami endpoint
    const whoamiResponse = await agent
      .get('/api/debug/whoami')
      .expect(200);
    
    expect(whoamiResponse.body.uid).to.equal(moodUID);
    expect(whoamiResponse.body.hasCookie).to.be.true;
    
    // Step 3: Post another mood entry
    const secondMoodResponse = await agent
      .post('/api/mood')
      .send({ mood: 'consistent', intensity: 8 })
      .expect(200);
    
    expect(secondMoodResponse.body.moodEntry.uid).to.equal(moodUID);
    
    console.log(`✅ Unified UID test passed with UID: ${moodUID.substring(0, 20)}...`);
  });

  it('should generate different UIDs for different sessions', async () => {
    // Session 1
    const agent1 = request.agent(BASE_URL);
    const mood1 = await agent1
      .post('/api/mood')
      .send({ mood: 'session1', intensity: 5 })
      .expect(200);
    
    // Session 2
    const agent2 = request.agent(BASE_URL);
    const mood2 = await agent2
      .post('/api/mood')
      .send({ mood: 'session2', intensity: 6 })
      .expect(200);
    
    const uid1 = mood1.body.moodEntry.uid;
    const uid2 = mood2.body.moodEntry.uid;
    
    expect(uid1).to.not.equal(uid2);
    expect(uid1).to.match(/^usr_[0-9a-f]+\.k\d+\./);
    expect(uid2).to.match(/^usr_[0-9a-f]+\.k\d+\./);
    
    console.log(`✅ Different sessions test passed: ${uid1.substring(0, 12)}... vs ${uid2.substring(0, 12)}...`);
  });

  it('should maintain UID persistence across multiple requests', async () => {
    const uids = [];
    
    // Make 5 requests with the same agent
    for (let i = 0; i < 5; i++) {
      const response = await agent
        .post('/api/mood')
        .send({ mood: `test_${i}`, intensity: i + 1 })
        .expect(200);
      
      uids.push(response.body.moodEntry.uid);
    }
    
    // All UIDs should be identical
    const firstUID = uids[0];
    uids.forEach((uid, index) => {
      expect(uid).to.equal(firstUID, `Request ${index} UID mismatch`);
    });
    
    console.log(`✅ Persistence test passed: 5 requests, same UID: ${firstUID.substring(0, 20)}...`);
  });
  
  it('should handle missing mood parameters gracefully', async () => {
    const response = await agent
      .post('/api/mood')
      .send({ intensity: 5 }) // Missing mood
      .expect(400);
    
    expect(response.body.success).to.be.false;
    expect(response.body.error).to.include('mood and intensity are required');
  });
});