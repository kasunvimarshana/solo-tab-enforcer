// CommonJS build
const fs = require('fs');
const path = require('path');

function buildCJS() {
  console.log('Building CommonJS version...');

  const srcPath = path.join(__dirname, '../src/tab-manager.js');
  const distPath = path.join(__dirname, '../dist/tab-manager.js');

  // Ensure dist directory exists
  const distDir = path.dirname(distPath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Read source file
  let source = fs.readFileSync(srcPath, 'utf8');

  // Add CommonJS wrapper
  const cjsWrapper = `
// CommonJS build
(function(global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        global.TabManager = factory();
    }
})(typeof window !== 'undefined' ? window : this, function() {
    'use strict';
    
    ${source.replace(/^.*?class TabManager/, 'class TabManager')}
    
    return TabManager;
});
`;

  fs.writeFileSync(distPath, cjsWrapper);
  console.log('CommonJS build completed');
}

module.exports = buildCJS;