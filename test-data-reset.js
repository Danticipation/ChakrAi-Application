#!/usr/bin/env node
// Test data reset/clearing functionality

const API_BASE = 'http://localhost:3000/api';
const TEST_USER_ID = '1'; // Update with your test user ID
const AUTH_TOKEN = 'your_auth_token'; // Update with your auth token

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function makeRequest(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'X-User-ID': TEST_USER_ID
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return { 
      success: response.ok, 
      status: response.status,
      data 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function testDataResetFeatures() {
  console.log(`${colors.blue}=== Testing Data Reset Features ===${colors.reset}\n`);
  
  // Test 1: Clear journal entries
  console.log(`${colors.yellow}Test 1: Clear All Journal Entries${colors.reset}`);
  const journalClear = await makeRequest('DELETE', '/journals/all');
  if (journalClear.success) {
    console.log(`${colors.green}✓ Journal entries cleared successfully${colors.reset}`);
    console.log(`  Response:`, journalClear.data);
  } else {
    console.log(`${colors.red}✗ Failed to clear journal entries${colors.reset}`);
    console.log(`  Error:`, journalClear);
  }
  console.log();
  
  // Test 2: Clear chat history
  console.log(`${colors.yellow}Test 2: Clear Chat History${colors.reset}`);
  const chatClear = await makeRequest('DELETE', '/chats/history');
  if (chatClear.success) {
    console.log(`${colors.green}✓ Chat history cleared successfully${colors.reset}`);
    console.log(`  Response:`, chatClear.data);
  } else {
    console.log(`${colors.red}✗ Failed to clear chat history${colors.reset}`);
    console.log(`  Error:`, chatClear);
  }
  console.log();
  
  // Test 3: Factory reset
  console.log(`${colors.yellow}Test 3: Factory Reset (Clear Everything)${colors.reset}`);
  console.log(`${colors.magenta}⚠️  This will delete ALL user data! Proceed? (y/n)${colors.reset}`);
  
  // For testing, we'll skip the prompt and just show what would happen
  console.log(`  Skipping factory reset for safety. To test, call:`);
  console.log(`  ${colors.blue}DELETE /api/users/factory-reset${colors.reset}`);
  
  // Uncomment to actually test factory reset:
  /*
  const factoryReset = await makeRequest('DELETE', '/users/factory-reset');
  if (factoryReset.success) {
    console.log(`${colors.green}✓ Factory reset completed successfully${colors.reset}`);
    console.log(`  Response:`, factoryReset.data);
  } else {
    console.log(`${colors.red}✗ Failed to perform factory reset${colors.reset}`);
    console.log(`  Error:`, factoryReset);
  }
  */
  console.log();
  
  // Test 4: Verify data is cleared by fetching
  console.log(`${colors.yellow}Test 4: Verify Data Clearing${colors.reset}`);
  
  // Check journal entries
  const journalCheck = await makeRequest('GET', '/journals');
  console.log(`  Journal entries count: ${journalCheck.data?.length || 0}`);
  
  // Check chat history
  const chatCheck = await makeRequest('GET', '/chats');
  console.log(`  Chat messages count: ${chatCheck.data?.length || 0}`);
  
  console.log(`\n${colors.green}=== Testing Complete ===${colors.reset}`);
}

// Add command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`${colors.blue}Chakrai Data Reset Testing Tool${colors.reset}`);
    console.log('\nUsage:');
    console.log('  node test-data-reset.js test          - Run all tests');
    console.log('  node test-data-reset.js clear-journal - Clear journal entries only');
    console.log('  node test-data-reset.js clear-chat    - Clear chat history only');
    console.log('  node test-data-reset.js factory-reset - Factory reset (clear all)');
    console.log('\nNote: Update TEST_USER_ID and AUTH_TOKEN in the script first!');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'test':
      await testDataResetFeatures();
      break;
      
    case 'clear-journal':
      console.log(`${colors.yellow}Clearing journal entries...${colors.reset}`);
      const journal = await makeRequest('DELETE', '/journals/all');
      console.log(journal.success ? 
        `${colors.green}✓ Journal cleared${colors.reset}` : 
        `${colors.red}✗ Failed${colors.reset}`);
      break;
      
    case 'clear-chat':
      console.log(`${colors.yellow}Clearing chat history...${colors.reset}`);
      const chat = await makeRequest('DELETE', '/chats/history');
      console.log(chat.success ? 
        `${colors.green}✓ Chat history cleared${colors.reset}` : 
        `${colors.red}✗ Failed${colors.reset}`);
      break;
      
    case 'factory-reset':
      console.log(`${colors.red}⚠️  WARNING: This will delete ALL user data!${colors.reset}`);
      console.log('Type "DELETE ALL" to confirm: ');
      // In a real implementation, you'd wait for user input
      console.log('Skipping for safety. Uncomment code to enable.');
      /*
      const reset = await makeRequest('DELETE', '/users/factory-reset');
      console.log(reset.success ? 
        `${colors.green}✓ Factory reset complete${colors.reset}` : 
        `${colors.red}✗ Failed${colors.reset}`);
      */
      break;
      
    default:
      console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
      console.log('Run without arguments to see usage.');
  }
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:`, error, `${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { makeRequest, testDataResetFeatures };
