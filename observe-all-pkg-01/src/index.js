class ObserveAll {
  constructor({ onBlock, onFocus, onBlur, channelName } = {}) {
    this.channelName = channelName || 'observe-all';
    this.onBlock = onBlock || (() => alert('Another tab is already open.'));
    this.onFocus = onFocus || (() => {});
    this.onBlur = onBlur || (() => {});
    this.channel = null;
    this.tabId = `${Date.now()}-${Math.random()}`;
    this.isBlocked = false;
    this.timeout = null;

    this.init();
  }

  init() {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported');
      return;
    }

    this.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessage = this.handleMessage.bind(this);

    this.sendPing();

    // Wait to detect other tabs
    this.timeout = setTimeout(() => {
      if (!this.isBlocked) {
        this.listenForPings();
      }
    }, 300);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.onFocus();
      else this.onBlur();
    });

    window.addEventListener('beforeunload', () => this.channel.close());
  }

  sendPing() {
    this.channel.postMessage({ type: 'ping', sender: this.tabId });
  }

  handleMessage(event) {
    const { type, sender } = event.data;
    if (sender === this.tabId) return;

    if (type === 'ping') {
      this.channel.postMessage({ type: 'pong', sender: this.tabId });
    }

    if (type === 'pong') {
      this.blockTab();
    }
  }

  listenForPings() {
    this.channel.onmessage = (event) => {
      const { type, sender } = event.data;
      if (sender === this.tabId) return;

      if (type === 'ping') {
        this.channel.postMessage({ type: 'pong', sender: this.tabId });
      }
    };
  }

  blockTab() {
    if (!this.isBlocked) {
      this.isBlocked = true;
      clearTimeout(this.timeout);
      this.onBlock();
    }
  }
}

export default ObserveAll;
