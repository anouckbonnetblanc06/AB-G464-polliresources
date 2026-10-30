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
//I changed this
function setupArrondissementSearch(features) {
  // Find the search box, suggestion list, status message, and results area in the HTML.
  const input = document.getElementById('arrondissement-search');
  const options = document.getElementById('arrondissement-options');
  const status = document.getElementById('arrondissement-status');
  const results = document.getElementById('arrondissement-results');

  // Trim extra spaces and ignore upper/lowercase differences when comparing text.
  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  // Get the arrondissement value from each record, remove blanks and duplicates,
  // then sort the names alphabetically for the suggestion list.
  const arrondissements = [...new Set(
    features
      .map(function (feature) {
        return feature.properties.arrondissement;
      })
      .filter(Boolean)
      .map(function (name) {
        return String(name).trim();
      })
  )].sort(function (a, b) {
    return a.localeCompare(b, 'fr');
  });

  // Add each arrondissement as an option that appears while the user types.
  options.replaceChildren(
    ...arrondissements.map(function (name) {
      const option = document.createElement('option');
      option.value = name;
      return option;
    })
  );

  // Run this code whenever the user types in or selects a search value.
  input.addEventListener('input', function () {
    const query = normalize(input.value);

    // Clear results from the previous search.
    results.replaceChildren();

    // If the search box is empty, prompt the user to enter a name.
    if (!query) {
      status.textContent = 'Type or select an arrondissement to see its locations.';
      return;
    }

    // Check whether the typed text matches a full arrondissement name.
    // Matching ignores capitalization and extra spaces.
    const selectedArrondissement = arrondissements.find(function (name) {
      return normalize(name) === query;
    });

    // If it isn't an exact match, ask the user to choose a suggested name.
    if (!selectedArrondissement) {
      status.textContent = 'Choose or type an arrondissement name from the suggestions.';
      return;
    }

    // Keep only the GeoJSON records for the selected arrondissement.
    const matches = features.filter(function (feature) {
      return normalize(feature.properties.arrondissement) === query;
    });

    // Show a message and stop if there are no matching records.
    if (matches.length === 0) {
      status.textContent = 'No locations found for ' + selectedArrondissement + '.';
      return;
    }

    // Create a group for each resource type, such as "graine" or "graine et outil".
    const groups = new Map();

    matches.forEach(function (feature) {
      const properties = feature.properties;

      // Use "Not specified" if a record has no resource value.
      const resource = String(properties.resources || '').trim() || 'Not specified';

      // Start an empty list the first time this resource type appears.
      if (!groups.has(resource)) {
        groups.set(resource, []);
      }

      // Add the record's name to the list for its resource type.
      groups.get(resource).push(properties.name || 'Unnamed site');
    });

    // Sort the resource groups alphabetically and display each group.
    [...groups.keys()].sort(function (a, b) {
      return a.localeCompare(b, 'fr');
    }).forEach(function (resource) {
      // Make a heading with the resource type.
      const heading = document.createElement('h3');
      heading.textContent = resource;
      results.appendChild(heading);

      // Make a list of record names for this resource type.
      const list = document.createElement('ul');

      // Sort names alphabetically, then add each one as a list item.
      groups.get(resource).sort(function (a, b) {
        return a.localeCompare(b, 'fr');
      }).forEach(function (name) {
        const item = document.createElement('li');
        item.textContent = name;
        list.appendChild(item);
      });

      // Add the finished list under its resource heading.
      results.appendChild(list);
    });

    // Tell the user how many records matched the selected arrondissement.
    status.textContent =
      matches.length + ' location(s) in ' + selectedArrondissement + '.';
  });
}

fetch('../data/polisources.geojson')
  .then(function (response) {
    if (!response.ok) { throw new Error('HTTP ' + response.status + ' loading grainotheque_mtl.geojson'); }
    return response.json();
  })
  .then(function (data) {
    setupArrondissementSearch(data.features);
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
