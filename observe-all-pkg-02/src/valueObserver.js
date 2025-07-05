export function observeValue(obj, prop, callback) {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('observeValue target must be an object');
  }
  if (!(prop in obj)) {
    throw new Error(`Property ${prop} does not exist on target object`);
  }

  let value = obj[prop];

  const handler = {
    set(target, property, newValue) {
      if (property === prop && value !== newValue) {
        value = newValue;
        callback(newValue, target);
      }
      target[property] = newValue;
      return true;
    },
    get(target, property) {
      return target[property];
    },
  };

  return new Proxy(obj, handler);
}
