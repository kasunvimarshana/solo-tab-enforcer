import ObserveAll from 'observe-all';

new ObserveAll({
  onBlock: () => {
    alert('Another tab is already open!');
  },
});

new ObserveAll({
  onBlock: () => {
    alert('Another tab is already open. This tab will now close.');
    // window.open('', '_self'); // Required to allow closing in some browsers
    window.close();

    // Fallback for browsers that prevent `window.close()` unless opened via script
    setTimeout(() => {
      document.body.innerHTML = '<h2>This tab is blocked because another is already active.</h2>';
      document.body.style.pointerEvents = 'none';
    }, 100);
  },
});
