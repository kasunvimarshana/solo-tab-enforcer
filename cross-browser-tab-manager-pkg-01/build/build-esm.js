// ES Module build
const fs = require('fs');
const path = require('path');

function buildESM() {
  console.log('Building ES Module version...');

  const srcPath = path.join(__dirname, '../src/tab-manager.js');
  const distPath = path.join(__dirname, '../dist/tab-manager.esm.js');

  // Ensure dist directory exists
  const distDir = path.dirname(distPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Read source file
  let source = fs.readFileSync(srcPath, 'utf8');

  // Convert to ES module
  const esmVersion = source.replace(
    /\/\/ === Export for different environments ===[^]*$/,
    'export default TabManager;'
  );

  fs.writeFileSync(distPath, esmVersion);
  console.log('ES Module build completed');
}

module.exports = buildESM;
