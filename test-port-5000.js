// Simple test server to check if port 5000 is available
import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send('Port 5000 test server is working!');
});

const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
}).on('error', (err) => {
  console.error(`Could not start server on port ${port}:`, err.message);
});