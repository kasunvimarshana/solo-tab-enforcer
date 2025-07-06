/**
 * Solo Tab Enforcer - Core Module
 * Cross-browser solution for enforcing single tab usage
 */

class TabEnforcer {
  constructor(options = {}) {
    this.options = {
      storageKey: 'solo-tab-enforcer',
      checkInterval: 1000,
      warningMessage:
        'Another tab is already open. Please close other tabs to continue.',
      redirectUrl: null,
      allowMultipleTabs: false,
      debug: false,
      onTabConflict: null,
      onTabActivated: null,
      onTabDeactivated: null,
      useVisibilityAPI: true,
      useBroadcastChannel: true,
      useStorageEvents: true,
      tabTimeoutMs: 5000,
      ...options,
    };

    this.tabId = this.generateTabId();
    this.isActive = false;
    this.isInitialized = false;
    this.broadcastChannel = null;
    this.storageEventListener = null;
    this.visibilityChangeListener = null;
    this.beforeUnloadListener = null;
    this.focusListener = null;
    this.blurListener = null;
    this.checkTimer = null;
    this.heartbeatTimer = null;

    this.supportedFeatures = this.detectFeatures();
    this.log('TabEnforcer initialized with options:', this.options);
  }

  /**
   * Generate unique tab identifier
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect browser features
   */
  detectFeatures() {
    return {
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      visibilityAPI: typeof document.visibilityState !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      storageEvents: typeof window.addEventListener !== 'undefined',
    };
  }

  /**
   * Initialize the tab enforcer
   */
  init() {
    if (this.isInitialized) {
      this.log('TabEnforcer already initialized');
      return;
    }

    this.log('Initializing TabEnforcer...');

    if (this.options.allowMultipleTabs) {
      this.log('Multiple tabs allowed, enforcer disabled');
      return;
    }

    this.setupEventListeners();
    this.registerTab();
    this.startHeartbeat();
    this.startTabCheck();

    this.isInitialized = true;
    this.log('TabEnforcer initialized successfully');
  }

  /**
   * Setup event listeners for different browser APIs
   */
  setupEventListeners() {
    // BroadcastChannel for modern browsers
    if (
      this.options.useBroadcastChannel &&
      this.supportedFeatures.broadcastChannel
    ) {
      this.setupBroadcastChannel();
    }

    // Storage events for cross-tab communication
    if (this.options.useStorageEvents && this.supportedFeatures.storageEvents) {
      this.setupStorageEvents();
    }

    // Visibility API for tab focus detection
    if (this.options.useVisibilityAPI && this.supportedFeatures.visibilityAPI) {
      this.setupVisibilityAPI();
    }

    // Window focus/blur events (fallback)
    this.setupFocusEvents();

    // Cleanup on page unload
    this.setupUnloadEvents();
  }

