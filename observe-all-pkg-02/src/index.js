export default class ObserveAll {
  constructor({
    channelName = 'observe-all-channel',
    onBlock = () => alert('Another tab is already open.'),
    onFocus = () => {},
    onBlur = () => {},
  } = {}) {
    this.channelName = channelName;
    this.onBlock = onBlock;
    this.onFocus = onFocus;
    this.onBlur = onBlur;

    this.tabId = `${Date.now()}-${Math.random()}`;
    this.channel = new BroadcastChannel(this.channelName);
    this.isBlocked = false;

    this._bindEvents();
    this._announcePresence();
    this._startHeartbeat();
  }

  _bindEvents() {
    this.channel.onmessage = (event) => {
      console.debug(`onmessage : `, event);
      const { type, tabId } = event.data;
      if (tabId === this.tabId) return;

      switch (type) {
        case 'PRESENCE':
          this._sendAck(tabId);
          break;
        case 'ACK':
          this._handleBlock();
          break;
        case 'UNLOAD':
          this._checkIfStillBlocked();
          break;
      }
    };

    window.addEventListener('beforeunload', () => {
      this.channel.postMessage({ type: 'UNLOAD', tabId: this.tabId });
    });

    window.addEventListener('focus', () => {
      if (!this.isBlocked) this.onFocus();
    });

    window.addEventListener('blur', () => {
      if (!this.isBlocked) this.onBlur();
    });
  }

  _announcePresence() {
    this.channel.postMessage({ type: 'PRESENCE', tabId: this.tabId });
  }

  _sendAck(toTabId) {
    this.channel.postMessage({ type: 'ACK', tabId: toTabId });
  }

  _handleBlock() {
    this.isBlocked = true;
    this.onBlock();
  }

  _checkIfStillBlocked() {
    this.isBlocked = false;
    this._announcePresence();
  }

  _startHeartbeat(interval = 1000) {
    this.heartbeat = setInterval(() => {
      if (!this.isBlocked) this._announcePresence();
    }, interval);
  }

  destroy() {
    clearInterval(this.heartbeat);
    this.channel.close();
    this.isBlocked = false;
  }
}
