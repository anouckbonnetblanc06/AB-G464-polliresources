function (feature, latlng) {
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