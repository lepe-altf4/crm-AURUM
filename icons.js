// AURUM CRM — Icons (set Lucide, stroke-based, consistente)
// Todos los paths corresponden a iconos del set Lucide (lucide.dev)
// Stroke 2, linecap/join round, 24x24 viewBox — defaults oficiales de Lucide
window.Icon = function Icon(name, size) {
  const e = React.createElement;
  const s = size || 16;
  const props = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };

  const sets = {
    // lucide: users
    leads: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M22 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    // lucide: kanban
    pipeline: [
      'M5 3a2 2 0 0 0-2 2',
      'M19 3a2 2 0 0 1 2 2',
      'M21 19a2 2 0 0 1-2 2',
      'M5 21a2 2 0 0 1-2-2',
      'M9 3h1',
      'M9 21h1',
      'M14 3h1',
      'M14 21h1',
      'M3 9v1',
      'M21 9v1',
      'M3 14v1',
      'M21 14v1',
      'M8 7v7',
      'M12 7v4',
      'M16 7v9',
    ],
    // lucide: package
    stock: [
      'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
      'M12 22V12',
      'm3.3 7 8.7 5 8.7-5',
      'm7.5 4.27 9 5.15',
    ],
    // lucide: layout-dashboard
    dash: [
      'M3 3h7v9H3z',
      'M14 3h7v5h-7z',
      'M14 12h7v9h-7z',
      'M3 16h7v5H3z',
    ],
    // lucide: settings
    settings: [
      'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    ],
    // lucide: search
    search: [
      'm21 21-4.34-4.34',
      'M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
    ],
    // lucide: plus
    plus: ['M5 12h14', 'M12 5v14'],
    // lucide: message-circle (proxy WhatsApp)
    wa: [
      'M7.9 20A9 9 0 1 0 4 16.1L2 22z',
    ],
    // lucide: arrow-right
    arrowRight: ['M5 12h14', 'm12 5 7 7-7 7'],
    // lucide: x
    close: ['M18 6 6 18', 'M6 6l12 12'],
    // lucide: more-horizontal
    more: [
      'M5 12a1 1 0 1 0 0 .01',
      'M12 12a1 1 0 1 0 0 .01',
      'M19 12a1 1 0 1 0 0 .01',
    ],
    // lucide: car
    car: [
      'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2',
      'M14 17H9',
      'M6.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
      'M16.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    ],
    // lucide: pencil
    edit: [
      'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      'm15 5 4 4',
    ],
    // lucide: grip-vertical
    drag: [
      'M9 5a1 1 0 1 0 0 .01',
      'M9 12a1 1 0 1 0 0 .01',
      'M9 19a1 1 0 1 0 0 .01',
      'M15 5a1 1 0 1 0 0 .01',
      'M15 12a1 1 0 1 0 0 .01',
      'M15 19a1 1 0 1 0 0 .01',
    ],
    // lucide: trending-up
    trend: [
      'M16 7h6v6',
      'm22 7-8.5 8.5-5-5L2 17',
    ],
    // lucide: dollar-sign
    money: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    // lucide: target
    target: [
      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
      'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    ],
    // lucide: shopping-bag
    bag: [
      'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
      'M3 6h18',
      'M16 10a4 4 0 0 1-8 0',
    ],
    // lucide: sliders-horizontal
    filter: [
      'M21 4H14',
      'M10 4H3',
      'M21 12h-9',
      'M8 12H3',
      'M21 20h-7',
      'M10 20H3',
      'M14 2v4',
      'M8 10v4',
      'M10 18v4',
    ],
    // lucide: chevron-right
    chevron: ['m9 18 6-6-6-6'],
  };

  const paths = sets[name] || sets.more;
  return e('svg', props, paths.map((d, i) => e('path', { d, key: i })));
};
