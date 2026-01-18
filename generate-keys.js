const crypto = require('crypto');

const generateKey = () => crypto.randomBytes(32).toString('hex');

console.log(`
# Copy these into your .env file:

SESSION_SECRET=${generateKey()}
JOURNAL_ENCRYPTION_KEY=${generateKey()}
JWT_SECRET=${generateKey()}
`);