# Single Tab Enforcer

> Prevent multiple instances of your web application from running in different tabs.

**Single Tab Enforcer** is a small, lightweight package to enforce single-tab access to your web application. This ensures that only one tab can access the app at any given time, preventing multiple instances of the application from running.

---

## 🚀 Features

- ⚙️ Simple integration
- 🧠 Intelligent tab activity tracking
- 🕒 Configurable heartbeat & timeout intervals
- 💡 No external dependencies
- 🔐 Prevents session/data inconsistencies

---

## 📦 Installation

Install via npm:

```bash
npm install single-tab-enforcer
```

## 🛠️ Usage

```ts
import SingleTabEnforcer from 'single-tab-enforcer';

new SingleTabEnforcer({
  lockKey: 'custom-lock-key',             // Optional: Custom lock key (default: 'app-tab-lock')
  heartbeatKey: 'custom-heartbeat-key',   // Optional: Custom heartbeat key (default: 'app-tab-heartbeat')
  heartbeatInterval: 1000,                // Optional: Interval for heartbeat in milliseconds (default: 1000)
  timeout: 3000                           // Optional: Timeout for detecting tab inactivity in milliseconds (default: 3000)
});
```