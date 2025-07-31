// Add this debugging middleware to your index.ts file 
// Place it RIGHT AFTER the express.json() and express.urlencoded() setup
// and BEFORE any of your API routes

// ============ DEBUG MIDDLEWARE ============
app.use('/api/community', (req, res, next) => {
  console.log('🔍 COMMUNITY API REQUEST:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.originalUrl);
  console.log('- Path:', req.path);
  console.log('- Body:', req.body);
  console.log('- Headers:', req.headers);
  console.log('=====================================');
  next();
});

// Also add this general API logger
app.use('/api', (req, res, next) => {
  console.log(`📡 API Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Check if routes are being registered correctly
console.log('🚀 Registering API routes...');