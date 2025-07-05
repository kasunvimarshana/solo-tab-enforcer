const TabObserver = require('../src/TabObserver');
const SoloTabEnforcer = require('../src/SoloTabEnforcer');

// Mock global objects for TabObserver tests
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

describe('TabObserver', () => {
  let observer;
  let mockStorage;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStorage = {
      data: new Map(),
      getItem: jest.fn((key) => mockStorage.data.get(key) || null),
      setItem: jest.fn((key, value) => mockStorage.data.set(key, value)),
      removeItem: jest.fn((key) => mockStorage.data.delete(key)),
    };

    observer = new TabObserver({
      appId: 'test-app',
      customStorage: mockStorage,
      debugMode: true,
      checkInterval: 100,
    });
  });

  afterEach(() => {
    if (observer) {
      observer.destroy();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const defaultObserver = new TabObserver();
      expect(defaultObserver.options.appId).toBe('default-app');
      expect(defaultObserver.options.checkInterval).toBe(2000);
      defaultObserver.destroy();
    });

    test('should merge custom options', () => {
      expect(observer.options.appId).toBe('test-app');
      expect(observer.options.checkInterval).toBe(100);
    });
  });

  describe('Tab Observation', () => {
    test('should detect new tabs', (done) => {
      const onTabAdded = jest.fn((tabId, tabInfo) => {
        expect(tabId).toBeDefined();
        expect(tabInfo).toHaveProperty('id');
        expect(tabInfo).toHaveProperty('url');
        enforcer.destroy();
        done();
      });

      observer.options.onTabAdded = onTabAdded;
      observer.start();

      // Create a new tab with matching storage key
      const enforcer = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        storageKey: 'tab-observer', // Use same storage key as observer
      });

      setTimeout(() => {
        enforcer.start();
      }, 50);
    });

    test('should detect removed tabs', (done) => {
      const onTabRemoved = jest.fn((tabId) => {
        expect(tabId).toBeDefined();
        done();
      });

      observer.options.onTabRemoved = onTabRemoved;
      observer.start();

      // Create and destroy a tab
      const enforcer = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        storageKey: 'tab-observer',
      });

      enforcer.start();

      setTimeout(() => {
        enforcer.destroy();
      }, 150);
    }, 10000);

    test('should track tab changes', (done) => {
      const onTabsChanged = jest.fn((tabs) => {
        // Should be called when tabs change
        if (onTabsChanged.mock.calls.length > 0) {
          done();
        }
      });

      observer.options.onTabsChanged = onTabsChanged;
      observer.start();

      // Add a tab to trigger the change
      const enforcer = new SoloTabEnforcer({
        appId: 'test-app',
        customStorage: mockStorage,
        storageKey: 'tab-observer',
      });

      setTimeout(() => {
        enforcer.start();
        setTimeout(() => {
          enforcer.destroy();
        }, 100);
      }, 50);
    });
  });

  describe('Tab Management', () => {
    test('should get all tabs', () => {
      // Add some test tabs
      const tabs = {
        'tab-1': {
          id: 'tab-1',
          lastHeartbeat: Date.now(),
          isActive: true,
        },
        'tab-2': {
          id: 'tab-2',
          lastHeartbeat: Date.now(),
          isActive: false,
        },
      };

      mockStorage.data.set('tab-observer-test-app', JSON.stringify(tabs));

      const allTabs = observer.getAllTabs();
      expect(allTabs).toHaveLength(2);
    });

    test('should get tab by ID', () => {
      const tabs = {
        'tab-1': {
          id: 'tab-1',
          lastHeartbeat: Date.now(),
          isActive: true,
        },
      };

      mockStorage.data.set('tab-observer-test-app', JSON.stringify(tabs));

      const tab = observer.getTabById('tab-1');
      expect(tab).toBeDefined();
      expect(tab.id).toBe('tab-1');

      const nonExistentTab = observer.getTabById('non-existent');
      expect(nonExistentTab).toBeNull();
    });

    test('should remove tab', () => {
      const tabs = {
        'tab-1': {
          id: 'tab-1',
          lastHeartbeat: Date.now(),
          isActive: true,
        },
      };

      mockStorage.data.set('tab-observer-test-app', JSON.stringify(tabs));

      const result = observer.removeTab('tab-1');
      expect(result).toBe(true);

      const updatedTabs = observer.getAllTabs();
      expect(updatedTabs).toHaveLength(0);
    });
  });

  describe('Static Methods', () => {
    test('should create instance with static create method', () => {
      const staticObserver = TabObserver.create({
        appId: 'static-test',
        customStorage: mockStorage,
      });

      expect(staticObserver).toBeInstanceOf(TabObserver);
      expect(staticObserver.options.appId).toBe('static-test');

      staticObserver.destroy();
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

      const errorObserver = new TabObserver({
        appId: 'error-test',
        customStorage: errorStorage,
        debugMode: true,
      });

      expect(() => errorObserver.start()).not.toThrow();

      errorObserver.destroy();
    });

    test('should handle missing storage', () => {
      const noStorageObserver = new TabObserver({
        appId: 'no-storage-test',
        customStorage: null,
      });

      expect(() => noStorageObserver.start()).not.toThrow();
    });
  });
});
