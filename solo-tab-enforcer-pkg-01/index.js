// index.js (CommonJS entry point)
const SoloTabEnforcer = require('./lib/SoloTabEnforcer');
const TabObserver = require('./lib/TabObserver');
const ReactSoloTabEnforcer = require('./lib/ReactSoloTabEnforcer');

module.exports = {
  SoloTabEnforcer,
  TabObserver,
  ReactSoloTabEnforcer,
  // Convenience exports
  createEnforcer: SoloTabEnforcer.create,
  createObserver: TabObserver.create,
};
