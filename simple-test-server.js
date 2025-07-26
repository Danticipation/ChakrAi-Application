import { createServer } from 'http';

const server = createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`<!DOCTYPE html>
<html>
<head>
    <title>ACTUAL TEST</title>
    <style>
        body { 
            background: red; 
            color: white; 
            font-size: 72px; 
            text-align: center; 
            padding: 100px; 
        }
    </style>
</head>
<body>
    <h1>THIS IS ACTUALLY WORKING</h1>
    <p>If you can see this red page, the server is running</p>
    <p>Time: ${new Date().toLocaleString()}</p>
</body>
</html>`);
});

server.listen(3000, () => {
  console.log('Test server running on port 3000');
  console.log('Go to http://localhost:3000 to see if it works');
});