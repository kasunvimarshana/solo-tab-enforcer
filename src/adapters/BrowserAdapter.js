/**
 * Browser-specific adapter for different browsers
 */

class BrowserAdapter {
  constructor() {
    this.browserInfo = this.getBrowserInfo();
    this.features = this.detectFeatures();
  }

  /**
   * Get browser information
   */
  getBrowserInfo() {
    if (typeof navigator === 'undefined') {
      return { name: 'unknown', version: 'unknown' };
    }

    const ua = navigator.userAgent;
    const browsers = [
      { name: 'chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'safari', pattern: /Version\/(\d+).*Safari/ },
      { name: 'edge', pattern: /Edge\/(\d+)/ },
      { name: 'ie', pattern: /(MSIE|rv:)(\d+)/ },
    ];

    for (const browser of browsers) {
      const match = ua.match(browser.pattern);
      if (match) {
        return {
          name: browser.name,
          version: match[1] || match[2] || 'unknown',
        };
      }
    }

    return { name: 'unknown', version: 'unknown' };
  }

  /**
   * Detect browser features
   */
  detectFeatures() {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      visibilityAPI: typeof document.visibilityState !== 'undefined',
      storageEvents: typeof window.addEventListener !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      indexedDB: typeof indexedDB !== 'undefined',
      crypto:
        typeof crypto !== 'undefined' &&
        typeof crypto.getRandomValues !== 'undefined',
    };
  }

  /**
   * Get optimal storage method for current browser
   */
  getStorageMethod() {
    if (this.features.localStorage) {
      return {
        type: 'localStorage',
        get: (key) => localStorage.getItem(key),
        set: (key, value) => localStorage.setItem(key, value),
        remove: (key) => localStorage.removeItem(key),
      };
    } else if (this.features.sessionStorage) {
      return {
        type: 'sessionStorage',
        get: (key) => sessionStorage.getItem(key),
        set: (key, value) => sessionStorage.setItem(key, value),
        remove: (key) => sessionStorage.removeItem(key),
      };
    } else {
      // Fallback to cookies
      return {
        type: 'cookies',
        get: (key) => this.getCookie(key),
        set: (key, value) => this.setCookie(key, value),
        remove: (key) => this.removeCookie(key),
      };
    }
  }

  /**
   * Get optimal communication method for current browser
   */
  getCommunicationMethod() {
    if (this.features.broadcastChannel) {
      return {
        type: 'broadcastChannel',
        create: (channel) => new BroadcastChannel(channel),
        send: (channel, data) => channel.postMessage(data),
        close: (channel) => channel.close(),
      };
    } else if (this.features.storageEvents) {
      return {
        type: 'storageEvents',
        create: (key) => ({ key }),
        send: (context, data) => {
          const event = new CustomEvent('storage', {
            detail: { key: context.key, data },
          });
          window.dispatchEvent(event);
        },
        close: () => {},
      };
    } else {
      // Fallback to polling
      return {
        type: 'polling',
        create: (key) => ({ key }),
        send: () => {},
        close: () => {},
      };
    }
  }

  /**
   * Get visibility detection method
   */
  getVisibilityMethod() {
    if (this.features.visibilityAPI) {
      return {
        type: 'visibilityAPI',
        isVisible: () => document.visibilityState === 'visible',
        onVisibilityChange: (callback) => {
          document.addEventListener('visibilitychange', callback);
          return () =>
            document.removeEventListener('visibilitychange', callback);
        },
      };
    } else {
      // Fallback to focus/blur events
      return {
        type: 'focusBlur',
        isVisible: () => (document.hasFocus ? document.hasFocus() : true),
        onVisibilityChange: (callback) => {
          const focusHandler = () =>
            callback({ target: { visibilityState: 'visible' } });
          const blurHandler = () =>
            callback({ target: { visibilityState: 'hidden' } });

          window.addEventListener('focus', focusHandler);
          window.addEventListener('blur', blurHandler);

          return () => {
            window.removeEventListener('focus', focusHandler);
            window.removeEventListener('blur', blurHandler);
          };
        },
      };
    }
  }

  /**
   * Cookie utilities for fallback
   */
  getCookie(name) {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  setCookie(name, value, days = 1) {
    if (typeof document === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  removeCookie(name) {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
  }

  /**
   * Generate unique ID using best available method
   */
  generateUniqueId() {
    if (this.features.crypto) {
      const array = new Uint32Array(2);
      crypto.getRandomValues(array);
      return array[0].toString(36) + array[1].toString(36);
    } else {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  }

  /**
   * Get browser-specific optimizations
   */
  getOptimizations() {
    const optimizations = {
      checkInterval: 1000,
      heartbeatInterval: 5000,
      timeoutMs: 10000,
    };

    // Browser-specific optimizations
    switch (this.browserInfo.name) {
      case 'chrome':
        optimizations.checkInterval = 500;
        optimizations.heartbeatInterval = 3000;
        break;
      case 'firefox':
        optimizations.checkInterval = 750;
        optimizations.heartbeatInterval = 4000;
        break;
      case 'safari':
        optimizations.checkInterval = 1500;
        optimizations.heartbeatInterval = 6000;
        break;
      case 'ie':
        optimizations.checkInterval = 2000;
        optimizations.heartbeatInterval = 8000;
        optimizations.timeoutMs = 15000;
        break;
    }

    return optimizations;
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserAdapter;
}
if (typeof window !== 'undefined') {
  window.BrowserAdapter = BrowserAdapter;
}
