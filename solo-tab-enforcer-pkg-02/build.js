const fs = require('fs');
const path = require('path');

console.log('🔨 Building Solo Tab Enforcer...\n');

// Read source files
const srcFiles = [
  'src/utils/CrossBrowserCompat.js',
  'src/adapters/BrowserAdapter.js',
  'src/strategies/FallbackStrategy.js',
  'src/core/TabEnforcer.js',
  'src/index.js',
];

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build main distribution file
function buildDistribution() {
  console.log('📦 Building distribution files...');

  const banner = `/**
 * Solo Tab Enforcer - Cross-Browser Tab Management
 * Version: 1.0.1
 * License: MIT
 * 
 * A comprehensive solution for enforcing single tab usage across all browsers.
 * Uses native browser APIs with fallback strategies for maximum compatibility.
 */

`;

  // Build the browser-compatible version
  let browserBundle = banner;
  browserBundle += `(function(global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.SoloTabEnforcer = factory();
  }
}(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  
`;

  // Add all source code with proper module wrapping
  srcFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');

      // Remove require statements and their variable declarations
      content = content.replace(/const\s+\w+\s*=\s*require\([^)]+\);\s*/g, '');
      content = content.replace(/require\([^)]+\)/g, '');

      // Remove module.exports and window assignments at the end of files
      content = content.replace(
        /\/\/\s*Export\s+for\s+different\s+environments[\s\S]*?(?=\/\/|$)/g,
        ''
      );
      content = content.replace(/if\s*\(\s*typeof\s+module[^}]+}\s*$/gm, '');
      content = content.replace(/if\s*\(\s*typeof\s+window[^}]+}\s*$/gm, '');

      browserBundle += `\n  // ${file}\n`;
      browserBundle += content;
      browserBundle += '\n';
    }
  });

  browserBundle += `
  
  return SoloTabEnforcer;
}));`;

  // Write the distribution file
  fs.writeFileSync('dist/solo-tab-enforcer.js', browserBundle);
  console.log('✅ Built dist/solo-tab-enforcer.js');

  // Create minified version (simple minification)
  const minified = browserBundle
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}();,])\s*/g, '$1') // Remove spaces around operators
    .trim();

  fs.writeFileSync('dist/solo-tab-enforcer.min.js', minified);
  console.log('✅ Built dist/solo-tab-enforcer.min.js');
}

// Build TypeScript definitions
function buildTypeDefinitions() {
  console.log('📝 Building TypeScript definitions...');

  const definitions = `
declare module 'solo-tab-enforcer' {
  export interface TabEnforcerOptions {
    storageKey?: string;
    checkInterval?: number;
    warningMessage?: string;
    redirectUrl?: string | null;
    allowMultipleTabs?: boolean;
    debug?: boolean;
    onTabConflict?: (existingTab: any) => void;
    onTabActivated?: () => void;
    onTabDeactivated?: () => void;
    useVisibilityAPI?: boolean;
    useBroadcastChannel?: boolean;
    useStorageEvents?: boolean;
    tabTimeoutMs?: number;
  }

  export interface TabInfo {
    id: string;
    isActive: boolean;
    isInitialized: boolean;
    supportedFeatures: FeatureSupport;
    browserInfo: BrowserInfo;
    options: TabEnforcerOptions;
  }

  export interface BrowserInfo {
    name: string;
    version: string;
  }

  export interface FeatureSupport {
    localStorage: boolean;
    sessionStorage: boolean;
    broadcastChannel: boolean;
    visibilityAPI: boolean;
    storageEvents: boolean;
  }

  export class SoloTabEnforcer {
    constructor(options?: TabEnforcerOptions);
    
    init(): void;
    destroy(): void;
    getTabInfo(): TabInfo;
    areMultipleTabsAllowed(): boolean;
    allowMultipleTabs(): void;
    disallowMultipleTabs(): void;
    forceRegister(): void;
    getSupportedFeatures(): FeatureSupport;
    getBrowserInfo(): BrowserInfo;
    
    static create(options?: TabEnforcerOptions): SoloTabEnforcer;
    static createAndInit(options?: TabEnforcerOptions): SoloTabEnforcer;
    static checkSupport(): FeatureSupport;
    static getBrowserInfo(): BrowserInfo;
  }

  export default SoloTabEnforcer;
}
`;

  fs.writeFileSync('dist/index.d.ts', definitions);
  console.log('✅ Built dist/index.d.ts');
}

