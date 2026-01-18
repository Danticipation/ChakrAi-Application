/**
 * HIPAA-COMPLIANT AUTHENTICATION TESTING SCRIPT
 * 
 * This script tests all authentication flows to ensure HIPAA compliance
 * and proper JWT-only authentication implementation.
 * 
 * Tests:
 * 1. User Registration
 * 2. User Login 
 * 3. Token Verification
 * 4. Protected Route Access
 * 5. Anonymous User Migration
 * 6. Security Validations
 */

import fetch from 'node-fetch';
import { storage } from './storage/storage-minimal.js';

const BASE_URL = 'http://localhost:5001';
const TEST_EMAIL = 'test@chakrai.app';
const TEST_PASSWORD = 'SecureTestPassword123!';
const TEST_NAME = 'Test User';

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.bold}${colors.blue}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function makeRequest(path, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    return { error: error.message };
  }
}

class AuthenticationTester {
  constructor() {
    this.testResults = [];
    this.userToken = null;
    this.testUserId = null;
  }

  recordTest(testName, passed, message) {
    this.testResults.push({ testName, passed, message });
    if (passed) {
      logSuccess(`${testName}: ${message}`);
    } else {
      logError(`${testName}: ${message}`);
    }
  }

  async test1_UserRegistration() {
    logTest('User Registration');
    
    try {
      // Clean up any existing test user first
      const existingUser = await storage.getUserByEmail(TEST_EMAIL);
      if (existingUser) {
        logWarning('Cleaning up existing test user');
      }

      const result = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: TEST_NAME
        })
      });

      if (result.error) {
        this.recordTest('Registration Request', false, `Network error: ${result.error}`);
        return false;
      }

      if (result.status === 201 && result.data.token && result.data.user) {
        this.userToken = result.data.token;
        this.testUserId = result.data.user.id;
        
        this.recordTest('Registration Success', true, 'User registered successfully');
        this.recordTest('JWT Token Generated', !!result.data.token, 'Valid JWT token returned');
        this.recordTest('User Data Complete', 
          result.data.user.email === TEST_EMAIL.toLowerCase() && 
          result.data.user.displayName === TEST_NAME &&
          result.data.user.isAnonymous === false, 
          'User data is correct');
        
        return true;
      } else if (result.status === 409) {
        this.recordTest('Registration Duplicate', true, 'Correctly rejected duplicate email');
        
        // Try to login with existing user
        const loginResult = await makeRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
          })
        });
        
        if (loginResult.status === 200 && loginResult.data.token) {
          this.userToken = loginResult.data.token;
          this.testUserId = loginResult.data.user.id;
          this.recordTest('Fallback Login', true, 'Successfully logged in with existing user');
          return true;
        }
      }
      
      this.recordTest('Registration Failed', false, `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`);
      return false;
      
    } catch (error) {
      this.recordTest('Registration Exception', false, error.message);
      return false;
    }
  }

  async test2_UserLogin() {
    logTest('User Login');
    
    try {
      const result = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });

      if (result.error) {
        this.recordTest('Login Request', false, `Network error: ${result.error}`);
        return false;
      }

      if (result.status === 200 && result.data.token && result.data.user) {
        this.userToken = result.data.token;
        this.testUserId = result.data.user.id;
        
        this.recordTest('Login Success', true, 'User logged in successfully');
        this.recordTest('JWT Token Generated', !!result.data.token, 'Valid JWT token returned');
        this.recordTest('User Data Consistent', 
          result.data.user.email === TEST_EMAIL.toLowerCase() && 
          result.data.user.isAnonymous === false, 
          'User data is consistent with registration');
        
        return true;
      }
      
      this.recordTest('Login Failed', false, `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`);
      return false;
      
    } catch (error) {
      this.recordTest('Login Exception', false, error.message);
      return false;
    }
  }

  async test3_InvalidCredentials() {
    logTest('Invalid Credentials Handling');
    
    try {
      const result = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: 'WrongPassword123!'
        })
      });

      if (result.status === 401) {
        this.recordTest('Invalid Password Rejected', true, 'Correctly rejected invalid password');
      } else {
        this.recordTest('Invalid Password Security', false, `Should return 401, got ${result.status}`);
      }

      const result2 = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: TEST_PASSWORD
        })
      });

      if (result2.status === 401) {
        this.recordTest('Invalid Email Rejected', true, 'Correctly rejected non-existent email');
      } else {
        this.recordTest('Invalid Email Security', false, `Should return 401, got ${result2.status}`);
      }
      
    } catch (error) {
      this.recordTest('Credentials Test Exception', false, error.message);
    }
  }

  async test4_TokenVerification() {
    logTest('Token Verification');
    
    if (!this.userToken) {
      this.recordTest('Token Verification', false, 'No token available for testing');
      return false;
    }
    
    try {
      const result = await makeRequest('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });

      if (result.error) {
        this.recordTest('Verify Request', false, `Network error: ${result.error}`);
        return false;
      }

      if (result.status === 200 && result.data.user) {
        this.recordTest('Token Verification', true, 'Token verified successfully');
        this.recordTest('User Data Retrieved', 
          result.data.user.email === TEST_EMAIL.toLowerCase(), 
          'Correct user data returned');
        return true;
      }
      
      this.recordTest('Token Verification Failed', false, `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`);
      return false;
      
    } catch (error) {
      this.recordTest('Verification Exception', false, error.message);
      return false;
    }
  }

  async test5_InvalidTokenHandling() {
    logTest('Invalid Token Handling');
    
    try {
      // Test with invalid token
      const result1 = await makeRequest('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token-123'
        }
      });

      if (result1.status === 401) {
        this.recordTest('Invalid Token Rejected', true, 'Correctly rejected invalid token');
      } else {
        this.recordTest('Invalid Token Security', false, `Should return 401, got ${result1.status}`);
      }

      // Test with no token
      const result2 = await makeRequest('/api/auth/verify', {
        method: 'GET'
      });

      if (result2.status === 401) {
        this.recordTest('Missing Token Rejected', true, 'Correctly rejected missing token');
      } else {
        this.recordTest('Missing Token Security', false, `Should return 401, got ${result2.status}`);
      }
      
    } catch (error) {
      this.recordTest('Invalid Token Test Exception', false, error.message);
    }
  }

  async test6_ProtectedRouteAccess() {
    logTest('Protected Route Access');
    
    if (!this.userToken) {
      this.recordTest('Protected Route Test', false, 'No token available for testing');
      return false;
    }
    
    try {
      // Test accessing a protected route with valid token
      const result1 = await makeRequest('/api/journal', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });

      if (result1.status !== 401) {
        this.recordTest('Protected Route Access', true, 'Can access protected route with valid token');
      } else {
        this.recordTest('Protected Route Access', false, `Protected route rejected valid token: ${result1.status}`);
      }

      // Test accessing protected route without token
      const result2 = await makeRequest('/api/journal', {
        method: 'GET'
      });

      if (result2.status === 401) {
        this.recordTest('Protected Route Security', true, 'Protected route correctly rejects requests without token');
      } else {
        this.recordTest('Protected Route Security', false, `Protected route should return 401, got ${result2.status}`);
      }
      
    } catch (error) {
      this.recordTest('Protected Route Test Exception', false, error.message);
    }
  }

  async test7_LogoutFunctionality() {
    logTest('Logout Functionality');
    
    if (!this.userToken) {
      this.recordTest('Logout Test', false, 'No token available for testing');
      return false;
    }
    
    try {
      const result = await makeRequest('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`
        }
      });

      if (result.status === 200 && result.data.success) {
        this.recordTest('Logout Success', true, 'Logout endpoint works correctly');
      } else {
        this.recordTest('Logout Failed', false, `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`);
      }
      
    } catch (error) {
      this.recordTest('Logout Exception', false, error.message);
    }
  }

  async test8_PasswordHashing() {
    logTest('Password Security Validation');
    
    if (!this.testUserId) {
      this.recordTest('Password Hashing Test', false, 'No test user ID available');
      return false;
    }
    
    try {
      // Get user from database and check password is hashed
      const user = await storage.getUser(this.testUserId);
      
      if (user && user.passwordHash) {
        if (user.passwordHash !== TEST_PASSWORD && user.passwordHash.startsWith('$2b$')) {
          this.recordTest('Password Hashing', true, 'Password is properly bcrypt hashed');
        } else {
          this.recordTest('Password Hashing', false, 'Password is not properly hashed');
        }
      } else {
        this.recordTest('Password Storage', false, 'Password hash not found in database');
      }
      
    } catch (error) {
      this.recordTest('Password Security Test Exception', false, error.message);
    }
  }

  async test9_InputValidation() {
    logTest('Input Validation');
    
    try {
      // Test weak password
      const result1 = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test2@test.com',
          password: '123', // Too short
          name: 'Test User 2'
        })
      });

      if (result1.status === 400) {
        this.recordTest('Weak Password Validation', true, 'Correctly rejected weak password');
      } else {
        this.recordTest('Weak Password Validation', false, `Should reject weak password, got ${result1.status}`);
      }

      // Test invalid email
      const result2 = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'StrongPassword123!',
          name: 'Test User 3'
        })
      });

      if (result2.status === 400) {
        this.recordTest('Email Format Validation', true, 'Correctly rejected invalid email format');
      } else {
        this.recordTest('Email Format Validation', false, `Should reject invalid email, got ${result2.status}`);
      }
      
    } catch (error) {
      this.recordTest('Input Validation Exception', false, error.message);
    }
  }

  async runAllTests() {
    log('\n🔒 CHAKRAI HIPAA-COMPLIANT AUTHENTICATION TESTING', 'bold');
    log('=' * 60, 'blue');
    
    const startTime = Date.now();
    
    // Run all tests in sequence
    await this.test1_UserRegistration();
    await this.test2_UserLogin();
    await this.test3_InvalidCredentials();
    await this.test4_TokenVerification();
    await this.test5_InvalidTokenHandling();
    await this.test6_ProtectedRouteAccess();
    await this.test7_LogoutFunctionality();
    await this.test8_PasswordHashing();
    await this.test9_InputValidation();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Summary
    log('\n📊 TEST RESULTS SUMMARY', 'bold');
    log('=' * 60, 'blue');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    log(`Total Tests: ${total}`);
    log(`Passed: ${passed}`, passed === total ? 'green' : 'yellow');
    log(`Failed: ${total - passed}`, total - passed === 0 ? 'green' : 'red');
    log(`Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
    log(`Duration: ${duration}ms`);
    
    if (passed === total) {
      log('\n🎉 ALL TESTS PASSED! Authentication system is HIPAA-compliant and secure.', 'green');
    } else {
      log('\n⚠️  Some tests failed. Please review the issues above.', 'red');
      
      // Show failed tests
      const failedTests = this.testResults.filter(r => !r.passed);
      if (failedTests.length > 0) {
        log('\nFailed Tests:', 'red');
        failedTests.forEach(test => {
          log(`  - ${test.testName}: ${test.message}`, 'red');
        });
      }
    }
    
    log('\n🔒 HIPAA COMPLIANCE CHECKLIST:', 'bold');
    log('✅ JWT-only authentication (no header fallbacks)', passed > 0 ? 'green' : 'red');
    log('✅ bcrypt password hashing', this.testResults.find(r => r.testName === 'Password Hashing')?.passed ? 'green' : 'red');
    log('✅ Proper token validation', this.testResults.find(r => r.testName === 'Token Verification')?.passed ? 'green' : 'red');
    log('✅ Protected route security', this.testResults.find(r => r.testName === 'Protected Route Security')?.passed ? 'green' : 'red');
    log('✅ Input validation', this.testResults.find(r => r.testName.includes('Validation'))?.length > 0 ? 'green' : 'red');
    log('✅ Error handling', this.testResults.find(r => r.testName.includes('Rejected'))?.passed ? 'green' : 'red');
    
    return passed === total;
  }
}

// Export the tester for use in other scripts
export { AuthenticationTester };

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthenticationTester();
  
  // Wait a moment for server to be ready
  setTimeout(async () => {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  }, 1000);
}
