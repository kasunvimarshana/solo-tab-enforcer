/**
 * Solo Tab Enforcer - Main Entry Point
 * Cross-browser solution for enforcing single tab usage
 */

// Import core modules
const TabEnforcer = require('./core/TabEnforcer');
const CrossBrowserCompat = require('./utils/CrossBrowserCompat');
const BrowserAdapter = require('./adapters/BrowserAdapter');
const FallbackStrategy = require('./strategies/FallbackStrategy');

/**
 * Main SoloTabEnforcer class that orchestrates all components
 */
class SoloTabEnforcer {
  constructor(options = {}) {
    // Apply polyfills for older browsers
    if (typeof window !== 'undefined') {
      CrossBrowserCompat.applyPolyfills();
    }

    // Initialize browser adapter
    this.adapter = new BrowserAdapter();

    // Merge options with browser-specific optimizations
    this.options = {
      ...this.adapter.getOptimizations(),
      ...options,
    };

    // Initialize core enforcer
    this.enforcer = new TabEnforcer(this.options);

    // Initialize fallback strategy for unsupported browsers
    this.fallbackStrategy = new FallbackStrategy({
      ...this.options,
      onTabActivated: () => this.handleTabActivated(),
      onTabConflict: () => this.handleTabConflict(),
    });

    this.isUsingFallback = false;
  }

  /**
   * Initialize the tab enforcer
   */
  init() {
    // Check if we have modern browser support
    if (
      this.adapter.features.localStorage &&
      this.adapter.features.storageEvents
    ) {
      this.enforcer.init();
    } else {
      // Use fallback strategy
      this.isUsingFallback = true;
      this.fallbackStrategy.init();
    }
  }

  /**
   * Handle tab activation
   */
  handleTabActivated() {
    if (this.options.onTabActivated) {
      this.options.onTabActivated();
    }
  }

  /**
   * Handle tab conflict
   */
  handleTabConflict() {
    if (this.options.onTabConflict) {
      this.options.onTabConflict();
    }
  }

  /**
   * Get current tab information
   */
  getTabInfo() {
    const baseInfo = {
      browserInfo: this.adapter.browserInfo,
      features: this.adapter.features,
      isUsingFallback: this.isUsingFallback,
    };

    if (this.isUsingFallback) {
      return {
        ...baseInfo,
        isActive: this.fallbackStrategy.isActive,
      };
    } else {
      return {
        ...baseInfo,
        ...this.enforcer.getTabInfo(),
      };
    }
  }

  /**
   * Check if multiple tabs are allowed
   */
  areMultipleTabsAllowed() {
    return this.options.allowMultipleTabs;
  }

  /**
   * Enable multiple tabs
   */
  allowMultipleTabs() {
    this.options.allowMultipleTabs = true;
    if (!this.isUsingFallback) {
      this.enforcer.options.allowMultipleTabs = true;
    }
  }

  /**
   * Disable multiple tabs
   */
  disallowMultipleTabs() {
    this.options.allowMultipleTabs = false;
    if (!this.isUsingFallback) {
      this.enforcer.options.allowMultipleTabs = false;
    }
  }

  /**
   * Force tab registration (useful for recovery)
   */
  forceRegister() {
    if (!this.isUsingFallback) {
      this.enforcer.registerTab();
    }
  }

  /**
   * Get supported features
   */
  getSupportedFeatures() {
    return this.adapter.features;
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    return this.adapter.browserInfo;
  }

  /**
   * Destroy the tab enforcer
   */
  destroy() {
    if (this.isUsingFallback) {
      this.fallbackStrategy.destroy();
    } else {
      this.enforcer.destroy();
    }
  }
}

// Static methods for convenience
SoloTabEnforcer.create = function (options) {
  return new SoloTabEnforcer(options);
};

SoloTabEnforcer.createAndInit = function (options) {
  const enforcer = new SoloTabEnforcer(options);
  enforcer.init();
  return enforcer;
};

// Feature detection utilities
SoloTabEnforcer.checkSupport = function () {
  return CrossBrowserCompat.checkFeatureSupport();
};

SoloTabEnforcer.getBrowserInfo = function () {
  return CrossBrowserCompat.getBrowserInfo();
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoloTabEnforcer;
}
if (typeof window !== 'undefined') {
  window.SoloTabEnforcer = SoloTabEnforcer;
}
