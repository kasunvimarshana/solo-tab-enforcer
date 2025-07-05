const assert = require('assert');
const { JSDOM } = require('jsdom');

// Mock DOM environment
function createMockDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.localStorage = dom.window.localStorage;
  global.BroadcastChannel = dom.window.BroadcastChannel;

  return dom;
}

// Test suite
function runTests() {
  console.log('🧪 Starting Solo Tab Enforcer Tests...\n');

  try {
    // Test 1: Basic instantiation
    testBasicInstantiation();

    // Test 2: Feature detection
    testFeatureDetection();

    // Test 3: Browser information
    testBrowserInformation();

    // Test 4: Tab registration
    testTabRegistration();

    // Test 5: Multiple tabs handling
    testMultipleTabsHandling();

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function testBasicInstantiation() {
  console.log('Testing basic instantiation...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const enforcer = new SoloTabEnforcer({
    debug: true,
    checkInterval: 500,
  });

  assert(enforcer instanceof SoloTabEnforcer, 'Should create instance');
  assert(enforcer.options.debug === true, 'Should set debug option');
  assert(
    enforcer.options.checkInterval === 500,
    'Should set checkInterval option'
  );

  console.log('✅ Basic instantiation test passed');
}

function testFeatureDetection() {
  console.log('Testing feature detection...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const features = SoloTabEnforcer.checkSupport();

  assert(typeof features === 'object', 'Should return object');
  assert(
    typeof features.localStorage === 'boolean',
    'Should have localStorage property'
  );
  assert(
    typeof features.broadcastChannel === 'boolean',
    'Should have broadcastChannel property'
  );
  assert(
    typeof features.visibilityAPI === 'boolean',
    'Should have visibilityAPI property'
  );

  console.log('✅ Feature detection test passed');
}

function testBrowserInformation() {
  console.log('Testing browser information...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const browserInfo = SoloTabEnforcer.getBrowserInfo();

  assert(typeof browserInfo === 'object', 'Should return object');
  assert(typeof browserInfo.name === 'string', 'Should have name property');
  assert(
    typeof browserInfo.version === 'string',
    'Should have version property'
  );

  console.log('✅ Browser information test passed');
}

function testTabRegistration() {
  console.log('Testing tab registration...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const enforcer = new SoloTabEnforcer({
    debug: false,
    allowMultipleTabs: false,
  });

  enforcer.init();

  const tabInfo = enforcer.getTabInfo();
  assert(typeof tabInfo.id === 'string', 'Should have tab ID');
  assert(tabInfo.isInitialized === true, 'Should be initialized');

  console.log('✅ Tab registration test passed');
}

function testMultipleTabsHandling() {
  console.log('Testing multiple tabs handling...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const enforcer = new SoloTabEnforcer({
    allowMultipleTabs: true,
  });

  enforcer.init();

  // Test allowing multiple tabs
  enforcer.allowMultipleTabs();
  assert(enforcer.areMultipleTabsAllowed(), 'Should allow multiple tabs');

  // Test disallowing multiple tabs
  enforcer.disallowMultipleTabs();
  assert(!enforcer.areMultipleTabsAllowed(), 'Should not allow multiple tabs');

  console.log('✅ Multiple tabs handling test passed');
}

// Performance test
function testPerformance() {
  console.log('Testing performance...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const startTime = Date.now();

  // Create multiple instances
  const instances = [];
  for (let i = 0; i < 100; i++) {
    instances.push(
      new SoloTabEnforcer({
        debug: false,
        checkInterval: 1000,
      })
    );
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Created 100 instances in ${duration}ms`);
  assert(duration < 1000, 'Should create instances quickly');

  console.log('✅ Performance test passed');
}

// Memory test
function testMemoryUsage() {
  console.log('Testing memory usage...');

  const dom = createMockDOM();
  const SoloTabEnforcer = require('../src/index.js');

  const enforcer = new SoloTabEnforcer();
  enforcer.init();

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const memBefore = process.memoryUsage().heapUsed;

  // Create and destroy many instances
  for (let i = 0; i < 1000; i++) {
    const temp = new SoloTabEnforcer();
    temp.init();
    temp.destroy();
  }

  if (global.gc) {
    global.gc();
  }

  const memAfter = process.memoryUsage().heapUsed;
  const memDiff = memAfter - memBefore;

  console.log(`Memory difference: ${memDiff} bytes`);
  assert(memDiff < 1000000, 'Should not leak too much memory'); // Less than 1MB

  console.log('✅ Memory usage test passed');
}

// Run all tests
runTests();

// Additional tests if running in full test mode
if (process.env.FULL_TEST) {
  testPerformance();
  testMemoryUsage();
}

console.log('🎉 All tests completed successfully!');
