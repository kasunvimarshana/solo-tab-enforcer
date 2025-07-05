# Solo Tab Enforcer

A comprehensive Node.js package to prevent users from opening multiple tabs of the same application and observe all tabs. Perfect for web applications that need to maintain single-session integrity.

## Features

- **Single Tab Enforcement**: Prevents multiple tabs of the same application
- **Tab Observation**: Monitor all open tabs of your application
- **React Integration**: Ready-to-use React component
- **Customizable**: Highly configurable with extensive options
- **Cross-browser Support**: Works with all modern browsers
- **TypeScript Support**: Full TypeScript definitions included
- **Multiple Storage Options**: localStorage, sessionStorage, or custom storage
- **Heartbeat System**: Automatic cleanup of dead tabs
- **Event-driven**: Rich callback system for custom behavior

## Installation

```bash
npm install solo-tab-enforcer
```

## Quick Start

### Basic Usage

```javascript
import { SoloTabEnforcer } from 'solo-tab-enforcer';

const enforcer = new SoloTabEnforcer({
  appId: 'my-app',
  onDuplicateTab: (tabId) => {
    console.log('Duplicate tab detected:', tabId);
  },
});

enforcer.start();
```

### React Integration

```jsx
import React from 'react';
import { ReactSoloTabEnforcer } from 'solo-tab-enforcer';

function App() {
  return (
    <ReactSoloTabEnforcer
      appId='my-app'
      warningMessage='Please use only one tab for this application'
    >
      <div>Your app content here</div>
    </ReactSoloTabEnforcer>
  );
}
```

### Tab Observation

```javascript
import { TabObserver } from 'solo-tab-enforcer';

const observer = new TabObserver({
  appId: 'my-app',
  onTabAdded: (tabId, tabInfo) => {
    console.log('New tab opened:', tabId, tabInfo);
  },
  onTabRemoved: (tabId) => {
    console.log('Tab closed:', tabId);
  },
  onTabsChanged: (tabs) => {
    console.log('All tabs:', tabs);
  },
});

observer.start();
```

## API Reference

### SoloTabEnforcer

#### Constructor Options

- `appId` (string): Unique identifier for your application
- `storageKey` (string): Custom storage key prefix
- `checkInterval` (number): Interval for checking tab status (ms)
- `onDuplicateTab` (function): Callback when duplicate tab is detected
- `onTabBecomeActive` (function): Callback when tab becomes active
- `onTabDestroyed` (function): Callback when tab is destroyed
- `autoRedirect` (boolean): Automatically redirect duplicate tabs
- `redirectUrl` (string): URL to redirect duplicate tabs to
- `warningMessage` (string): Message to show for duplicate tabs
- `debugMode` (boolean): Enable debug logging
- `customStorage` (Storage): Custom storage implementation
- `heartbeatInterval` (number): Heartbeat interval (ms)
- `tabTimeout` (number): Tab timeout threshold (ms)

#### Methods

- `start()`: Start the enforcer
- `stop()`: Stop the enforcer
- `destroy()`: Destroy the enforcer and cleanup
- `isCurrentTabActive()`: Check if current tab is active
- `getCurrentTabId()`: Get current tab ID
- `getActiveTabs()`: Get all active tabs
- `forceActivateTab()`: Force activate current tab

### TabObserver

#### Constructor Options

- `appId` (string): Unique identifier for your application
- `storageKey` (string): Custom storage key prefix
- `onTabAdded` (function): Callback when new tab is added
- `onTabRemoved` (function): Callback when tab is removed
- `onTabsChanged` (function): Callback when tabs change
- `checkInterval` (number): Interval for checking tabs (ms)
- `debugMode` (boolean): Enable debug logging
- `customStorage` (Storage): Custom storage implementation
- `heartbeatInterval` (number): Heartbeat interval (ms)
- `tabTimeout` (number): Tab timeout threshold (ms)

#### Methods

- `start()`: Start the observer
- `stop()`: Stop the observer
- `destroy()`: Destroy the observer and cleanup
- `getAllTabs()`: Get all tabs
- `getTabById(tabId)`: Get specific tab by ID
- `removeTab(tabId)`: Remove specific tab

