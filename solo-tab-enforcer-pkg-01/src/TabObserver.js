class TabObserver {
  constructor(options = {}) {
    this.options = {
      appId: options.appId || 'default-app',
      storageKey: options.storageKey || 'tab-observer',
      onTabAdded: options.onTabAdded || (() => {}),
      onTabRemoved: options.onTabRemoved || (() => {}),
      onTabsChanged: options.onTabsChanged || (() => {}),
      checkInterval: options.checkInterval || 2000,
      debugMode: options.debugMode || false,
      customStorage:
        options.customStorage ||
        (typeof localStorage !== 'undefined' ? localStorage : null),
      heartbeatInterval: options.heartbeatInterval || 5000,
      tabTimeout: options.tabTimeout || 30000,
      ...options,
    };

    this.storage = this.options.customStorage;
    this.storageKey = `${this.options.storageKey}-${this.options.appId}`;
    this.intervalId = null;
    this.previousTabs = new Map();

    this.handleStorageChange = this.handleStorageChange.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  static create(options) {
    return new TabObserver(options);
  }

  handleStorageChange(event) {
    if (event.key === this.storageKey) {
      this.debug('Storage changed, checking tabs');
      this.checkTabChanges();
    }
  }

  start() {
    if (!this.storage) {
      this.debug('No storage available, observer cannot start');
      return;
    }

    this.debug('Starting tab observer');
    this.initializeTabs();

    this.intervalId = setInterval(() => {
      this.checkTabChanges();
    }, this.options.checkInterval);
  }

  stop() {
    this.debug('Stopping tab observer');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stop();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
  }

  initializeTabs() {
    const tabs = this.getAllTabs();
    tabs.forEach((tab) => {
      this.previousTabs.set(tab.id, tab);
    });
  }

  getAllTabs() {
    try {
      const data = this.storage.getItem(this.storageKey);
      const tabs = data ? JSON.parse(data) : {};
      const currentTime = Date.now();

      // Filter out expired tabs
      const validTabs = Object.values(tabs).filter(
        (tab) => currentTime - tab.lastHeartbeat <= this.options.tabTimeout
      );

      return validTabs;
    } catch (error) {
      this.debug('Error reading tabs from storage:', error);
      return [];
    }
  }

  getTabById(tabId) {
    const tabs = this.getAllTabs();
    return tabs.find((tab) => tab.id === tabId) || null;
  }

  removeTab(tabId) {
    try {
      const data = this.storage.getItem(this.storageKey);
      const tabs = data ? JSON.parse(data) : {};

      if (tabs[tabId]) {
        delete tabs[tabId];
        this.storage.setItem(this.storageKey, JSON.stringify(tabs));
        this.debug('Tab removed:', tabId);
        this.options.onTabRemoved(tabId);
        return true;
      }
      return false;
    } catch (error) {
      this.debug('Error removing tab:', error);
      return false;
    }
  }

  checkTabChanges() {
    const currentTabs = this.getAllTabs();
    const currentTabsMap = new Map(currentTabs.map((tab) => [tab.id, tab]));

    // Check for new tabs
    currentTabs.forEach((tab) => {
      if (!this.previousTabs.has(tab.id)) {
        this.debug('New tab detected:', tab);
        this.options.onTabAdded(tab.id, tab);
      }
    });

    // Check for removed tabs
    this.previousTabs.forEach((tab, tabId) => {
      if (!currentTabsMap.has(tabId)) {
        this.debug('Tab removed:', tabId);
        this.options.onTabRemoved(tabId);
      }
    });

    // Update previous tabs
    this.previousTabs = currentTabsMap;

    // Notify about all tabs change
    this.options.onTabsChanged(currentTabs);
  }

  debug(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[TabObserver] ${message}`, ...args);
    }
  }
}

module.exports = TabObserver;
