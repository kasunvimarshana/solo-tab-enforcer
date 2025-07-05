# observe-all

> Prevent users from opening and interacting with your web app in multiple tabs.

## 📦 Installation

Install via npm:

```bash
npm install observe-all
```

## 🛠️ Usage

```ts
import ObserveAll from 'observe-all';

new ObserveAll({
  onBlock: () => {
    alert('Another tab is already open!');
  },
});
```
