const SoloTabEnforcer = require('../src/SoloTabEnforcer');

// Mock DOM environment
const mockStorage = {
  data: new Map(),
  getItem: jest.fn((key) => mockStorage.data.get(key) || null),
  setItem: jest.fn((key, value) => mockStorage.data.set(key, value)),
  removeItem: jest.fn((key) => mockStorage.data.delete(key)),
};

// Mock window.location with proper navigation handling
const mockLocation = {
  href: 'http://localhost:3000',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock alert function
const mockAlert = jest.fn();

// Mock global objects
global.localStorage = mockStorage;
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: mockLocation,
  alert: mockAlert,
};

// Override window.alert in JSDOM environment
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
  configurable: true,
});

global.document = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  title: 'Test Page',
  visibilityState: 'visible',
};
global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
};

// Store original methods for restoration
const originalShowWarningMessage = SoloTabEnforcer.prototype.showWarningMessage;
const originalRedirectToDuplicateWarning =
  SoloTabEnforcer.prototype.redirectToDuplicateWarning;

// Override the methods to use our mocks properly
SoloTabEnforcer.prototype.showWarningMessage = function () {
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(this.options.warningMessage);
  }
};

SoloTabEnforcer.prototype.redirectToDuplicateWarning = function () {
  if (typeof window !== 'undefined' && window.location) {
    // Instead of actually navigating, just set the href property
    mockLocation.href = this.options.redirectUrl;
  }
};

