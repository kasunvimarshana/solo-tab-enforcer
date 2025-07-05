import ObserveAll from 'observe-all';

new ObserveAll({
  onBlock: () => {
    alert('Another tab is already open!');
  },
});