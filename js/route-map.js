(function () {
  'use strict';

  // Needs Leaflet and a JSON config (#nmapData). If either is missing, the page keeps its fallback content.
  var dataEl = document.getElementById('nmapData');
  var holders = Array.prototype.slice.call(document.querySelectorAll('.nmap-real'));
  if (!window.L || !dataEl || !holders.length) return;

  var CFG;
  try { CFG = JSON.parse(dataEl.textContent); } catch (e) { return; }

  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  // line styles by type
  var STYLE = {
    walk:  { color: '#c7622b', weight: 4, dashArray: '1 9' },
    metro: { color: '#7a5cc0', weight: 5 },
    funi:  { color: '#3f8a52', weight: 6 },
    bus:   { color: '#3b6fb6', weight: 5, dashArray: '8 8' },
    train: { color: '#d0494f', weight: 5, dashArray: '10 6' },
    ferry: { color: '#1f93a8', weight: 5, dashArray: '2 9' },
    move:  { color: '#8a8478', weight: 3, dashArray: '6 8' }
  };

  holders.forEach(function (holder) {
    var id = holder.dataset.map || 'main';
    var cfg = CFG[id] || {};
    var pins = Array.prototype.slice.call(document.querySelectorAll('.nmap-pin[data-lat]')).filter(function (a) {
      return (a.dataset.map || 'main') === id;
    });
    if (!pins.length) return;

    var schematic = holder.parentNode.querySelector('.nmap-canvas');
    holder.hidden = false;
    if (schematic) schematic.hidden = true;

    var map = L.map(holder, {
      scrollWheelZoom: false,
      dragging: !isTouch,
      tap: false,
      zoomSnap: 0.25,
      attributionControl: true
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    var P = {};
    pins.forEach(function (a) { P[a.dataset.key] = [parseFloat(a.dataset.lat), parseFloat(a.dataset.lng)]; });

    // a point is either a pin number or [lat, lng]
    function ll(p) { return typeof p === 'number' ? P[p] : p; }

    (cfg.lines || []).forEach(function (l) {
      var s = STYLE[l.t] || STYLE.move;
      L.polyline(l.pts.map(ll), {
        color: s.color, weight: s.weight, opacity: 0.9, dashArray: s.dashArray || null, lineCap: 'round', lineJoin: 'round'
      }).addTo(map);
    });

    (cfg.dots || []).forEach(function (d) {
      var s = STYLE[d.t] || STYLE.move;
      L.circleMarker(d.at, { radius: 5, color: s.color, weight: 3, fillColor: '#fff', fillOpacity: 1 }).addTo(map);
    });

    var size = isTouch ? 36 : 42;
    pins.forEach(function (a) {
      var wrap = document.createElement('div');
      wrap.className = 'nmap-real-icon';
      wrap.appendChild(a);
      L.marker(P[a.dataset.key], {
        icon: L.divIcon({ html: wrap, className: 'nmap-real-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        keyboard: false,
        riseOnHover: true
      }).addTo(map);
    });

    (cfg.tags || []).forEach(function (t) {
      var at = t.at;
      if (t.mid) {
        var a = ll(t.mid[0]), b = ll(t.mid[1]);
        at = [(a[0] + b[0]) / 2 + (t.dlat || 0), (a[1] + b[1]) / 2 + (t.dlng || 0)];
      }
      L.marker(at, {
        interactive: false,
        icon: L.divIcon({ html: '<span class="nmap-tag nmap-tag--real">' + t.text + '</span>', className: 'nmap-real-tag', iconSize: [0, 0] })
      }).addTo(map);
    });

    map.fitBounds(L.latLngBounds(pins.map(function (a) { return P[a.dataset.key]; })).pad(cfg.pad || 0.1));

    // Leaflet needs a size recalculation if the layout moved after load
    window.addEventListener('load', function () { map.invalidateSize(); });
  });
})();