// Generate documentation
function generateDocumentation() {
  console.log('📚 Generating documentation...');

  const readme = `# Solo Tab Enforcer

A comprehensive, cross-browser solution for enforcing single tab usage in web applications. Built with pure JavaScript using native browser APIs with intelligent fallback strategies.

## Features

- ✅ **Cross-browser compatibility** - Works in all modern browsers and legacy IE
- 🔧 **Zero dependencies** - Pure JavaScript using native browser APIs
- 🛡️ **Multiple enforcement strategies** - BroadcastChannel, localStorage, visibility API, and fallbacks
- ⚡ **High performance** - Optimized for minimal resource usage
- 🎛️ **Fully configurable** - Extensive options for customization
- 📱 **Mobile support** - Works on mobile browsers and PWAs
- 🔍 **Debug mode** - Comprehensive logging for troubleshooting

## Installation

### NPM
\`\`\`bash
npm install solo-tab-enforcer
\`\`\`

### Direct Download
\`\`\`html
<script src="https://unpkg.com/solo-tab-enforcer/dist/solo-tab-enforcer.min.js"></script>
\`\`\`

## Quick Start

\`\`\`javascript
// Basic usage
const enforcer = new SoloTabEnforcer();
enforcer.init();

// With options
const enforcer = new SoloTabEnforcer({
  debug: true,
  checkInterval: 1000,
  warningMessage: 'Another tab is already open!',
  onTabConflict: (existingTab) => {
    console.log('Conflict with tab:', existingTab.id);
    window.close();
  }
});

enforcer.init();
\`\`\`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`storageKey\` | string | 'solo-tab-enforcer' | Storage key for tab coordination |
| \`checkInterval\` | number | 1000 | Interval for conflict checking (ms) |
| \`warningMessage\` | string | 'Another tab is already open...' | Default warning message |
| \`redirectUrl\` | string | null | URL to redirect conflicting tabs |
| \`allowMultipleTabs\` | boolean | false | Allow multiple tabs globally |
| \`debug\` | boolean | false | Enable debug logging |
| \`onTabConflict\` | function | null | Callback when tab conflict occurs |
| \`onTabActivated\` | function | null | Callback when tab becomes active |
| \`onTabDeactivated\` | function | null | Callback when tab becomes inactive |
| \`useVisibilityAPI\` | boolean | true | Use Page Visibility API |
| \`useBroadcastChannel\` | boolean | true | Use BroadcastChannel API |
| \`useStorageEvents\` | boolean | true | Use storage events |
| \`tabTimeoutMs\` | number | 5000 | Tab timeout for cleanup (ms) |

## API Reference

### Methods

#### \`init()\`
Initialize the tab enforcer. Must be called after instantiation.

#### \`destroy()\`
Destroy the enforcer and clean up resources.

#### \`getTabInfo()\`
Get detailed information about the current tab.

#### \`areMultipleTabsAllowed()\`
Check if multiple tabs are currently allowed.

#### \`allowMultipleTabs()\`
Enable multiple tabs (disable enforcement).

#### \`disallowMultipleTabs()\`
Disable multiple tabs (enable enforcement).

#### \`forceRegister()\`
Force register the current tab (useful for recovery).

### Static Methods

#### \`SoloTabEnforcer.create(options)\`
Create a new instance with options.

#### \`SoloTabEnforcer.createAndInit(options)\`
Create and immediately initialize an instance.

#### \`SoloTabEnforcer.checkSupport()\`
Check browser feature support.

#### \`SoloTabEnforcer.getBrowserInfo()\`
Get browser information.

## Browser Support

| Browser | Version | Status |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full support |
| Firefox | 55+ | ✅ Full support |
| Safari | 10+ | ✅ Full support |
| Edge | 16+ | ✅ Full support |
| IE | 11+ | ⚠️ Fallback mode |

## Examples

### Basic Implementation
\`\`\`javascript
const enforcer = new SoloTabEnforcer({
  debug: true,
  onTabConflict: () => {
    alert('Another tab is already open!');
    window.close();
  }
});

enforcer.init();
\`\`\`

### Advanced Configuration
\`\`\`javascript
const enforcer = new SoloTabEnforcer({
  checkInterval: 500,
  tabTimeoutMs: 10000,
  redirectUrl: '/single-tab-warning.html',
  onTabActivated: () => console.log('Tab activated'),
  onTabDeactivated: () => console.log('Tab deactivated'),
  onTabConflict: (existingTab) => {
    console.log('Conflict with tab:', existingTab);
    // Custom conflict handling
  }
});

enforcer.init();
\`\`\`

### Conditional Enforcement
\`\`\`javascript
const enforcer = new SoloTabEnforcer();

// Enable enforcement only for certain users
if (user.requiresSingleTab) {
  enforcer.disallowMultipleTabs();
} else {
  enforcer.allowMultipleTabs();
}

enforcer.init();
\`\`\`

## How It Works

The Solo Tab Enforcer uses a multi-layered approach:

1. **Primary Strategy**: BroadcastChannel API for modern browsers
2. **Secondary Strategy**: localStorage with storage events
3. **Fallback Strategy**: Polling with various detection methods
4. **Legacy Support**: Cookie-based coordination for older browsers

## Performance

- **Memory Usage**: < 50KB
- **CPU Impact**: Minimal (configurable intervals)
- **Network**: Zero external requests
- **Startup Time**: < 5ms initialization

## Security

- No external dependencies
- No data transmission
- Local storage only
- No cookies (unless fallback)

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please see CONTRIBUTING.md for guidelines.

## Support

For issues and questions, please use the GitHub issue tracker.
`;

  fs.writeFileSync('README.md', readme);
  console.log('✅ Generated README.md');
}

