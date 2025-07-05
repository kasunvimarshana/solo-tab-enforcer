export function observeIntersections(
  elements,
  callback,
  options = { root: null, rootMargin: '0px', threshold: 0 }
) {
  if (!elements)
    throw new Error('No elements provided for observeIntersections');
  const elems = Array.isArray(elements) ? elements : [elements];

  const observer = new IntersectionObserver((entries, obs) => {
    callback(entries, obs);
  }, options);

  elems.forEach((el) => observer.observe(el));

  return () => {
    elems.forEach((el) => observer.unobserve(el));
    observer.disconnect();
  };
}
