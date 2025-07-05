/**
 * Cross-Browser Tab Manager
 * A comprehensive solution for managing browser tabs with single-tab enforcement
 * and tab observation capabilities
 *
 * Features:
 * - Single tab enforcement
 * - Tab observation and monitoring
 * - Cross-browser compatibility
 * - Customizable configuration
 * - Production-ready
 *
 * @version 1.0.0
 * @author Kasun Vimarshana
 */

class TabManager {
  constructor(options = {}) {
    this.config = {
      // Core settings
      enforceSingleTab: options.enforceSingleTab !== false,
      observeAllTabs: options.observeAllTabs !== false,

      // Storage keys
      tabIdKey: options.tabIdKey || 'tm_tab_id',
      activeTabKey: options.activeTabKey || 'tm_active_tab',
      tabCountKey: options.tabCountKey || 'tm_tab_count',
      lastActiveKey: options.lastActiveKey || 'tm_last_active',

      // Timing configuration
      heartbeatInterval: options.heartbeatInterval || 1000,
      cleanupInterval: options.cleanupInterval || 5000,
      tabTimeout: options.tabTimeout || 10000,

      // Behavior settings
      redirectOnViolation: options.redirectOnViolation !== false,
      redirectUrl: options.redirectUrl || window.location.href,
      showWarnings: options.showWarnings !== false,
      customWarningMessage: options.customWarningMessage || null,

      // Advanced settings
      allowedDomains: options.allowedDomains || [],
      excludedPaths: options.excludedPaths || [],
      debugMode: options.debugMode || false,

      // Callbacks
      onTabViolation: options.onTabViolation || null,
      onTabActivated: options.onTabActivated || null,
      onTabDeactivated: options.onTabDeactivated || null,
      onTabCountChanged: options.onTabCountChanged || null,

      // Storage type preference
      preferLocalStorage: options.preferLocalStorage !== false,
      fallbackToSessionStorage: options.fallbackToSessionStorage !== false,

      // Cross-browser compatibility
      supportLegacyBrowsers: options.supportLegacyBrowsers !== false,
    };

    this.tabId = this.generateTabId();
    this.isActive = false;
    this.heartbeatTimer = null;
    this.cleanupTimer = null;
    this.observers = new Set();
    this.eventListeners = new Map();

    // Browser compatibility detection
    this.browserInfo = this.detectBrowser();
    this.storageSupport = this.detectStorageSupport();

    // Initialize the manager
    this.init();
  }

  // === Core Initialization ===
  init() {
    try {
      this.log('Initializing TabManager...');

      // Set up storage event listeners
      this.setupStorageListeners();

      // Set up page lifecycle listeners
      this.setupPageLifecycleListeners();

      // Register this tab
      this.registerTab();

      // Start monitoring if enabled
      if (this.config.observeAllTabs) {
        this.startObserving();
      }

      // Start single tab enforcement if enabled
      if (this.config.enforceSingleTab) {
        this.startEnforcement();
      }

      this.log('TabManager initialized successfully');
    } catch (error) {
      this.handleError('Initialization failed', error);
    }
  }

  // === Browser Detection ===
  detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();
    const browsers = {
      chrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
      firefox: /firefox/.test(userAgent),
      safari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
      edge: /edge/.test(userAgent),
      ie: /msie|trident/.test(userAgent),
      opera: /opera|opr/.test(userAgent),
    };

    const detectedBrowser =
      Object.keys(browsers).find((browser) => browsers[browser]) || 'unknown';

