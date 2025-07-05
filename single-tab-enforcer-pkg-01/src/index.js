class SingleTabEnforcer {
    constructor(options = {}) {
        this.lockKey = options.lockKey || 'app-tab-lock';
        this.heartbeatKey = options.heartbeatKey || 'app-tab-heartbeat';
        this.heartbeatInterval = options.heartbeatInterval || 1000; // 1 second
        this.timeout = options.timeout || 3000; // 3 seconds until another tab is considered inactive
        this.tabId = Date.now() + "-" + Math.random(); // Unique tab ID
        this.heartbeatIntervalId = null;
        this.init();
    }

    // Set the lock for the primary tab
    setLock() {
        localStorage.setItem(this.lockKey, this.tabId);
    }

    // Clear the lock when the tab closes or reloads
    clearLock() {
        const current = localStorage.getItem(this.lockKey);
        if (current === this.tabId) {
            localStorage.removeItem(this.lockKey);
        }
    }

    // Start the heartbeat (keeping track of the active tab)
    startHeartbeat() {
        this.heartbeatIntervalId = setInterval(() => {
            localStorage.setItem(this.heartbeatKey, Date.now().toString());
        }, this.heartbeatInterval);
    }

    // Stop the heartbeat
    stopHeartbeat() {
        clearInterval(this.heartbeatIntervalId);
    }

    // Check if the current tab is the primary one
    isPrimaryTab() {
        const lock = localStorage.getItem(this.lockKey);
        const lastHeartbeat = parseInt(localStorage.getItem(this.heartbeatKey) || "0", 10);
        const now = Date.now();

        // Return true if no other tab or timeout has passed
        return !lock || (now - lastHeartbeat > this.timeout);
    }

    // Initialize the single-tab logic
    init() {
        if (this.isPrimaryTab()) {
            this.setLock();
            this.startHeartbeat();
        } else {
            this.onMultipleTabDetected();
            return;
        }

        // Release lock on unload
        window.addEventListener('beforeunload', () => {
            this.clearLock();
            this.stopHeartbeat();
        });

        // Listen for storage changes (when another tab modifies the lock)
        window.addEventListener('storage', (e) => {
            if (e.key === this.lockKey || e.key === this.heartbeatKey) {
                if (!this.isPrimaryTab()) {
                    this.onMultipleTabDetected();
                }
            }
        });
    }

    // Callback for multiple tab detection
    onMultipleTabDetected() {
        console.log("Multiple tab detected!");
        alert("App is already open in another tab.");
        // Optionally redirect or block the UI here
        document.body.innerHTML = "<h2>This app is already open in another tab.</h2>";
    }
}

export default SingleTabEnforcer;