describe('SoloTabEnforcer', () => {
  let enforcer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.data.clear();
    mockLocation.href = 'http://localhost:3000';
    mockAlert.mockClear();

    enforcer = new SoloTabEnforcer({
      appId: 'test-app',
      customStorage: mockStorage,
      debugMode: true,
      checkInterval: 100,
      heartbeatInterval: 200,
    });
  });

  afterEach(() => {
    if (enforcer) {
      enforcer.destroy();
    }
  });

  afterAll(() => {
    // Restore original methods
    SoloTabEnforcer.prototype.showWarningMessage = originalShowWarningMessage;
    SoloTabEnforcer.prototype.redirectToDuplicateWarning =
      originalRedirectToDuplicateWarning;
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const defaultEnforcer = new SoloTabEnforcer();
      expect(defaultEnforcer.options.appId).toBe('default-app');
      expect(defaultEnforcer.options.checkInterval).toBe(1000);
      defaultEnforcer.destroy();
    });

    test('should merge custom options with defaults', () => {
      expect(enforcer.options.appId).toBe('test-app');
      expect(enforcer.options.checkInterval).toBe(100);
      expect(enforcer.options.debugMode).toBe(true);
    });

    test('should generate unique tab ID', () => {
      expect(enforcer.tabId).toMatch(/^tab-\d+-[a-z0-9]+$/);
    });
  });

  describe('Tab Registration', () => {
    test('should register tab on start', () => {
      enforcer.start();

      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(enforcer.isCurrentTabActive()).toBe(true);
    });

    test('should create tab data with correct structure', () => {
      enforcer.start();

      const tabs = enforcer.getTabsFromStorage();
      const tabData = tabs[enforcer.tabId];

      expect(tabData).toHaveProperty('id');
      expect(tabData).toHaveProperty('url');
      expect(tabData).toHaveProperty('title');
      expect(tabData).toHaveProperty('timestamp');
      expect(tabData).toHaveProperty('lastHeartbeat');
      expect(tabData).toHaveProperty('isActive');
      expect(tabData).toHaveProperty('userAgent');
      expect(tabData).toHaveProperty('sessionId');
    });
  });

  describe('Duplicate Tab Detection', () => {
    test('should detect duplicate tabs', (done) => {
      const onDuplicateTab = jest.fn((tabId) => {
        expect(tabId).toBe(secondEnforcer.tabId);
        secondEnforcer.destroy();
        done();
      });

      enforcer.start();

      const secondEnforcer = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        onDuplicateTab,
        checkInterval: 50,
        autoRedirect: false, // Disable redirect for testing
      });

      secondEnforcer.start();
    });

    test('should handle multiple duplicate tabs', (done) => {
      const onDuplicateTab = jest.fn();

      enforcer.start();

      const enforcers = [];
      for (let i = 0; i < 3; i++) {
        const newEnforcer = new SoloTabEnforcer({
          appId: 'test-app',
          customStorage: mockStorage,
          onDuplicateTab,
          checkInterval: 50,
          autoRedirect: false,
        });
        newEnforcer.start();
        enforcers.push(newEnforcer);
      }

      setTimeout(() => {
        expect(onDuplicateTab).toHaveBeenCalledTimes(3);
        enforcers.forEach((e) => e.destroy());
        done();
      }, 200);
    });

    test('should redirect on duplicate tab when autoRedirect is true', (done) => {
      const enforcerWithRedirect = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        autoRedirect: true,
        redirectUrl: '/duplicate-warning',
        checkInterval: 50,
      });

      enforcer.start();
      enforcerWithRedirect.start();

      // Check that location.href would be set
      setTimeout(() => {
        expect(mockLocation.href).toBe('/duplicate-warning');
        enforcerWithRedirect.destroy();
        done();
      }, 150);
    });

    test('should show warning when autoRedirect is false', (done) => {
      const enforcerWithWarning = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        autoRedirect: false,
        checkInterval: 50, // Faster check interval
      });

      enforcer.start();

      // Wait a bit for the first enforcer to be fully registered
      setTimeout(() => {
        enforcerWithWarning.start();

        // Check after allowing time for duplicate detection
        setTimeout(() => {
          expect(mockAlert).toHaveBeenCalled();
          enforcerWithWarning.destroy();
          done();
        }, 150);
      }, 50);
    }, 10000); // Increased timeout for this test
  });

  describe('Tab Cleanup', () => {
    test('should remove tab on destroy', () => {
      enforcer.start();
      const tabId = enforcer.tabId;

      enforcer.destroy();

      const tabs = enforcer.getTabsFromStorage();
      expect(tabs[tabId]).toBeUndefined();
    });

    test('should cleanup expired tabs', (done) => {
      enforcer.options.tabTimeout = 50;
      enforcer.start();

      const tabs = enforcer.getTabsFromStorage();
      const expiredTabId = 'expired-tab';
      tabs[expiredTabId] = {
        id: expiredTabId,
        lastHeartbeat: Date.now() - 100,
        isActive: true,
      };
      enforcer.saveTabsToStorage(tabs);

      setTimeout(() => {
        enforcer.checkTabStatus();
        const updatedTabs = enforcer.getTabsFromStorage();
        expect(updatedTabs[expiredTabId]).toBeUndefined();
        done();
      }, 100);
    });
  });

  describe('Static Methods', () => {
    test('should create instance with static create method', () => {
      const staticEnforcer = SoloTabEnforcer.create({
        appId: 'static-test',
        customStorage: mockStorage,
      });

      expect(staticEnforcer).toBeInstanceOf(SoloTabEnforcer);
      expect(staticEnforcer.options.appId).toBe('static-test');

      staticEnforcer.destroy();
    });
  });

  describe('Force Activation', () => {
    test('should force activate tab', () => {
      enforcer.start();
      enforcer.isActive = false;

      enforcer.forceActivateTab();

      expect(enforcer.isActive).toBe(true);
      expect(enforcer.isCurrentTabActive()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', () => {
      const errorStorage = {
        getItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
        setItem: jest.fn(() => {
          throw new Error('Storage error');
        }),
        removeItem: jest.fn(),
      };

      const errorEnforcer = new SoloTabEnforcer({
        appId: 'error-test',
        customStorage: errorStorage,
        debugMode: true,
      });

      expect(() => errorEnforcer.start()).not.toThrow();

      errorEnforcer.destroy();
    });

    test('should handle missing storage', () => {
      const noStorageEnforcer = new SoloTabEnforcer({
        appId: 'no-storage-test',
        customStorage: null,
      });

      expect(() => noStorageEnforcer.start()).not.toThrow();
    });
  });
});