### ReactSoloTabEnforcer

#### Props

All SoloTabEnforcer options plus:

- `children` (ReactNode): Child components to render
- `fallbackComponent` (Component): Custom component for duplicate tab warning

## Advanced Usage

### Custom Storage

```javascript
import { SoloTabEnforcer } from 'solo-tab-enforcer';

// Custom storage implementation
class CustomStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

const enforcer = new SoloTabEnforcer({
  appId: 'my-app',
  customStorage: new CustomStorage(),
});
```

### Multiple App Instances

```javascript
import { SoloTabEnforcer } from 'solo-tab-enforcer';

// Different apps can coexist
const userPortalEnforcer = new SoloTabEnforcer({
  appId: 'user-portal',
  storageKey: 'user-portal-enforcer',
});

const adminPanelEnforcer = new SoloTabEnforcer({
  appId: 'admin-panel',
  storageKey: 'admin-panel-enforcer',
});
```

### Custom React Fallback

```jsx
import React from 'react';
import { ReactSoloTabEnforcer } from 'solo-tab-enforcer';

const CustomFallback = ({ tabId, message }) => (
  <div className='duplicate-tab-warning'>
    <h2>Oops! Multiple Tabs Detected</h2>
    <p>{message}</p>
    <button onClick={() => window.close()}>Close This Tab</button>
  </div>
);

function App() {
  return (
    <ReactSoloTabEnforcer
      appId='my-app'
      fallbackComponent={CustomFallback}
      warningMessage='This app is already running in another tab'
    >
      <YourAppContent />
    </ReactSoloTabEnforcer>
  );
}
```

### Event Handling

```javascript
import { SoloTabEnforcer, TabObserver } from 'solo-tab-enforcer';

// Comprehensive event handling
const enforcer = new SoloTabEnforcer({
  appId: 'my-app',
  debugMode: true,
  onDuplicateTab: (tabId) => {
    console.log('Duplicate tab detected:', tabId);
    // Send analytics event
    analytics.track('duplicate_tab_detected', { tabId });
  },
  onTabBecomeActive: (tabId) => {
    console.log('Tab became active:', tabId);
    // Resume app state
    resumeAppState();
  },
  onTabDestroyed: (tabId) => {
    console.log('Tab destroyed:', tabId);
    // Cleanup resources
    cleanupResources(tabId);
  },
});

// Tab observation with detailed monitoring
const observer = new TabObserver({
  appId: 'my-app',
  debugMode: true,
  onTabAdded: (tabId, tabInfo) => {
    console.log('New tab:', tabInfo);
    updateTabCounter();
  },
  onTabRemoved: (tabId) => {
    console.log('Tab removed:', tabId);
    updateTabCounter();
  },
  onTabsChanged: (tabs) => {
    console.log('Active tabs:', tabs.length);
    displayTabInfo(tabs);
  },
});
```

### Server-Side Integration

```javascript
// Express.js middleware example
const express = require('express');
const { SoloTabEnforcer } = require('solo-tab-enforcer');

const app = express();

// Middleware to inject tab enforcer
app.use('/protected', (req, res, next) => {
  const enforcerScript = `
    <script>
      import { SoloTabEnforcer } from '/node_modules/solo-tab-enforcer/index.esm.js';
      const enforcer = new SoloTabEnforcer({
        appId: '${req.sessionID}',
        onDuplicateTab: () => {
          window.location.href = '/duplicate-session';
        }
      });
      enforcer.start();
    </script>
  `;
  res.locals.enforcerScript = enforcerScript;
  next();
});
```

### Testing

