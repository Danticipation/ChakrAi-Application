// Test if the bulletproof chat system is working
console.log('🧪 Testing bulletproof chat system...');

fetch('http://localhost:5001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'BULLETPROOF TEST: Can you save this message to database?',
    model: 'gpt-4o'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Chat API Response:', data);
  if (data.memoryStatus) {
    console.log('🛡️ Memory Status:', data.memoryStatus);
    console.log('📊 Messages Saved:', data.messagesSaved);
    console.log('📚 Conversation History:', data.conversationHistory);
  }
})
.catch(error => {
  console.error('❌ Chat API Error:', error);
});
