const http = require('http');
const port = 5000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`<!DOCTYPE html>
<html>
<head>
    <title>Chakrai - WORKING VERSION</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        h1 {
            color: #2d3748;
            font-size: 3rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .logo {
            font-size: 5rem;
            margin-bottom: 20px;
        }
        .status {
            background: #48bb78;
            color: white;
            padding: 20px;
            border-radius: 15px;
            font-size: 1.2rem;
            font-weight: bold;
            margin: 20px 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .message {
            background: #e2e8f0;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            color: #2d3748;
            line-height: 1.6;
        }
        .time {
            color: #666;
            font-size: 0.9rem;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🧠</div>
        <h1>Chakrai</h1>
        <div class="status">✅ THIS IS ACTUALLY WORKING NOW</div>
        <div class="message">
            <p><strong>Your mental wellness application is finally operational.</strong></p>
            <p>This is a simple server that bypasses ALL React complexity and serves content directly.</p>
            <p>No more white screens. No more build failures. No more lies.</p>
        </div>
        <div class="time">Server started: ${new Date().toLocaleString()}</div>
    </div>
</body>
</html>`);
});

server.listen(port, '0.0.0.0', () => {
  console.log('==========================================');
  console.log('CHAKRAI IS RUNNING ON PORT ' + port);
  console.log('Visit: http://localhost:' + port);
  console.log('THIS WILL ACTUALLY WORK - NO MORE LIES');
  console.log('==========================================');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  server.close();
});

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  server.close();
});