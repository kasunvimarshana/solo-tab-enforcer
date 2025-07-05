// Simple linter
const fs = require('fs');
const path = require('path');

function lint() {
  console.log('Running linter...');

  const srcPath = path.join(__dirname, '../src/tab-manager.js');
  const source = fs.readFileSync(srcPath, 'utf8');

  const issues = [];

  // Basic checks
  if (
    source.includes('console.log') &&
    !source.includes('this.config.debugMode')
  ) {
    issues.push('Found console.log without debug mode check');
  }

  if (source.includes('alert(') || source.includes('confirm(')) {
    // This is actually used in our code, so we'll check context
    const lines = source.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('alert(') && !line.includes('confirm(')) {
        issues.push(`Line ${index + 1}: Use of alert() detected`);
      }
    });
  }

  if (issues.length > 0) {
    console.log('Linting issues found:');
    issues.forEach((issue) => console.log(`- ${issue}`));
    return false;
  }

  console.log('Linting completed successfully');
  return true;
}

module.exports = lint;