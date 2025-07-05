export function observeEvent(target, eventType, callback, options = false) {
  if (!target || typeof target.addEventListener !== 'function') {
    throw new Error('Invalid target for observeEvent');
  }

  target.addEventListener(eventType, callback, options);

  return () => {
    target.removeEventListener(eventType, callback, options);
  };
}
