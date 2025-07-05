export function observeResizes(elements, callback) {
  if (!elements) throw new Error('No elements provided for observeResizes');
  const elems = Array.isArray(elements) ? elements : [elements];

  const observer = new ResizeObserver((entries) => {
    callback(entries, observer);
  });

  elems.forEach((el) => observer.observe(el));

  return () => {
    elems.forEach((el) => observer.unobserve(el));
    observer.disconnect();
  };
}
