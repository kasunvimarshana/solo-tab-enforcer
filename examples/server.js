const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './examples/basic-usage.html';
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  // Check if file exists
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #e74c3c; }
              .links { margin-top: 30px; }
              .links a { margin: 0 10px; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>404 - File Not Found</h1>
            <p>The requested file could not be found.</p>
            <div class="links">
              <a href="/examples/basic-usage.html">Basic Usage</a>
              <a href="/examples/advanced-usage.html">Advanced Usage</a>
              <a href="/dist/solo-tab-enforcer.js">Download Package</a>
            </div>
          </body>
          </html>
        `);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Solo Tab Enforcer Demo Server running at http://localhost:${PORT}`);
  console.log(`📖 Basic Usage: http://localhost:${PORT}/examples/basic-usage.html`);
  console.log(`🔧 Advanced Usage: http://localhost:${PORT}/examples/advanced-usage.html`);
  console.log(`📦 Package File: http://localhost:${PORT}/dist/solo-tab-enforcer.js`);
});