```javascript
// Jest test example
import { SoloTabEnforcer } from 'solo-tab-enforcer';

describe('SoloTabEnforcer', () => {
  let enforcer;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      data: new Map(),
      getItem: jest.fn((key) => mockStorage.data.get(key) || null),
      setItem: jest.fn((key, value) => mockStorage.data.set(key, value)),
      removeItem: jest.fn((key) => mockStorage.data.delete(key)),
    };

    enforcer = new SoloTabEnforcer({
      appId: 'test-app',
      customStorage: mockStorage,
      debugMode: true,
    });
  });

  afterEach(() => {
    enforcer.destroy();
  });

  test('should register tab on start', () => {
    enforcer.start();
    expect(mockStorage.setItem).toHaveBeenCalled();
    expect(enforcer.isCurrentTabActive()).toBe(true);
  });

  test('should detect duplicate tabs', (done) => {
    const onDuplicateTab = jest.fn((tabId) => {
      expect(tabId).toBe(enforcer.getCurrentTabId());
      done();
    });

    enforcer.options.onDuplicateTab = onDuplicateTab;
    enforcer.start();

    // Simulate another tab
    const anotherTab = new SoloTabEnforcer({
      appId: 'test-app',
      customStorage: mockStorage,
    });
    anotherTab.start();
  });
});
```

## Configuration Examples

### Production Configuration

```javascript
const enforcer = new SoloTabEnforcer({
  appId: 'production-app',
  storageKey: 'prod-tab-enforcer',
  checkInterval: 2000,
  heartbeatInterval: 10000,
  tabTimeout: 60000,
  autoRedirect: true,
  redirectUrl: '/session-conflict',
  debugMode: false,
  onDuplicateTab: (tabId) => {
    // Log to monitoring service
    logger.warn('Duplicate tab detected', {
      tabId,
      userAgent: navigator.userAgent,
    });
  },
});
```

### Development Configuration

```javascript
const enforcer = new SoloTabEnforcer({
  appId: 'dev-app',
  storageKey: 'dev-tab-enforcer',
  checkInterval: 500,
  heartbeatInterval: 2000,
  tabTimeout: 10000,
  autoRedirect: false,
  debugMode: true,
  onDuplicateTab: (tabId) => {
    console.warn('DEV: Duplicate tab detected', tabId);
  },
});
```

## Browser Compatibility

| Browser | Version | Support    |
| ------- | ------- | ---------- |
| Chrome  | 45+     | ✅ Full    |
| Firefox | 40+     | ✅ Full    |
| Safari  | 9+      | ✅ Full    |
| Edge    | 12+     | ✅ Full    |
| IE      | 11+     | ⚠️ Partial |

## Performance Considerations

- **Memory Usage**: Minimal overhead (~2KB per tab)
- **Storage Impact**: Uses localStorage efficiently with automatic cleanup
- **CPU Usage**: Low impact with configurable check intervals
- **Network**: No network requests required

## Security Features

- **Cross-tab Communication**: Secure localStorage-based messaging
- **Session Isolation**: Each app instance is isolated by appId
- **Tamper Detection**: Validates tab integrity with heartbeat system
- **Cleanup**: Automatic cleanup of expired tabs

## Troubleshooting

### Common Issues

1. **Storage Not Available**

   ```javascript
   // Check storage availability
   if (typeof Storage !== 'undefined') {
     // Storage is available
   } else {
     // Use custom storage or disable enforcer
   }
   ```

2. **Multiple Apps Conflict**

   ```javascript
   // Use unique appId for each application
   const enforcer = new SoloTabEnforcer({
     appId: 'unique-app-identifier-v1.0',
   });
   ```

3. **React Hydration Issues**

   ```jsx
   // Use dynamic import for SSR
   import dynamic from 'next/dynamic';

   const SoloTabEnforcer = dynamic(
     () => import('solo-tab-enforcer').then((mod) => mod.ReactSoloTabEnforcer),
     { ssr: false }
   );
   ```

### Debug Mode

Enable debug mode to see detailed logs:

```javascript
const enforcer = new SoloTabEnforcer({
  appId: 'my-app',
  debugMode: true,
});
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0

- Initial release
- Single tab enforcement
- Tab observation
- React integration
- TypeScript support
- Comprehensive test suite

## Support

For issues and questions:

- GitHub Issues: [Create an issue](https://github.com/kasunvimarshana/solo-tab-enforcer/issues)
- Documentation: [Full documentation](https://github.com/kasunvimarshana/solo-tab-enforcer/wiki)

---

**Solo Tab Enforcer** - Maintain application integrity with intelligent tab management.