  /**
   * Setup BroadcastChannel communication
   */
  setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel(this.options.storageKey);
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
      this.log('BroadcastChannel initialized');
    } catch (error) {
      this.log('BroadcastChannel failed to initialize:', error);
    }
  }

  /**
   * Setup storage events for cross-tab communication
   */
  setupStorageEvents() {
    this.storageEventListener = (event) => {
      if (event.key === this.options.storageKey) {
        this.handleStorageEvent(event);
      }
    };
    window.addEventListener('storage', this.storageEventListener);
    this.log('Storage events initialized');
  }

  /**
   * Setup Visibility API
   */
  setupVisibilityAPI() {
    this.visibilityChangeListener = () => {
      if (document.visibilityState === 'visible') {
        this.handleTabActivated();
      } else {
        this.handleTabDeactivated();
      }
    };
    document.addEventListener(
      'visibilitychange',
      this.visibilityChangeListener
    );
    this.log('Visibility API initialized');
  }

  /**
   * Setup focus/blur events
   */
  setupFocusEvents() {
    this.focusListener = () => this.handleTabActivated();
    this.blurListener = () => this.handleTabDeactivated();

    window.addEventListener('focus', this.focusListener);
    window.addEventListener('blur', this.blurListener);
    this.log('Focus events initialized');
  }

  /**
   * Setup unload events
   */
  setupUnloadEvents() {
    this.beforeUnloadListener = () => {
      this.unregisterTab();
    };
    window.addEventListener('beforeunload', this.beforeUnloadListener);
    window.addEventListener('unload', this.beforeUnloadListener);
    this.log('Unload events initialized');
  }

  /**
   * Register current tab
   */
  registerTab() {
    const tabData = {
      id: this.tabId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      isActive: document.visibilityState === 'visible',
    };

    this.setStorageData(tabData);
    this.broadcastMessage({ type: 'tab-registered', tabId: this.tabId });
    this.log('Tab registered:', this.tabId);
  }

  /**
   * Unregister current tab
   */
  unregisterTab() {
    this.removeStorageData();
    this.broadcastMessage({ type: 'tab-unregistered', tabId: this.tabId });
    this.log('Tab unregistered:', this.tabId);
  }

  /**
   * Start heartbeat to maintain tab presence
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.updateHeartbeat();
    }, this.options.checkInterval);
  }

  /**
   * Update heartbeat timestamp
   */
  updateHeartbeat() {
    const existingData = this.getStorageData();
    if (existingData && existingData.id === this.tabId) {
      existingData.timestamp = Date.now();
      this.setStorageData(existingData);
    }
  }

  /**
   * Start tab checking routine
   */
  startTabCheck() {
    this.checkTimer = setInterval(() => {
      this.checkForConflicts();
    }, this.options.checkInterval);
  }

  /**
   * Check for tab conflicts
   */
  checkForConflicts() {
    const existingData = this.getStorageData();

    if (!existingData) {
      // No existing tab, register this one
      this.registerTab();
      return;
    }

    // Check if existing tab is still alive
    const timeDiff = Date.now() - existingData.timestamp;

    if (timeDiff > this.options.tabTimeoutMs) {
      // Existing tab is dead, take over
      this.registerTab();
      return;
    }

    // Check if this is a different tab
    if (existingData.id !== this.tabId) {
      this.handleTabConflict(existingData);
    }
  }

  /**
   * Handle tab conflict
   */
  handleTabConflict(existingTab) {
    this.log('Tab conflict detected:', existingTab);

    if (this.options.onTabConflict) {
      this.options.onTabConflict(existingTab);
    } else {
      this.showDefaultWarning();
    }
  }

  /**
   * Show default warning message
   */
  showDefaultWarning() {
    if (this.options.redirectUrl) {
      window.location.href = this.options.redirectUrl;
    } else {
      alert(this.options.warningMessage);
      window.close();
    }
  }

  /**
   * Handle tab activation
   */
  handleTabActivated() {
    this.isActive = true;
    this.log('Tab activated');

    if (this.options.onTabActivated) {
      this.options.onTabActivated();
    }

    // Re-register tab when activated
    this.registerTab();
  }

  /**
   * Handle tab deactivation
   */
  handleTabDeactivated() {
    this.isActive = false;
    this.log('Tab deactivated');

    if (this.options.onTabDeactivated) {
      this.options.onTabDeactivated();
    }
  }

  /**
   * Handle broadcast messages
   */
  handleBroadcastMessage(data) {
    this.log('Received broadcast message:', data);

    switch (data.type) {
      case 'tab-registered':
        if (data.tabId !== this.tabId) {
          this.checkForConflicts();
        }
        break;
      case 'tab-unregistered':
        // Another tab closed, we might be able to take over
        if (data.tabId !== this.tabId) {
          setTimeout(() => this.registerTab(), 100);
        }
        break;
    }
  }

  /**
   * Handle storage events
   */
  handleStorageEvent(event) {
    this.log('Storage event:', event);

    if (event.newValue && event.newValue !== event.oldValue) {
      const newData = JSON.parse(event.newValue);
      if (newData.id !== this.tabId) {
        this.checkForConflicts();
      }
    }
  }

  /**
   * Broadcast message to other tabs
   */
  broadcastMessage(data) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch (error) {
        this.log('Failed to broadcast message:', error);
      }
    }
  }

  /**
   * Get data from storage
   */
  getStorageData() {
    try {
      const data = localStorage.getItem(this.options.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.log('Failed to get storage data:', error);
      return null;
    }
  }

  /**
   * Set data to storage
   */
  setStorageData(data) {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      this.log('Failed to set storage data:', error);
    }
  }

  /**
   * Remove data from storage
   */
  removeStorageData() {
    try {
      localStorage.removeItem(this.options.storageKey);
    } catch (error) {
      this.log('Failed to remove storage data:', error);
    }
  }

  /**
   * Get current tab information
   */
  getTabInfo() {
    return {
      id: this.tabId,
      isActive: this.isActive,
      isInitialized: this.isInitialized,
      supportedFeatures: this.supportedFeatures,
      options: this.options,
    };
  }

  /**
   * Destroy the tab enforcer
   */
  destroy() {
    this.log('Destroying TabEnforcer...');

    // Clear timers
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Remove event listeners
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
    }
    if (this.visibilityChangeListener) {
      document.removeEventListener(
        'visibilitychange',
        this.visibilityChangeListener
      );
    }
    if (this.beforeUnloadListener) {
      window.removeEventListener('beforeunload', this.beforeUnloadListener);
      window.removeEventListener('unload', this.beforeUnloadListener);
    }
    if (this.focusListener) {
      window.removeEventListener('focus', this.focusListener);
    }
    if (this.blurListener) {
      window.removeEventListener('blur', this.blurListener);
    }

    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    // Unregister tab
    this.unregisterTab();

    this.isInitialized = false;
    this.log('TabEnforcer destroyed');
  }

  /**
   * Log messages if debug is enabled
   */
  log(...args) {
    if (this.options.debug) {
      console.log(`[TabEnforcer:${this.tabId}]`, ...args);
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabEnforcer;
}
if (typeof window !== 'undefined') {
  window.TabEnforcer = TabEnforcer;
}
