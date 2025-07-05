// UMD build
const fs = require('fs');
const path = require('path');

function buildUMD() {
  console.log('Building UMD version...');

  const srcPath = path.join(__dirname, '../src/tab-manager.js');
  const distPath = path.join(__dirname, '../dist/tab-manager.umd.js');

  // Ensure dist directory exists
  const distDir = path.dirname(distPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Read source file
  let source = fs.readFileSync(srcPath, 'utf8');

  // Create UMD wrapper
  const umdWrapper = `
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.TabManager = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';
    
    ${source
      .replace(/^.*?class TabManager/, 'class TabManager')
      .replace(/\/\/ === Export for different environments ===[^]*$/, '')}
    
    return TabManager;
});
`;

  fs.writeFileSync(distPath, umdWrapper);
  console.log('UMD build completed');
}

module.exports = buildUMD;