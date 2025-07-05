/**
 * Cross-browser compatibility utilities
 */

class CrossBrowserCompat {
  /**
   * Check if running in browser environment
   */
  static isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Check if running in Node.js environment
   */
  static isNode() {
    return (
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.node
    );
  }

  /**
   * Get browser information
   */
  static getBrowserInfo() {
    if (!this.isBrowser()) {
      return { name: 'unknown', version: 'unknown' };
    }

    const ua = navigator.userAgent;
    let browserName = 'unknown';
    let browserVersion = 'unknown';

    // Chrome
    if (ua.indexOf('Chrome') > -1) {
      browserName = 'chrome';
      browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
    }
    // Firefox
    else if (ua.indexOf('Firefox') > -1) {
      browserName = 'firefox';
      browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
    }
    // Safari
    else if (ua.indexOf('Safari') > -1) {
      browserName = 'safari';
      browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'unknown';
    }
    // Edge
    else if (ua.indexOf('Edge') > -1) {
      browserName = 'edge';
      browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || 'unknown';
    }
    // IE
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browserName = 'ie';
      browserVersion = ua.match(/(MSIE|rv:)(\d+)/)?.[2] || 'unknown';
    }

    return { name: browserName, version: browserVersion };
  }

  /**
   * Check feature support
   */
  static checkFeatureSupport() {
    if (!this.isBrowser()) {
      return {
        localStorage: false,
        sessionStorage: false,
        broadcastChannel: false,
        visibilityAPI: false,
        storageEvents: false,
      };
    }

    return {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      visibilityAPI: typeof document.visibilityState !== 'undefined',
      storageEvents: typeof window.addEventListener !== 'undefined',
    };
  }

  /**
   * Polyfill for older browsers
   */
  static applyPolyfills() {
    if (!this.isBrowser()) {
      return;
    }

    // Polyfill for Object.assign (IE)
    if (!Object.assign) {
      Object.assign = function (target, ...sources) {
        if (target == null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        const to = Object(target);
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          if (source != null) {
            for (const key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                to[key] = source[key];
              }
            }
          }
        }
        return to;
      };
    }

    // Polyfill for Array.prototype.includes (IE)
    if (!Array.prototype.includes) {
      Array.prototype.includes = function (searchElement, fromIndex) {
        if (this == null) {
          throw new TypeError(
            'Array.prototype.includes called on null or undefined'
          );
        }

        const o = Object(this);
        const len = parseInt(o.length) || 0;
        if (len === 0) {
          return false;
        }

        const n = parseInt(fromIndex) || 0;
        let k = n >= 0 ? n : Math.max(len + n, 0);

        while (k < len) {
          if (o[k] === searchElement) {
            return true;
          }
          k++;
        }
        return false;
      };
    }

    // Polyfill for String.prototype.includes (IE)
    if (!String.prototype.includes) {
      String.prototype.includes = function (search, start) {
        if (typeof start !== 'number') {
          start = 0;
        }

        if (start + search.length > this.length) {
          return false;
        } else {
          return this.indexOf(search, start) !== -1;
        }
      };
    }
  }

  /**
   * Get storage implementation based on browser support
   */
  static getStorageImplementation() {
    if (!this.isBrowser()) {
      return null;
    }

    const support = this.checkFeatureSupport();

    if (support.localStorage) {
      return localStorage;
    } else if (support.sessionStorage) {
      return sessionStorage;
    } else {
      // Fallback to cookie-based storage
      return this.getCookieStorage();
    }
  }

  /**
   * Cookie-based storage fallback
   */
  static getCookieStorage() {
    return {
      getItem: function (key) {
        const name = key + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
          }
        }
        return null;
      },
      setItem: function (key, value) {
        document.cookie = key + '=' + value + ';path=/';
      },
      removeItem: function (key) {
        document.cookie =
          key + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
      },
    };
  }

  /**
   * Generate unique ID across browsers
   */
  static generateUniqueId() {
    if (
      this.isBrowser() &&
      typeof crypto !== 'undefined' &&
      crypto.getRandomValues
    ) {
      // Use crypto API for better randomness
      const array = new Uint32Array(2);
      crypto.getRandomValues(array);
      return array[0].toString(36) + array[1].toString(36);
    } else {
      // Fallback to Math.random
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
  }

  /**
   * Add event listener with cross-browser support
   */
  static addEventListener(element, event, handler, options) {
    if (!this.isBrowser()) {
      return;
    }

    if (element.addEventListener) {
      element.addEventListener(event, handler, options);
    } else if (element.attachEvent) {
      // IE8 and below
      element.attachEvent('on' + event, handler);
    } else {
      // Very old browsers
      element['on' + event] = handler;
    }
  }

  /**
   * Remove event listener with cross-browser support
   */
  static removeEventListener(element, event, handler, options) {
    if (!this.isBrowser()) {
      return;
    }

    if (element.removeEventListener) {
      element.removeEventListener(event, handler, options);
    } else if (element.detachEvent) {
      // IE8 and below
      element.detachEvent('on' + event, handler);
    } else {
      // Very old browsers
      element['on' + event] = null;
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrossBrowserCompat;
}
if (typeof window !== 'undefined') {
  window.CrossBrowserCompat = CrossBrowserCompat;
}