    return {
      name: detectedBrowser,
      version: this.extractBrowserVersion(userAgent, detectedBrowser),
      isLegacy:
        browsers.ie ||
        (browsers.chrome &&
          this.extractBrowserVersion(userAgent, 'chrome') < 60),
    };
  }

  extractBrowserVersion(userAgent, browser) {
    const patterns = {
      chrome: /chrome\/(\d+)/,
      firefox: /firefox\/(\d+)/,
      safari: /version\/(\d+)/,
      edge: /edge\/(\d+)/,
      ie: /(?:msie |rv:)(\d+)/,
    };

    const match = userAgent.match(patterns[browser]);
    return match ? parseInt(match[1]) : 0;
  }

  // === Storage Support Detection ===
  detectStorageSupport() {
    const support = {
      localStorage: false,
      sessionStorage: false,
      broadcastChannel: false,
      sharedWorker: false,
    };

    try {
      const testKey = 'tm_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      support.localStorage = true;
    } catch (e) {
      this.log('localStorage not supported', 'warn');
    }

    try {
      const testKey = 'tm_storage_test';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      support.sessionStorage = true;
    } catch (e) {
      this.log('sessionStorage not supported', 'warn');
    }

    try {
      support.broadcastChannel = typeof BroadcastChannel !== 'undefined';
    } catch (e) {
      support.broadcastChannel = false;
    }

    try {
      support.sharedWorker = typeof SharedWorker !== 'undefined';
    } catch (e) {
      support.sharedWorker = false;
    }

    return support;
  }

  // === Storage Abstraction ===
  getStorage() {
    if (this.config.preferLocalStorage && this.storageSupport.localStorage) {
      return localStorage;
    } else if (
      this.config.fallbackToSessionStorage &&
      this.storageSupport.sessionStorage
    ) {
      return sessionStorage;
    }
    return null;
  }

  setStorageItem(key, value) {
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        this.log(`Failed to set storage item ${key}`, 'error');
        return false;
      }
    }
    return false;
  }

  getStorageItem(key) {
    const storage = this.getStorage();
    if (storage) {
      try {
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        this.log(`Failed to get storage item ${key}`, 'error');
        return null;
      }
    }
    return null;
  }

  removeStorageItem(key) {
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.removeItem(key);
        return true;
      } catch (e) {
        this.log(`Failed to remove storage item ${key}`, 'error');
        return false;
      }
    }
    return false;
  }

  // === Tab Management ===
  generateTabId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `tab_${timestamp}_${random}`;
  }

  registerTab() {
    const tabData = {
      id: this.tabId,
      url: window.location.href,
      timestamp: Date.now(),
      lastHeartbeat: Date.now(),
      userAgent: navigator.userAgent,
      isActive: true,
    };

    this.setStorageItem(this.config.tabIdKey, tabData);
    this.updateTabCount();
    this.markAsActive();

    this.log(`Tab registered: ${this.tabId}`);

    // Trigger callback
    if (this.config.onTabActivated) {
      this.config.onTabActivated(tabData);
    }
  }

  markAsActive() {
    this.isActive = true;
    this.setStorageItem(this.config.activeTabKey, {
      tabId: this.tabId,
      timestamp: Date.now(),
    });

    this.setStorageItem(this.config.lastActiveKey, Date.now());
  }

  updateTabCount() {
    const currentCount = this.getStorageItem(this.config.tabCountKey) || 0;
    const newCount = currentCount + 1;
    this.setStorageItem(this.config.tabCountKey, newCount);

    if (this.config.onTabCountChanged) {
      this.config.onTabCountChanged(newCount);
    }
  }

  // === Single Tab Enforcement ===
  startEnforcement() {
    this.log('Starting single tab enforcement...');

    // Check if another tab is already active
    this.checkExistingTabs();

    // Start heartbeat to maintain active status
    this.startHeartbeat();

    // Start cleanup timer
    this.startCleanup();
  }

  checkExistingTabs() {
    const activeTab = this.getStorageItem(this.config.activeTabKey);
    const currentTime = Date.now();

    if (activeTab && activeTab.tabId !== this.tabId) {
      const timeSinceLastActive = currentTime - activeTab.timestamp;

      if (timeSinceLastActive < this.config.tabTimeout) {
        this.handleTabViolation(activeTab);
        return;
      }
    }

    // If no active tab or it's timed out, claim active status
    this.markAsActive();
  }

  handleTabViolation(existingTab) {
    this.log(
      `Tab violation detected. Existing tab: ${existingTab.tabId}`,
      'warn'
    );

    // Trigger callback
    if (this.config.onTabViolation) {
      this.config.onTabViolation({
        currentTab: this.tabId,
        existingTab: existingTab.tabId,
        action: 'redirect',
      });
    }

    // Show warning if enabled
    if (this.config.showWarnings) {
      this.showViolationWarning();
    }

    // Redirect if enabled
    if (this.config.redirectOnViolation) {
      this.redirectTab();
    }
  }

  showViolationWarning() {
    const message =
      this.config.customWarningMessage ||
      'This application is already open in another tab. You will be redirected to avoid conflicts.';

    if (confirm(message)) {
      // User acknowledged, proceed with redirect
      this.redirectTab();
    }
  }

  redirectTab() {
    const redirectUrl = this.config.redirectUrl;

    if (redirectUrl && redirectUrl !== window.location.href) {
      window.location.href = redirectUrl;
    } else {
      window.close();
    }
  }

  // === Heartbeat System ===
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isActive) {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  sendHeartbeat() {
    const heartbeatData = {
      tabId: this.tabId,
      timestamp: Date.now(),
    };

    this.setStorageItem(this.config.activeTabKey, heartbeatData);
    this.setStorageItem(this.config.lastActiveKey, Date.now());
  }

  // === Cleanup System ===
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveTabs();
    }, this.config.cleanupInterval);
  }

  cleanupInactiveTabs() {
    const currentTime = Date.now();
    const lastActive = this.getStorageItem(this.config.lastActiveKey);

    if (lastActive && currentTime - lastActive > this.config.tabTimeout) {
      this.log('Cleaning up inactive tabs...');

      // Reset tab count
      this.setStorageItem(this.config.tabCountKey, 1);

      // Claim active status
      this.markAsActive();
    }
  }

  // === Tab Observation ===
  startObserving() {
    this.log('Starting tab observation...');

    // Set up storage listeners for tab changes
    this.setupTabObservers();

    // Start periodic observation
    this.startPeriodicObservation();
  }

  setupTabObservers() {
    // Listen for storage changes
    this.addEventListener('storage', (event) => {
      if (event.key === this.config.activeTabKey) {
        this.handleTabChange(event);
      } else if (event.key === this.config.tabCountKey) {
        this.handleTabCountChange(event);
      }
    });

    // Listen for page visibility changes
    this.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleTabDeactivated();
      } else {
        this.handleTabActivated();
      }
    });
  }

  handleTabChange(event) {
    const newValue = event.newValue ? JSON.parse(event.newValue) : null;
    const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;

    this.notifyObservers('tabChange', {
      newTab: newValue,
      oldTab: oldValue,
      currentTab: this.tabId,
    });
  }

  handleTabCountChange(event) {
    const newCount = event.newValue ? parseInt(event.newValue) : 0;
    const oldCount = event.oldValue ? parseInt(event.oldValue) : 0;

    this.notifyObservers('tabCountChange', {
      newCount,
      oldCount,
      currentTab: this.tabId,
    });
  }

  handleTabActivated() {
    this.isActive = true;
    this.markAsActive();

    if (this.config.onTabActivated) {
      this.config.onTabActivated({
        tabId: this.tabId,
        timestamp: Date.now(),
      });
    }

    this.notifyObservers('tabActivated', {
      tabId: this.tabId,
      timestamp: Date.now(),
    });
  }

  handleTabDeactivated() {
    this.isActive = false;

    if (this.config.onTabDeactivated) {
      this.config.onTabDeactivated({
        tabId: this.tabId,
        timestamp: Date.now(),
      });
    }

    this.notifyObservers('tabDeactivated', {
      tabId: this.tabId,
      timestamp: Date.now(),
    });
  }

  startPeriodicObservation() {
    setInterval(() => {
      this.observeTabState();
    }, this.config.heartbeatInterval);
  }

  observeTabState() {
    const activeTab = this.getStorageItem(this.config.activeTabKey);
    const tabCount = this.getStorageItem(this.config.tabCountKey) || 0;

    this.notifyObservers('tabStateUpdate', {
      activeTab,
      tabCount,
      currentTab: this.tabId,
      isActive: this.isActive,
    });
  }

  // === Observer Pattern ===
  addObserver(observer) {
    if (typeof observer === 'function') {
      this.observers.add(observer);
      return true;
    }
    return false;
  }

  removeObserver(observer) {
    return this.observers.delete(observer);
  }

  notifyObservers(event, data) {
    this.observers.forEach((observer) => {
      try {
        observer(event, data);
      } catch (error) {
        this.log(`Observer error: ${error.message}`, 'error');
      }
    });
  }

  // === Event Management ===
  addEventListener(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event).add(handler);

    if (event === 'storage') {
      window.addEventListener('storage', handler);
    } else if (event === 'visibilitychange') {
      document.addEventListener('visibilitychange', handler);
    } else if (event === 'beforeunload') {
      window.addEventListener('beforeunload', handler);
    } else if (event === 'unload') {
      window.addEventListener('unload', handler);
    }
  }

  removeEventListener(event, handler) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(handler);

      if (event === 'storage') {
        window.removeEventListener('storage', handler);
      } else if (event === 'visibilitychange') {
        document.removeEventListener('visibilitychange', handler);
      } else if (event === 'beforeunload') {
        window.removeEventListener('beforeunload', handler);
      } else if (event === 'unload') {
        window.removeEventListener('unload', handler);
      }
    }
  }

  // === Page Lifecycle Management ===
  setupPageLifecycleListeners() {
    // Handle page unload
    this.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Handle page reload/close
    this.addEventListener('unload', () => {
      this.cleanup();
    });

    // Handle focus/blur
    this.addEventListener('focus', () => {
      this.handleTabActivated();
    });

    this.addEventListener('blur', () => {
      this.handleTabDeactivated();
    });
  }

  // === Utility Methods ===
  getTabInfo() {
    return {
      tabId: this.tabId,
      isActive: this.isActive,
      url: window.location.href,
      timestamp: Date.now(),
      browserInfo: this.browserInfo,
      storageSupport: this.storageSupport,
    };
  }

  getActiveTab() {
    return this.getStorageItem(this.config.activeTabKey);
  }

  getTabCount() {
    return this.getStorageItem(this.config.tabCountKey) || 0;
  }

  isCurrentTabActive() {
    const activeTab = this.getActiveTab();
    return activeTab && activeTab.tabId === this.tabId;
  }

  // === Configuration Management ===
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated');

    // Restart components if necessary
    if (newConfig.heartbeatInterval && this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.startHeartbeat();
    }

    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanup();
    }
  }

  getConfig() {
    return { ...this.config };
  }

  // === Error Handling ===
  handleError(message, error) {
    this.log(`Error: ${message}`, 'error');
    if (error) {
      this.log(error.stack || error.message, 'error');
    }

    // Notify observers about error
    this.notifyObservers('error', {
      message,
      error: error ? error.message : null,
      tabId: this.tabId,
      timestamp: Date.now(),
    });
  }

  // === Logging ===
  log(message, level = 'info') {
    if (this.config.debugMode) {
      const timestamp = new Date().toISOString();
      const prefix = `[TabManager:${this.tabId}] ${timestamp}:`;

      switch (level) {
        case 'error':
          console.error(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'info':
        default:
          console.log(prefix, message);
          break;
      }
    }
  }

  // === Cleanup ===
  cleanup() {
    this.log('Cleaning up TabManager...');

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Remove event listeners
    this.eventListeners.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.removeEventListener(event, handler);
      });
    });

    // Clear observers
    this.observers.clear();

    // Update tab count
    const currentCount = this.getStorageItem(this.config.tabCountKey) || 0;
    if (currentCount > 0) {
      this.setStorageItem(this.config.tabCountKey, currentCount - 1);
    }

    // Clear active tab if it's this tab
    const activeTab = this.getActiveTab();
    if (activeTab && activeTab.tabId === this.tabId) {
      this.removeStorageItem(this.config.activeTabKey);
    }

    this.log('TabManager cleanup completed');
  }

  // === Static Factory Methods ===
  static createSingleTabEnforcer(options = {}) {
    return new TabManager({
      ...options,
      enforceSingleTab: true,
      observeAllTabs: false,
    });
  }

  static createTabObserver(options = {}) {
    return new TabManager({
      ...options,
      enforceSingleTab: false,
      observeAllTabs: true,
    });
  }

  static createFullManager(options = {}) {
    return new TabManager({
      ...options,
      enforceSingleTab: true,
      observeAllTabs: true,
    });
  }
}

// === Export for different environments ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabManager;
} else if (typeof define === 'function' && define.amd) {
  define([], function () {
    return TabManager;
  });
} else {
  window.TabManager = TabManager;
}
