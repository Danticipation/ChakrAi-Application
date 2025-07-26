import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the built React app
app.use(express.static(join(__dirname, 'client/dist')));

// Handle React routing - send all requests to React app
app.get('*', (req, res) => {
  try {
    const indexPath = join(__dirname, 'client/dist/index.html');
    const html = readFileSync(indexPath, 'utf8');
    res.send(html);
  } catch (error) {
    console.error('Error serving React app:', error);
    res.status(500).send('Error loading application');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧠 Chakrai running on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
});