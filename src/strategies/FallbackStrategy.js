/**
 * Fallback strategy for browsers with limited feature support
 */

class FallbackStrategy {
  constructor(options = {}) {
    this.options = {
      pollInterval: 2000,
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    };

    this.isActive = false;
    this.pollTimer = null;
    this.retryCount = 0;
  }

  /**
   * Initialize fallback strategy
   */
  init() {
    this.startPolling();
  }

  /**
   * Start polling for tab conflicts
   */
  startPolling() {
    this.pollTimer = setInterval(() => {
      this.checkForConflicts();
    }, this.options.pollInterval);
  }

  /**
   * Check for conflicts using document title manipulation
   */
  checkForConflicts() {
    try {
      const originalTitle = document.title;
      const marker = '__tab_check__';

      // Try to set a marker in the title
      document.title = marker;

      // Check if title was actually changed
      if (document.title === marker) {
        // We have control, restore original title
        document.title = originalTitle;
        this.handleTabActivated();
      } else {
        // Another tab might have control
        this.handleTabConflict();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Use URL hash for tab coordination
   */
  useHashStrategy() {
    const tabId = this.generateTabId();
    const originalHash = window.location.hash;

    // Set our tab ID in hash
    window.location.hash = `#tab_${tabId}`;

    // Check if hash was actually set
    setTimeout(() => {
      if (window.location.hash === `#tab_${tabId}`) {
        this.handleTabActivated();
      } else {
        this.handleTabConflict();
      }

      // Restore original hash
      window.location.hash = originalHash;
    }, 100);
  }

  /**
   * Use window.name for tab identification
   */
  useWindowNameStrategy() {
    const tabId = this.generateTabId();
    const originalName = window.name;

    if (!window.name || window.name.indexOf('tab_') !== 0) {
      window.name = `tab_${tabId}`;
      this.handleTabActivated();
    } else if (window.name !== `tab_${tabId}`) {
      this.handleTabConflict();
    }
  }

  /**
   * Use global variable strategy
   */
  useGlobalVariableStrategy() {
    const tabId = this.generateTabId();

    if (typeof window.__tabEnforcer === 'undefined') {
      window.__tabEnforcer = {
        tabId: tabId,
        timestamp: Date.now(),
      };
      this.handleTabActivated();
    } else {
      const timeDiff = Date.now() - window.__tabEnforcer.timestamp;
      if (timeDiff > 5000) {
        // Assume the other tab is dead
        window.__tabEnforcer = {
          tabId: tabId,
          timestamp: Date.now(),
        };
        this.handleTabActivated();
      } else if (window.__tabEnforcer.tabId !== tabId) {
        this.handleTabConflict();
      }
    }
  }

  /**
   * Use iframe communication strategy
   */
  useIframeStrategy() {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const tabId = this.generateTabId();

      if (!iframeDoc.title) {
        iframeDoc.title = `tab_${tabId}`;
        this.handleTabActivated();
      } else if (iframeDoc.title !== `tab_${tabId}`) {
        this.handleTabConflict();
      }
    } catch (error) {
      // Cross-origin restrictions, cleanup
      document.body.removeChild(iframe);
      this.handleError(error);
    }
  }

  /**
   * Handle tab activation
   */
  handleTabActivated() {
    this.isActive = true;
    this.retryCount = 0;

    if (this.options.onTabActivated) {
      this.options.onTabActivated();
    }
  }

  /**
   * Handle tab conflict
   */
  handleTabConflict() {
    this.isActive = false;

    if (this.options.onTabConflict) {
      this.options.onTabConflict();
    }
  }

  /**
   * Handle errors with retry logic
   */
  handleError(error) {
    console.warn('Fallback strategy error:', error);

    if (this.retryCount < this.options.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.checkForConflicts();
      }, this.options.retryDelay);
    }
  }

  /**
   * Generate simple tab ID
   */
  generateTabId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Destroy fallback strategy
   */
  destroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    // Cleanup global variables
    if (typeof window.__tabEnforcer !== 'undefined') {
      delete window.__tabEnforcer;
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FallbackStrategy;
}
if (typeof window !== 'undefined') {
  window.FallbackStrategy = FallbackStrategy;
}
