export function observeMutations(
  targetNode,
  callback,
  options = { childList: true, subtree: true }
) {
  if (!targetNode || typeof callback !== 'function') {
    throw new Error('Invalid parameters for observeMutations');
  }

  const observer = new MutationObserver((mutationsList) => {
    callback(mutationsList, observer);
  });

  observer.observe(targetNode, options);

  return () => {
    observer.disconnect();
  };
}
