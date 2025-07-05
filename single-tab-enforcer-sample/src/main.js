import SingleTabEnforcer from 'single-tab-enforcer';

new SingleTabEnforcer({
  lockKey: 'custom-lock-key',             // Optional: Custom lock key (default: 'app-tab-lock')
  heartbeatKey: 'custom-heartbeat-key',   // Optional: Custom heartbeat key (default: 'app-tab-heartbeat')
  heartbeatInterval: 1000,                // Optional: Interval for heartbeat in milliseconds (default: 1000)
  timeout: 3000                           // Optional: Timeout for detecting tab inactivity in milliseconds (default: 3000)
});