// Quick test script to check login functionality
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const email = 'sharpe503@gmail.com';
const password = 'your_password_here'; // Replace with your actual password

async function testLogin() {
  console.log('\n🔍 Testing login for:', email);
  
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });
  
  if (!user) {
    console.log('❌ No user found with email:', email);
    console.log('\n📝 Creating test user...');
    
    // Create user with password
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      email: email,
      name: 'Test User',
      passwordHash: hashedPassword,
      roles: ['user']
    }).returning();
    
    console.log('✅ Test user created:', newUser.id);
    return;
  }
  
  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    hasPassword: !!user.passwordHash,
    passwordHashLength: user.passwordHash?.length
  });
  
  // Test password
  if (user.passwordHash) {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔑 Password valid:', isValid);
  } else {
    console.log('⚠️  User has no password hash');
  }
}

testLogin().catch(console.error).finally(() => process.exit(0));
