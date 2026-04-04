import express from 'express';
import { UserStorage } from '../storage/userStorage.js';
import { storage } from '../storage.js';

const router = express.Router();
const userStorage = new UserStorage();

// Debug endpoint to see user database
router.get('/debug-users', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Checking user database...');
    
    // Check users 107 and 19
    const user107 = await userStorage.getUserById(107).catch(e => { console.log('Error getting user 107:', e); return null; });
    const user19 = await userStorage.getUserById(19).catch(e => { console.log('Error getting user 19:', e); return null; });
    const user4 = await userStorage.getUserById(4).catch(e => { console.log('Error getting user 4:', e); return null; });
    
    // Check current device fingerprints
    const currentFingerprint = 'healthcare-user-107';
    const user107Fingerprint = 'chakrai_1755471559515_dca42542a3d0e987c117b0c2e6f06d9f_W29iamVjdCBTY3Jl';
    
    const userByCurrentFingerprint = await userStorage.getUserByDeviceFingerprint(currentFingerprint).catch(e => { console.log('Error getting user by current fingerprint:', e); return null; });
    const userBy107Fingerprint = await userStorage.getUserByDeviceFingerprint(user107Fingerprint).catch(e => { console.log('Error getting user by 107 fingerprint:', e); return null; });
    
    const debugInfo = {
      currentDeviceFingerprint: currentFingerprint,
      user107DeviceFingerprint: user107Fingerprint,
      userByCurrentFingerprint: userByCurrentFingerprint,
      userBy107Fingerprint: userBy107Fingerprint,
      user107: user107,
      user19: user19,
      user4: user4,
      summary: {
        user107Exists: !!user107,
        user107DeviceFingerprint: user107?.deviceFingerprint,
        user19Exists: !!user19,
        user19DeviceFingerprint: user19?.deviceFingerprint,
        currentFingerprintMapsTo: userByCurrentFingerprint?.id,
        user107FingerprintMapsTo: userBy107Fingerprint?.id
      }
    };
    
    console.log('🔍 DEBUG RESULTS:', JSON.stringify(debugInfo, null, 2));
    
    res.json(debugInfo);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message,
      stack: error.stack
    });
  }
});

