# Solo Tab Enforcer

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
```bash
npm install solo-tab-enforcer
```

### Direct Download
```html
<script src="https://unpkg.com/solo-tab-enforcer/dist/solo-tab-enforcer.min.js"></script>
```

## Quick Start

```javascript
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
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storageKey` | string | 'solo-tab-enforcer' | Storage key for tab coordination |
| `checkInterval` | number | 1000 | Interval for conflict checking (ms) |
| `warningMessage` | string | 'Another tab is already open...' | Default warning message |
| `redirectUrl` | string | null | URL to redirect conflicting tabs |
| `allowMultipleTabs` | boolean | false | Allow multiple tabs globally |
| `debug` | boolean | false | Enable debug logging |
| `onTabConflict` | function | null | Callback when tab conflict occurs |
| `onTabActivated` | function | null | Callback when tab becomes active |
| `onTabDeactivated` | function | null | Callback when tab becomes inactive |
| `useVisibilityAPI` | boolean | true | Use Page Visibility API |
| `useBroadcastChannel` | boolean | true | Use BroadcastChannel API |
| `useStorageEvents` | boolean | true | Use storage events |
| `tabTimeoutMs` | number | 5000 | Tab timeout for cleanup (ms) |

## API Reference

### Methods

#### `init()`
Initialize the tab enforcer. Must be called after instantiation.

#### `destroy()`
Destroy the enforcer and clean up resources.

#### `getTabInfo()`
Get detailed information about the current tab.

#### `areMultipleTabsAllowed()`
Check if multiple tabs are currently allowed.

#### `allowMultipleTabs()`
Enable multiple tabs (disable enforcement).

#### `disallowMultipleTabs()`
Disable multiple tabs (enable enforcement).

#### `forceRegister()`
Force register the current tab (useful for recovery).

### Static Methods

#### `SoloTabEnforcer.create(options)`
Create a new instance with options.

#### `SoloTabEnforcer.createAndInit(options)`
Create and immediately initialize an instance.

#### `SoloTabEnforcer.checkSupport()`
Check browser feature support.

#### `SoloTabEnforcer.getBrowserInfo()`
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
```javascript
const enforcer = new SoloTabEnforcer({
  debug: true,
  onTabConflict: () => {
    alert('Another tab is already open!');
    window.close();
  }
});

enforcer.init();
```

### Advanced Configuration
```javascript
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
```

### Conditional Enforcement
```javascript
const enforcer = new SoloTabEnforcer();

// Enable enforcement only for certain users
if (user.requiresSingleTab) {
  enforcer.disallowMultipleTabs();
} else {
  enforcer.allowMultipleTabs();
}

enforcer.init();
```

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
