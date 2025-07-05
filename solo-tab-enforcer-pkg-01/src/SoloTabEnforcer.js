class SoloTabEnforcer {
  constructor(options = {}) {
    this.options = {
      appId: options.appId || 'default-app',
      storageKey: options.storageKey || 'solo-tab-enforcer',
      checkInterval: options.checkInterval || 1000,
      onDuplicateTab: options.onDuplicateTab || (() => {}),
      onTabBecomeActive: options.onTabBecomeActive || (() => {}),
      onTabDestroyed: options.onTabDestroyed || (() => {}),
      autoRedirect: options.autoRedirect !== false,
      redirectUrl: options.redirectUrl || '/duplicate-tab-warning',
      warningMessage:
        options.warningMessage ||
        'This application is already open in another tab. Please close this tab and use the existing one.',
      debugMode: options.debugMode || false,
      customStorage:
        options.customStorage ||
        (typeof localStorage !== 'undefined' ? localStorage : null),
      heartbeatInterval: options.heartbeatInterval || 5000,
      tabTimeout: options.tabTimeout || 30000,
      ...options,
    };

    this.tabId = this.generateTabId();
    this.isActive = false;
    this.intervalId = null;
    this.heartbeatIntervalId = null;
    this.storage = this.options.customStorage;
    this.storageKey = `${this.options.storageKey}-${this.options.appId}`;

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleStorageChange = this.handleStorageChange.bind(this);

    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  static create(options) {
    return new SoloTabEnforcer(options);
  }

  generateTabId() {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupEventListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  removeEventListeners() {
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      window.removeEventListener('storage', this.handleStorageChange);
    }
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.debug('Tab became visible');
      this.checkTabStatus();
    }
  }

  handleBeforeUnload() {
    this.debug('Tab is being closed');
    this.removeTabFromStorage();
  }

  handleStorageChange(event) {
    if (event.key === this.storageKey) {
      this.debug('Storage changed, checking tab status');
      this.checkTabStatus();
    }
  }

  start() {
    if (!this.storage) {
      this.debug('No storage available, enforcer cannot start');
      return;
    }

    this.debug('Starting tab enforcer');
    this.registerTab();
    this.checkTabStatus();

    this.intervalId = setInterval(() => {
      this.checkTabStatus();
    }, this.options.checkInterval);

    this.heartbeatIntervalId = setInterval(() => {
      this.updateHeartbeat();
    }, this.options.heartbeatInterval);
  }

  stop() {
    this.debug('Stopping tab enforcer');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  destroy() {
    this.stop();
    this.removeTabFromStorage();
    this.removeEventListeners();
  }

  registerTab() {
    const tabData = {
      id: this.tabId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      title: typeof document !== 'undefined' ? document.title : '',
      timestamp: Date.now(),
      lastHeartbeat: Date.now(),
      isActive: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: this.generateSessionId(),
    };

    const tabs = this.getTabsFromStorage();
    tabs[this.tabId] = tabData;
    this.saveTabsToStorage(tabs);
    this.isActive = true;

    this.debug('Tab registered:', tabData);
    this.options.onTabBecomeActive(this.tabId);
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getTabsFromStorage() {
    try {
      const data = this.storage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      this.debug('Error reading from storage:', error);
      return {};
    }
  }

  saveTabsToStorage(tabs) {
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(tabs));
    } catch (error) {
      this.debug('Error saving to storage:', error);
    }
  }

  removeTabFromStorage() {
    const tabs = this.getTabsFromStorage();
    if (tabs[this.tabId]) {
      delete tabs[this.tabId];
      this.saveTabsToStorage(tabs);
      this.debug('Tab removed from storage');
      this.options.onTabDestroyed(this.tabId);
    }
  }

  updateHeartbeat() {
    if (this.isActive) {
      const tabs = this.getTabsFromStorage();
      if (tabs[this.tabId]) {
        tabs[this.tabId].lastHeartbeat = Date.now();
        this.saveTabsToStorage(tabs);
      }
    }
  }

  checkTabStatus() {
    const tabs = this.getTabsFromStorage();
    const currentTime = Date.now();

    // Clean up expired tabs
    Object.keys(tabs).forEach((tabId) => {
      if (currentTime - tabs[tabId].lastHeartbeat > this.options.tabTimeout) {
        delete tabs[tabId];
      }
    });

    // Check if current tab should be active
    const activeTabs = Object.values(tabs).filter((tab) => tab.isActive);
    const isFirstTab =
      activeTabs.length === 0 || activeTabs[0].id === this.tabId;

    if (isFirstTab && !this.isActive) {
      // This tab should become active
      this.isActive = true;
      tabs[this.tabId] = {
        ...tabs[this.tabId],
        isActive: true,
        lastHeartbeat: currentTime,
      };
      this.saveTabsToStorage(tabs);
      this.options.onTabBecomeActive(this.tabId);
    } else if (!isFirstTab && this.isActive) {
      // This tab should become inactive (duplicate)
      this.isActive = false;
      tabs[this.tabId] = {
        ...tabs[this.tabId],
        isActive: false,
        lastHeartbeat: currentTime,
      };
      this.saveTabsToStorage(tabs);
      this.handleDuplicateTab();
    }

    this.saveTabsToStorage(tabs);
  }

  handleDuplicateTab() {
    this.debug('Duplicate tab detected');
    this.options.onDuplicateTab(this.tabId);

    if (this.options.autoRedirect) {
      this.redirectToDuplicateWarning();
    } else {
      this.showWarningMessage();
    }
  }

  redirectToDuplicateWarning() {
    if (typeof window !== 'undefined') {
      window.location.href = this.options.redirectUrl;
    }
  }

  showWarningMessage() {
    if (typeof window !== 'undefined') {
      alert(this.options.warningMessage);
    }
  }

  isCurrentTabActive() {
    return this.isActive;
  }

  getCurrentTabId() {
    return this.tabId;
  }

  getActiveTabs() {
    const tabs = this.getTabsFromStorage();
    return Object.values(tabs).filter((tab) => tab.isActive);
  }

  forceActivateTab() {
    this.debug('Force activating tab');
    this.isActive = true;
    const tabs = this.getTabsFromStorage();

    // Deactivate all other tabs
    Object.keys(tabs).forEach((tabId) => {
      if (tabId !== this.tabId) {
        tabs[tabId].isActive = false;
      }
    });

    // Activate current tab
    tabs[this.tabId] = {
      ...tabs[this.tabId],
      isActive: true,
      lastHeartbeat: Date.now(),
    };

    this.saveTabsToStorage(tabs);
    this.options.onTabBecomeActive(this.tabId);
  }

  debug(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[SoloTabEnforcer] ${message}`, ...args);
    }
  }
}

module.exports = SoloTabEnforcer;