// Fix endpoint to update user 107's device fingerprint
router.post('/fix-user-107', async (req, res) => {
  try {
    console.log('🔧 FIXING: Updating user 107 device fingerprint...');
    
    const currentFingerprint = 'chakrai_1755471559515_dca42542a3d0e987c117b0c2e6f06d9f_W29iamVjdCBTY3Jl';
    
    // Update user 107 to use the current device fingerprint
    const updatedUser = await userStorage.updateUser(107, {
      deviceFingerprint: currentFingerprint
    }).catch(error => {
      console.error('Error updating user 107:', error);
      throw error;
    });
    
    console.log('✅ FIXED: User 107 now has device fingerprint:', currentFingerprint);
    
    res.json({
      success: true,
      message: 'User 107 device fingerprint updated',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({ 
      error: 'Fix failed',
      details: error.message
    });
  }
});

// Create user 107 to match the auth system
router.get('/create-user-107', async (req, res) => {
  try {
    console.log('🏗️ CREATING: User 107 to match auth system...');
    
    const user107Fingerprint = 'chakrai_1755471559515_dca42542a3d0e987c117b0c2e6f06d9f_W29iamVjdCBTY3Jl';
    
    // Check if user 107 already exists
    const existingUser = await userStorage.getUserById(107).catch(() => null);
    
    if (existingUser) {
      return res.json({
        success: true,
        message: 'User 107 already exists',
        user: existingUser
      });
    }
    
    // Create user 107 with the correct fingerprint
    const newUser = await userStorage.createUser({
      id: 107, // Try to create with specific ID
      username: 'user_107_main',
      sessionId: 'session_107_main',
      deviceFingerprint: user107Fingerprint,
      isAnonymous: true,
      displayName: 'Main User 107'
    }).catch(error => {
      // If we can't set specific ID, create normally
      console.log('Cannot set specific ID, creating normally:', error.message);
      return userStorage.createUser({
        username: 'user_107_recreated',
        sessionId: 'session_107_recreated', 
        deviceFingerprint: user107Fingerprint,
        isAnonymous: true,
        displayName: 'Recreated User 107'
      });
    });
    
    console.log('✅ CREATED: User 107 with ID:', newUser.id);
    
    res.json({
      success: true,
      message: `User created with ID ${newUser.id}`,
      user: newUser,
      instructions: newUser.id !== 107 ? 
        `Note: Created user with ID ${newUser.id} instead of 107. You may need to update your localStorage fingerprint.` :
        'User 107 created successfully!'
    });
    
  } catch (error) {
    console.error('❌ Create user 107 error:', error);
    res.status(500).json({ 
      error: 'Failed to create user 107',
      details: error.message
    });
  }
});

// Simple endpoint to set localStorage values
router.get('/set-fingerprint', (req, res) => {
  const user19Fingerprint = 'healthcare-user-107'; // This works with existing user 19
  const user107Fingerprint = 'chakrai_1755471559515_dca42542a3d0e987c117b0c2e6f06d9f_W29iamVjdCBTY3Jl'; // This would need user 107 to exist
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fix Device Fingerprint - User ID Authentication</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
            .option { margin: 20px 0; padding: 20px; border: 2px solid #ddd; border-radius: 8px; }
            .recommended { border-color: #4CAF50; background: #f9fff9; }
            button { padding: 12px 24px; margin: 10px 5px; font-size: 16px; border-radius: 4px; cursor: pointer; }
            .btn-primary { background: #4CAF50; color: white; border: none; }
            .btn-secondary { background: #2196F3; color: white; border: none; }
            .result { margin: 15px 0; padding: 15px; border-radius: 4px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔧 Fix User Authentication Issues</h1>
            
            <div class="result info">
                <strong>Current Situation:</strong><br>
                • User 107 doesn't exist in database<br>
                • User 19 exists and works (has your current fingerprint)<br>
                • Auth system tries to use user 107<br>
                • Analytics uses user 19<br>
            </div>
            
            <div class="option recommended">
                <h2>✅ Option A: Use Existing User 19 (Recommended)</h2>
                <p>This is the <strong>easiest solution</strong>. User 19 already exists and has all the database setup. We'll keep your current fingerprint and everything will work.</p>
                <button class="btn-primary" onclick="useUser19()">Fix with User 19</button>
                <div id="result19"></div>
            </div>
            
            <div class="option">
                <h2>⚙️ Option B: Create User 107</h2>
                <p>This tries to create user 107 in the database to match what the auth system expects. More complex but maintains the "107" ID.</p>
                <button class="btn-secondary" onclick="createUser107()">Create User 107</button>
                <div id="result107"></div>
            </div>
            
            <div class="option">
                <h2>🔍 Debug Info</h2>
                <p>Check current authentication state:</p>
                <button onclick="checkAuth()">Check Current Auth</button>
                <div id="authResult"></div>
            </div>
        </div>
        
        <script>
        function useUser19() {
            console.log('Using existing user 19...');
            console.log('Current fingerprint:', localStorage.getItem('deviceFingerprint'));
            
            // Keep the current fingerprint (healthcare-user-107) which maps to user 19
            localStorage.setItem('deviceFingerprint', '${user19Fingerprint}');
            localStorage.removeItem('sessionId');
            
            console.log('✅ Set to use User 19');
            document.getElementById('result19').innerHTML = 
                '<div class="result success"><strong>✅ Success!</strong><br>Using existing User 19. <a href="/">Refresh main app</a> and try personality reflection.</div>';
        }
        
        async function createUser107() {
            try {
                console.log('Creating user 107...');
                
                const response = await fetch('/api/debug/create-user-107');
                const result = await response.json();
                
                if (result.success) {
                    // Set the fingerprint for the created user
                    localStorage.setItem('deviceFingerprint', '${user107Fingerprint}');
                    localStorage.removeItem('sessionId');
                    
                    document.getElementById('result107').innerHTML = 
                        \`<div class="result success"><strong>✅ \${result.message}</strong><br>\${result.instructions || 'User 107 ready!'} <a href="/">Refresh main app</a></div>\`;
                } else {
                    document.getElementById('result107').innerHTML = 
                        \`<div class="result" style="background: #f8d7da; color: #721c24;">❌ \${result.error}</div>\`;
                }
            } catch (error) {
                document.getElementById('result107').innerHTML = 
                    \`<div class="result" style="background: #f8d7da; color: #721c24;">❌ Error: \${error.message}</div>\`;
            }
        }
        
        async function checkAuth() {
            try {
                const response = await fetch('/api/debug/debug-users');
                const result = await response.json();
                
                const currentFingerprint = localStorage.getItem('deviceFingerprint') || 'none';
                const authInfo = \`
                    <strong>Browser Fingerprint:</strong> \${currentFingerprint}<br>
                    <strong>Maps to User:</strong> \${result.summary.currentFingerprintMapsTo || 'none'}<br>
                    <strong>User 107 Exists:</strong> \${result.summary.user107Exists ? 'Yes' : 'No'}<br>
                    <strong>User 19 Exists:</strong> \${result.summary.user19Exists ? 'Yes' : 'No'}
                \`;
                
                document.getElementById('authResult').innerHTML = 
                    \`<div class="result info">\${authInfo}</div>\`;
            } catch (error) {
                document.getElementById('authResult').innerHTML = 
                    \`<div class="result" style="background: #f8d7da; color: #721c24;">❌ Error checking auth</div>\`;
            }
        }
        </script>
    </body>
    </html>
  `);
});

// WHO AM I endpoint for testing UID persistence
router.get('/whoami', (req, res) => {
  try {
    const uid = req.ctx?.uid || 'no-uid';
    const headers = {
      'x-user-id': req.headers['x-user-id'],
      'x-device-fingerprint': req.headers['x-device-fingerprint'],
      'x-session-id': req.headers['x-session-id']
    };
    
    console.log(`🔍 WHOAMI: UID=${uid}, Headers:`, headers);
    
    res.json({
      uid: uid,
      timestamp: new Date().toISOString(),
      headers: headers,
      cookies: req.cookies,
      message: `You are UID: ${uid}`
    });
  } catch (error) {
    console.error('Whoami error:', error);
    res.status(500).json({ error: 'Whoami failed', details: error.message });
  }
});

export default router;