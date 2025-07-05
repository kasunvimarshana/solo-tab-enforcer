const buildCJS = require('./build-cjs');
const buildESM = require('./build-esm');
const buildUMD = require('./build-umd');
const buildTypes = require('./build-types');
const lint = require('./lint');

// Development server
function startDevServer() {
  const http = require('http');
  const fs = require('fs');
  const path = require('path');

  const server = http.createServer((req, res) => {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(__dirname, '../examples', url);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      let contentType = 'text/html';

      switch (ext) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`Development server running at http://localhost:${port}`);
  });
}

// Export functions for use in package.json scripts
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'cjs':
      buildCJS();
      break;
    case 'esm':
      buildESM();
      break;
    case 'umd':
      buildUMD();
      break;
    case 'types':
      buildTypes();
      break;
    case 'lint':
      lint();
      break;
    case 'dev':
      startDevServer();
      break;
    default:
      console.log('Usage: node build-system.js [cjs|esm|umd|types|lint|dev]');
  }
}

module.exports = {
  buildCJS,
  buildESM,
  buildUMD,
  buildTypes,
  lint,
  startDevServer,
};
