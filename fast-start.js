// Minimal server that binds to port 5000 immediately
import http from 'http';

console.log('Starting minimal server on port 5000');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <head>
        <title>ScootMe App</title>
        <meta http-equiv="refresh" content="3;url=/" />
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(to bottom, #f0f4f8, #d9e2ec);
            color: #334e68;
          }
          .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #0070f3, #00c3ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .spinner {
            border: 6px solid #f3f3f3;
            border-top: 6px solid #0070f3;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 1rem 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="logo">ScootMe</div>
        <div class="spinner"></div>
        <h2>Starting application...</h2>
        <p>You'll be redirected automatically in a few seconds.</p>
      </body>
    </html>
  `);
});

// Bind to port 5000 immediately
server.listen(5000, '0.0.0.0', () => {
  console.log('✅ BOUND TO PORT 5000');
});