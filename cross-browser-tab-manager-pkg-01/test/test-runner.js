// Node.js test runner
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('Running tests...\n');

    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.fn();
        console.log(`✓ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
        this.errors.push({ test: test.name, error });
      }
      console.log('');
    }

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(({ test, error }) => {
        console.log(`  ${test}: ${error.message}`);
      });
    }

    console.log('='.repeat(50));

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Mock DOM environment for Node.js testing
function createMockDOM() {
  global.window = {
    location: {
      href: 'http://localhost:3000/test',
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    close: () => {},
  };

  global.document = {
    hidden: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  global.navigator = {
    userAgent: 'Mozilla/5.0 (Node.js Test Environment)',
  };

  global.localStorage = {
    items: {},
    setItem(key, value) {
      this.items[key] = value;
    },
    getItem(key) {
      return this.items[key] || null;
    },
    removeItem(key) {
      delete this.items[key];
    },
    clear() {
      this.items = {};
    },
  };

  global.sessionStorage = {
    items: {},
    setItem(key, value) {
      this.items[key] = value;
    },
    getItem(key) {
      return this.items[key] || null;
    },
    removeItem(key) {
      delete this.items[key];
    },
    clear() {
      this.items = {};
    },
  };

  global.BroadcastChannel = class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
  };

  global.SharedWorker = class MockSharedWorker {
    constructor(script) {
      this.port = {
        postMessage: () => {},
        onmessage: null,
      };
    }
  };
}

// Test suite
async function runTests() {
  createMockDOM();

  // Load the TabManager class
  const TabManager = require('../src/tab-manager.js');

  const runner = new TestRunner();

  // Test 1: Basic initialization
  runner.test('TabManager initialization', () => {
    const manager = new TabManager();

    if (!manager.tabId) {
      throw new Error('Tab ID not generated');
    }

    if (!manager.config) {
      throw new Error('Configuration not initialized');
    }

    if (typeof manager.init !== 'function') {
      throw new Error('Init method not available');
    }
  });

  // Test 2: Configuration handling
  runner.test('Configuration handling', () => {
    const customConfig = {
      enforceSingleTab: false,
      heartbeatInterval: 2000,
      debugMode: true,
    };

    const manager = new TabManager(customConfig);

    if (manager.config.enforceSingleTab !== false) {
      throw new Error('Custom config not applied');
    }

    if (manager.config.heartbeatInterval !== 2000) {
      throw new Error('Custom heartbeat interval not set');
    }

    if (manager.config.debugMode !== true) {
      throw new Error('Debug mode not enabled');
    }
  });

  // Test 3: Tab ID generation
  runner.test('Tab ID generation', () => {
    const manager1 = new TabManager();
    const manager2 = new TabManager();

    if (manager1.tabId === manager2.tabId) {
      throw new Error('Tab IDs should be unique');
    }

    if (!manager1.tabId.startsWith('tab_')) {
      throw new Error('Tab ID format incorrect');
    }
  });

  // Test 4: Storage abstraction
  runner.test('Storage abstraction', () => {
    const manager = new TabManager();

    const testKey = 'test_key';
    const testValue = { test: 'value', number: 42 };

    const setResult = manager.setStorageItem(testKey, testValue);
    if (!setResult) {
      throw new Error('Failed to set storage item');
    }

    const getValue = manager.getStorageItem(testKey);
    if (!getValue || getValue.test !== 'value' || getValue.number !== 42) {
      throw new Error('Failed to retrieve storage item');
    }

    const removeResult = manager.removeStorageItem(testKey);
    if (!removeResult) {
      throw new Error('Failed to remove storage item');
    }

    const removedValue = manager.getStorageItem(testKey);
    if (removedValue !== null) {
      throw new Error('Storage item not properly removed');
    }
  });

  // Test 5: Browser detection
  runner.test('Browser detection', () => {
    const manager = new TabManager();

    if (!manager.browserInfo) {
      throw new Error('Browser info not detected');
    }

    if (!manager.browserInfo.name) {
      throw new Error('Browser name not detected');
    }

    if (typeof manager.browserInfo.version !== 'number') {
      throw new Error('Browser version not detected');
    }

    if (typeof manager.browserInfo.isLegacy !== 'boolean') {
      throw new Error('Legacy browser flag not set');
    }
  });

  // Test 6: Storage support detection
  runner.test('Storage support detection', () => {
    const manager = new TabManager();

    if (!manager.storageSupport) {
      throw new Error('Storage support not detected');
    }

    if (typeof manager.storageSupport.localStorage !== 'boolean') {
      throw new Error('localStorage support not detected');
    }

    if (typeof manager.storageSupport.sessionStorage !== 'boolean') {
      throw new Error('sessionStorage support not detected');
    }
  });

  // Test 7: Observer pattern
  runner.test('Observer pattern', () => {
    const manager = new TabManager();
    let observerCalled = false;
    let observedEvent = null;
    let observedData = null;

    const observer = (event, data) => {
      observerCalled = true;
      observedEvent = event;
      observedData = data;
    };

    const added = manager.addObserver(observer);
    if (!added) {
      throw new Error('Failed to add observer');
    }

    // Trigger notification
    manager.notifyObservers('test', { message: 'test data' });

    if (!observerCalled) {
      throw new Error('Observer not called');
    }

    if (observedEvent !== 'test') {
      throw new Error('Observer received wrong event');
    }

    if (!observedData || observedData.message !== 'test data') {
      throw new Error('Observer received wrong data');
    }

    const removed = manager.removeObserver(observer);
    if (!removed) {
      throw new Error('Failed to remove observer');
    }
  });

  // Test 8: Tab information
  runner.test('Tab information', () => {
    const manager = new TabManager();
    const tabInfo = manager.getTabInfo();

    if (!tabInfo) {
      throw new Error('Tab info not available');
    }

    if (!tabInfo.tabId) {
      throw new Error('Tab ID not in info');
    }

    if (typeof tabInfo.isActive !== 'boolean') {
      throw new Error('Active status not in info');
    }

    if (!tabInfo.url) {
      throw new Error('URL not in info');
    }

    if (typeof tabInfo.timestamp !== 'number') {
      throw new Error('Timestamp not in info');
    }
  });

  // Test 9: Configuration updates
  runner.test('Configuration updates', () => {
    const manager = new TabManager();
    const originalInterval = manager.config.heartbeatInterval;

    manager.updateConfig({ heartbeatInterval: 3000 });

    if (manager.config.heartbeatInterval !== 3000) {
      throw new Error('Configuration not updated');
    }

    // Ensure other configs remain unchanged
    if (manager.config.enforceSingleTab !== true) {
      throw new Error('Other configuration changed unexpectedly');
    }
  });

  // Test 10: Factory methods
  runner.test('Factory methods', () => {
    const enforcer = TabManager.createSingleTabEnforcer();
    if (!enforcer.config.enforceSingleTab) {
      throw new Error('Single tab enforcer not configured correctly');
    }
    if (enforcer.config.observeAllTabs) {
      throw new Error('Observer should be disabled for enforcer');
    }

    const observer = TabManager.createTabObserver();
    if (observer.config.enforceSingleTab) {
      throw new Error('Enforcement should be disabled for observer');
    }
    if (!observer.config.observeAllTabs) {
      throw new Error('Observer not configured correctly');
    }

    const fullManager = TabManager.createFullManager();
    if (!fullManager.config.enforceSingleTab) {
      throw new Error('Full manager enforcement not enabled');
    }
    if (!fullManager.config.observeAllTabs) {
      throw new Error('Full manager observation not enabled');
    }
  });

  // Test 11: Cleanup
  runner.test('Cleanup functionality', () => {
    const manager = new TabManager();

    // Set up some state
    manager.setStorageItem('test_cleanup', 'test_value');

    // Add observer
    const observer = () => {};
    manager.addObserver(observer);

    // Cleanup
    manager.cleanup();

    // Verify cleanup
    if (manager.heartbeatTimer !== null) {
      throw new Error('Heartbeat timer not cleared');
    }

    if (manager.cleanupTimer !== null) {
      throw new Error('Cleanup timer not cleared');
    }

    if (manager.observers.size !== 0) {
      throw new Error('Observers not cleared');
    }
  });

  // Test 12: Error handling
  runner.test('Error handling', () => {
    const manager = new TabManager({ debugMode: true });
    let errorObserved = false;

    manager.addObserver((event, data) => {
      if (event === 'error') {
        errorObserved = true;
      }
    });

    // Trigger error
    manager.handleError('Test error', new Error('Test error message'));

    if (!errorObserved) {
      throw new Error('Error not properly handled');
    }
  });

  await runner.run();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, TestRunner };
