export default class ObserveAll {
  constructor({ onBlock, onFocus, onBlur, channelName } = {}) {
    this.channelName = channelName || 'observe-all';
    this.onBlock = onBlock || (() => alert('Another tab is already open.'));
    this.onFocus = onFocus || (() => {});
    this.onBlur = onBlur || (() => {});
    this.channel = null;
    this.tabId = `${Date.now()}-${Math.random()}`;
    this.isBlocked = false;
    this.isFocused = document.visibilityState === 'visible';

    this.init();
  }

  init() {
    this.setupChannel();
    this.listenVisibility();
    this.announce();

    if (document.visibilityState === 'visible') {
      this.sendMessage({ type: 'focus', tabId: this.tabId });
    }
  }

  setupChannel() {
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = this.handleMessage.bind(this);
    } else {
      // fallback using storage events
      window.addEventListener('storage', (e) => {
        if (e.key === this.channelName && e.newValue) {
          const msg = JSON.parse(e.newValue);
          this.handleMessage({ data: msg });
        }
      });
    }
  }

  listenVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.isFocused = true;
        this.sendMessage({ type: 'focus', tabId: this.tabId });
        this.onFocus();
      } else {
        this.isFocused = false;
        this.sendMessage({ type: 'blur', tabId: this.tabId });
        this.onBlur();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.sendMessage({ type: 'unload', tabId: this.tabId });
    });
  }

  handleMessage(event) {
    const { type, tabId } = event.data;
    if (!tabId || tabId === this.tabId) return;

    if (type === 'focus') {
      if (this.isFocused && !this.isBlocked) {
        this.isBlocked = true;
        this.onBlock();
      }
    }
  }

  sendMessage(message) {
    const fullMessage = { ...message, tabId: this.tabId };
    if (this.channel) {
      this.channel.postMessage(fullMessage);
    } else {
      localStorage.setItem(this.channelName, JSON.stringify(fullMessage));
      // remove to avoid triggering repeatedly
      setTimeout(() => localStorage.removeItem(this.channelName), 0);
    }
  }

  announce() {
    this.sendMessage({ type: 'ready', tabId: this.tabId });
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    window.removeEventListener('beforeunload', this.cleanup);
  }
}