// Create package.json with proper metadata
function updatePackageJson() {
  console.log('📦 Updating package.json...');

  const pkg = {
    name: 'solo-tab-enforcer',
    version: '1.0.1',
    description:
      'Cross-browser solution for enforcing single tab usage in web applications',
    main: 'dist/solo-tab-enforcer.js',
    module: 'src/index.js',
    browser: 'dist/solo-tab-enforcer.min.js',
    types: 'dist/index.d.ts',
    files: ['dist/', 'src/', 'README.md', 'LICENSE'],
    scripts: {
      build: 'node build.js',
      test: 'node test/test.js',
      'test:full': 'FULL_TEST=1 node test/test.js',
      dev: 'node examples/server.js',
      start: 'node examples/server.js',
    },
    keywords: [
      'tab',
      'enforcer',
      'single-tab',
      'browser',
      'cross-browser',
      'session',
      'duplicate',
      'prevention',
      'tab-management',
      'broadcast-channel',
      'localStorage',
      'visibility-api',
    ],
    author: 'Kasun Vimarshana <kasunvmail@gmail.com>',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/kasunvimarshana/solo-tab-enforcer.git',
    },
    bugs: {
      url: 'https://github.com/kasunvimarshana/solo-tab-enforcer/issues',
    },
    homepage: 'https://github.com/kasunvimarshana/solo-tab-enforcer#readme',
    engines: {
      node: '>=14.0.0',
    },
    browserslist: [
      'Chrome >= 60',
      'Firefox >= 55',
      'Safari >= 10',
      'Edge >= 16',
      'ie >= 11',
    ],
    devDependencies: {
      jsdom: '^26.1.0',
    },
  };

  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  console.log('✅ Updated package.json');
}

// Main build process
function main() {
  try {
    buildDistribution();
    buildTypeDefinitions();
    generateDocumentation();
    updatePackageJson();

    console.log('\n🎉 Build completed successfully!');
    console.log('\nGenerated files:');
    console.log('- dist/solo-tab-enforcer.js');
    console.log('- dist/solo-tab-enforcer.min.js');
    console.log('- dist/index.d.ts');
    console.log('- README.md');
    console.log('- package.json');

    console.log('\nTo test the package:');
    console.log('npm test');
    console.log('\nTo start the demo server:');
    console.log('npm run dev');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();
