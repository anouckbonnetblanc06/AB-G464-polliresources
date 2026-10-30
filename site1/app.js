// BEHAVIOUR: Lab 3 solution (TA copy). Parts 6 to 8 done.

// PART 7: preferCanvas draws every circle on one canvas instead of one web page
// element per pipe. That is the difference between 20 seconds and half a second.
const map = L.map('map', { preferCanvas: true }).setView([45.51489, -73.64342], 11);
const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const LIMIT = Infinity;   // PART 6: all of them

// PART 8: one colour per flow type.
const resourceTypes = { //Ichanged this
  'jardin communautaire': { symbol: '🌳', label: 'Community Garden' },
  'graine': { symbol: '🌼', label: 'Seed' },
  'graine et outil': { symbol: '🔧', label: 'Seed and Tool' },
  other: { symbol: '🌱', label: 'Other' }
};
//I changed this: hexagons fillage with honey
function colourFor(pct) {
  if (pct >= 75) return '#ffc125';
  if (pct >= 50) return '#ffd700';
  if (pct >= 25) return '#f0e374';
  if (pct > 0)   return '#ebe49c';
  return '#fef0d9';
}

// Two files at once: Promise.all waits until both have loaded, then gives us both.
Promise.all([
  fetch('../data/ruelle_grid.geojson').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' loading sewer_grid.geojson'); return r.json(); }),
  fetch('../data/in_very_good_state_ruelles.geojson').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' loading combined_sewers.geojson'); return r.json(); })
]).then(function (files) {
  const grid = files[0];
  const pipes = files[1];

  // LAYER 1: the squares, styled by a value.
  const gridLayer = L.geoJSON(grid, {
    style: function (feature) {
      return {
        color: '#666666', weight: 0.5, fillOpacity: 10,
        fillColor: colourFor(feature.properties.very_good_state_pct)          // PART 4a: colour each square by its share of combined pipes
      };
    },
    onEachFeature: function (feature, layer) {
      const p = feature.properties;
      layer.bindPopup('<strong>' + p.very_good_state_pct + '% green streets</strong><br>' +
        p.in_very_good_state + ' of ' + p.original_state + '  green streets in this hexagon');
    }
  }).addTo(map);

  // LAYER 2: the combined pipes as small dots. Not added to the map yet:
  // the reader switches it on (Part 4c).
  const pipeLayer = L.geoJSON(pipes, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, { radius: 2, weight: 0, fillOpacity: 0.8, fillColor: '#1F2D5A' });
    },
    onEachFeature: function (feature, layer) {
      const p = feature.properties;
      layer.bindPopup('<strong>Green Streets</strong><br>Surface Condition: ' + (p.original_condition_surface || 'not recorded') + '<br>Length: ' + p.length_m + ' m');
    }
  }).addTo(map);

  // PART 4b: the legend. Select the lines below and press Ctrl+/ to switch them on.
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'legend');
    const rows = [[75, '75% or more'], [50, '50 to 74%'], [25, '25 to 49%'], [1, 'under 25%'], [0, 'none']];
    div.innerHTML = '<strong>Green streets in a very good state </strong>' + rows.map(function (r) {
      return '<i style="background:' + colourFor(r[0]) + '"></i>' + r[1];
    }).join('<br>');
    return div;
  };
  legend.addTo(map);

  // PART 4c: the layer switcher. Write one line here (the handout has it).
  L.control.layers(
    { 'Streets': streets },
    { 'Zone containing green streets': gridLayer, 'Green streets in very good state': pipeLayer },
    { collapsed: false }
  ).addTo(map);


  document.getElementById('status').textContent =
    grid.features.length + ' hexagons of 500m sides, ' + pipes.features.length + ' green streets';
}).catch(function (err) {
  document.getElementById('status').textContent =
    'Could not load the data. Run the notebook first, open the page with Live Server, and look at the console (F12).';
  console.error(err);
});

//Ends here

fetch('../data/polisources.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading grainotheque_mtl.geojson'); }
    return response.json();
  })
  .then(function (data) {
    const shown = { type: 'FeatureCollection', features: data.features.slice(0, LIMIT) };

    L.geoJSON(shown, {
      // PART 7: a small circle instead of the default pin.
      pointToLayer: function (feature, latlng) { // I changed this
        const type = (feature.properties.resources || '').trim().toLowerCase();
        const marker = resourceTypes[type] || resourceTypes.other;

        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'resource-marker',
            html: '<span role="img" aria-label="' + marker.label + '">' +
              marker.symbol + '</span>',
            iconSize: [34, 34],
            iconAnchor: [17, 17],
            popupAnchor: [0, -17]
          })
        });
      },

      // PART 8: a popup built from the properties the notebook wrote.
      onEachFeature: function (feature, layer) { // I changed this
        const p = feature.properties;
        const internet = p['site.internet'];
        const name = p.name || 'Unnamed site';
        let title = name;
        if (typeof internet === 'string') {
          try {
            const url = new URL(internet);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              title = '<a href="' + url.href + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
            }
          } catch {
            // Keep the site name when internet isn't a valid URL.
          }
        }
        layer.bindPopup('<strong>' + title  + '</strong><br>' +
          'Address: ' + (p.adresse || 'not recorded') + '<br>' +
          'Resources: ' + (p.resources || 'not recorded') + '<br>' +
          'Availability: ' + (p.dispo || 'not recorded') + '<br>');
      },
    }).addTo(map);

    // Layer C: a legend. 
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = Object.values(resourceTypes).map(function (item) { // I changed this
        return '<span class="resource-symbol">' + item.symbol + '</span>' + item.label;
      }).join('<br>');
      return div;
    };
    legend.addTo(map);

    document.getElementById('status').textContent =
      shown.features.length + ' of ' + data.features.length + ' grainotheques shown';
  }).catch(function (err) {
    document.getElementById('status').textContent =
      'Could not load grainotheque_mtl.geojson. Open the console (F12) for details.';
    console.error(err);
  });
