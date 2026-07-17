/* ==========================================
   Nexshipment — Main App JavaScript
   ==========================================
   Modules:
     1. Supabase Client
     2. Map Controller
     3. Tracking Engine
     4. UI Controller
     5. Animation Controller
     6. Quote Form
     7. Utilities
*/

'use strict';

// ─────────────────────────────────────────
// 1. SUPABASE CLIENT
// ─────────────────────────────────────────
const SUPABASE_URL = 'https://kuendlwvbcqcywkyixsn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZW5kbHd2YmNxY3l3a3lpeHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxODY4MDYsImV4cCI6MjA5OTc2MjgwNn0.gAcC5lt1j-FMP5ovy5kDjuCgiW532WdVfHpnr4L-EME';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ─────────────────────────────────────────
// 2. MAP CONTROLLER
// ─────────────────────────────────────────
const MapController = (() => {
  let map = null;
  let transportMarker = null;
  let originMarker = null;
  let destMarker = null;
  let routePolyline = null;
  let realtimeChannel = null;
  let currentShipmentId = null;
  let isMapReady = false;

  // Crystal-clear Midnight style
  const MIDNIGHT_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1a2744' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#aec9d4' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1e38' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#3d6680' }, { weight: 1.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#2d5266' }, { weight: 0.8 }] },
    { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#d4e8f0' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1a2744' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#1e2f50' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#243a5e' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e4060' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#061422' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d7090' }] },
  ];

  // Transport icon SVGs
  function getTransportSVGDataURI(type) {
    const svgs = {
      plane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
        <circle cx="28" cy="28" r="26" fill="#050A30" stroke="#FF8C00" stroke-width="2.5"/>
        <path d="M42 22 L28 36 L14 22 L28 27 Z" fill="#FF8C00"/>
        <path d="M24 31 L20 44 L28 40 L36 44 L32 31" fill="#FF8C00" opacity="0.75"/>
        <circle cx="28" cy="26" r="3" fill="white" opacity="0.5"/>
      </svg>`,
      ship: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 44" width="64" height="44">
        <path d="M6 22 Q32 13 58 22 L54 38 Q32 44 10 38 Z" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <rect x="20" y="5" width="24" height="18" rx="3" fill="#050A30" stroke="#FF8C00" stroke-width="1.5"/>
        <rect x="24" y="8" width="8" height="10" rx="1.5" fill="rgba(255,140,0,0.35)"/>
        <line x1="32" y1="2" x2="32" y2="7" stroke="#FF8C00" stroke-width="2"/>
        <polygon points="32,2 37,6 32,8" fill="#FF8C00"/>
        <circle cx="16" cy="30" r="3" fill="#FF8C00" opacity="0.8"/>
        <circle cx="32" cy="31" r="3" fill="#FF8C00" opacity="0.8"/>
        <circle cx="48" cy="30" r="3" fill="#FF8C00" opacity="0.8"/>
      </svg>`,
      bus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 46" width="72" height="46">
        <rect x="4" y="4" width="64" height="30" rx="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <rect x="8" y="8" width="14" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <rect x="26" y="8" width="14" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <rect x="44" y="8" width="14" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <circle cx="16" cy="40" r="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <circle cx="56" cy="40" r="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <circle cx="16" cy="40" r="2" fill="#FF8C00"/>
        <circle cx="56" cy="40" r="2" fill="#FF8C00"/>
      </svg>`,
      train: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 46" width="78" height="46">
        <rect x="2" y="2" width="74" height="28" rx="5" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <rect x="2" y="22" width="74" height="8" rx="3" fill="#FF8C00" opacity="0.35"/>
        <rect x="7" y="6" width="16" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <rect x="29" y="6" width="16" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <rect x="51" y="6" width="16" height="12" rx="2" fill="rgba(255,140,0,0.3)"/>
        <circle cx="16" cy="40" r="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <circle cx="39" cy="40" r="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <circle cx="62" cy="40" r="6" fill="#050A30" stroke="#FF8C00" stroke-width="2"/>
        <circle cx="16" cy="40" r="2" fill="#FF8C00"/>
        <circle cx="39" cy="40" r="2" fill="#FF8C00"/>
        <circle cx="62" cy="40" r="2" fill="#FF8C00"/>
      </svg>`,
    };
    const svg = (svgs[type] || svgs.plane).trim();
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function getTransportSize(type) {
    const s = { plane:[56,56], ship:[64,44], bus:[72,46], train:[78,46] };
    const [w,h] = s[type] || s.plane;
    return new google.maps.Size(w, h);
  }

  function getTransportAnchor(type) {
    const a = { plane:[28,28], ship:[32,22], bus:[36,23], train:[39,23] };
    const [x,y] = a[type] || a.plane;
    return new google.maps.Point(x, y);
  }

  function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    map = new google.maps.Map(mapEl, {
      center: { lat: 20, lng: 25 },
      zoom: 3,
      styles: MIDNIGHT_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      gestureHandling: 'cooperative',
      backgroundColor: '#061422',
    });

    isMapReady = true;

    if (window._pendingShipmentRender) {
      const { shipment } = window._pendingShipmentRender;
      drawShipmentOnMap(shipment);
      delete window._pendingShipmentRender;
    } else if (window._pendingMapCoords) {
      placeMarker(window._pendingMapCoords.lat, window._pendingMapCoords.lng, 'plane');
      delete window._pendingMapCoords;
    }
  }

  // ─── Geocode a text address → { lat, lng } using OpenStreetMap Nominatim (free, no key needed) ───
  async function geocodeAddress(address) {
    const encoded = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'NexshipmentTrace/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      throw new Error('No results for: ' + address);
    } catch (e) {
      throw new Error('Geocode failed: ' + e.message);
    }
  }

  // additional markers array for checkpoints
  let checkpointMarkers = [];
  let traveledPolyline = null;
  let plannedPolyline = null;
  let directPolyline = null;

  // ─── stop markers, pulse overlay & animation engine ───
  let routeStopMarkers = [];
  let pulseOverlay = null;
  let PulseOverlayClass = null;
  let _animFrameId = null;       // requestAnimationFrame handle
  let _animLoopCount = 0;        // how many times the current segment looped
  let _lastShipmentState = null; // cache for realtime re-render

  // ─── Lazy-init PulseOverlay (needs google.maps API to be loaded first) ───
  function ensurePulseOverlayClass() {
    if (PulseOverlayClass) return;
    if (!document.getElementById('gft-map-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'gft-map-pulse-style';
      style.textContent = `
        @keyframes gftMapPulse {
          0%   { transform: scale(0.7); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    PulseOverlayClass = class extends google.maps.OverlayView {
      constructor(pos) { super(); this._pos = pos; this._div = null; }
      onAdd() {
        const d = document.createElement('div');
        d.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;z-index:5;';
        d.innerHTML = `
          <div style="position:absolute;width:72px;height:72px;margin-left:-36px;margin-top:-36px;border-radius:50%;border:3px solid #FF8C00;animation:gftMapPulse 1.9s ease-out infinite;opacity:0;"></div>
          <div style="position:absolute;width:72px;height:72px;margin-left:-36px;margin-top:-36px;border-radius:50%;border:2px solid rgba(255,140,0,0.5);animation:gftMapPulse 1.9s ease-out 0.65s infinite;opacity:0;"></div>
        `;
        this._div = d;
        this.getPanes().overlayMouseTarget.appendChild(d);
      }
      draw() {
        if (!this._div) return;
        const p = this.getProjection().fromLatLngToDivPixel(this._pos);
        this._div.style.left = p.x + 'px';
        this._div.style.top  = p.y + 'px';
      }
      onRemove() { if (this._div) { this._div.parentNode?.removeChild(this._div); this._div = null; } }
      moveTo(pos) { this._pos = pos; this.draw(); }
    };
  }

  // ─────────────────────────────────────────────────────
  // Render route using stops array (DB or auto-generated)
  // ─────────────────────────────────────────────────────
  function _renderRouteWithStops(stops, currentStopIndex, shipment, transportType) {
    clearRouteVisualization(); // also stops any active animation
    ensurePulseOverlayClass();
    _lastShipmentState = { stops, currentStopIndex, shipment, transportType };

    const status     = (shipment.status || '').trim();
    const isOnHold   = status === 'On Hold';
    const isDelivered = status === 'Delivered';
    const isInTransit = status === 'In Transit';

    const sorted = [...stops].sort((a, b) => a.stop_index - b.stop_index);
    const total  = sorted.length;
    const clampedIdx = Math.max(0, Math.min(currentStopIndex, total - 1));
    const allCoords  = sorted.map(s => ({ lat: parseFloat(s.lat), lng: parseFloat(s.lng) }));
    const startCoord = allCoords[clampedIdx];
    const nextCoord  = clampedIdx < total - 1 ? allCoords[clampedIdx + 1] : null;

    // ── 1. Route lines ──────────────────────────────────────
    // Traveled segment (solid green): origin → current stop
    if (clampedIdx > 0) {
      traveledPolyline = new google.maps.Polyline({
        path: allCoords.slice(0, clampedIdx + 1),
        geodesic: true, strokeColor: '#22c55e', strokeOpacity: 1, strokeWeight: 3.5,
        map, zIndex: 2,
      });
    }
    // Planned segment (dashed purple): current stop → destination
    if (clampedIdx < total - 1) {
      plannedPolyline = new google.maps.Polyline({
        path: allCoords.slice(clampedIdx),
        geodesic: true, strokeOpacity: 0,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, strokeColor: '#7c3aed', scale: 2.5 }, offset: '0', repeat: '14px' }],
        map, zIndex: 1,
      });
    }

    // ── 2. Stop markers ─────────────────────────────────────
    sorted.forEach((stop, idx) => {
      const pos     = { lat: parseFloat(stop.lat), lng: parseFloat(stop.lng) };
      const isOrigin  = idx === 0;
      const isDest    = idx === total - 1;
      const isPast    = idx < clampedIdx;
      const isCurrent = idx === clampedIdx;
      const isNext    = idx === clampedIdx + 1;

      if (isOrigin) {
        // Origin: checkered flag
        const passedOrigin = clampedIdx > 0;
        const originSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
          <circle cx="22" cy="22" r="20" fill="${passedOrigin ? '#22c55e' : '#5b21b6'}" stroke="white" stroke-width="2"/>
          <text x="22" y="28" text-anchor="middle" font-size="18" fill="white">${passedOrigin ? '\u2713' : '\uD83C\uDFC1'}</text>
        </svg>`;
        const m = new google.maps.Marker({
          position: pos, map,
          title: stop.name || shipment.origin || 'Origin',
          icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(originSvg), scaledSize: new google.maps.Size(44,44), anchor: new google.maps.Point(22,22) },
          zIndex: 10,
        });
        addMapInfoWindow(m, `<div style="font-family:Inter,sans-serif;padding:12px 16px;min-width:200px;">
          <div style="font-weight:700;color:#5b21b6;font-size:13px;margin-bottom:6px;">\uD83C\uDFC1 Departure</div>
          <div style="color:#111;font-size:13px;font-weight:600;">${stop.name || shipment.origin || 'Origin'}</div>
          <div style="background:#f0fdf4;border-radius:6px;padding:4px 8px;margin-top:8px;font-size:11px;color:#16a34a;font-weight:600;">${passedOrigin ? '\u2705 Departed' : '\uD83D\uDCCD Starting point'}</div>
        </div>`);
        routeStopMarkers.push(m);

      } else if (isDest) {
        // Destination: orange teardrop (green if delivered)
        const destColor = isDelivered ? '#16a34a' : '#FF8C00';
        const m = new google.maps.Marker({
          position: pos, map,
          title: stop.name || shipment.destination || 'Destination',
          icon: { path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z', fillColor: destColor, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2.5, scale: 1.2, anchor: new google.maps.Point(0, 0) },
          zIndex: 10,
        });
        addMapInfoWindow(m, `<div style="font-family:Inter,sans-serif;padding:12px 16px;min-width:200px;">
          <div style="font-weight:700;color:${destColor};font-size:13px;margin-bottom:6px;">${isDelivered ? '\uD83C\uDF89 Delivered!' : '\uD83C\uDFAF Destination'}</div>
          <div style="color:#111;font-size:13px;font-weight:600;">${stop.name || shipment.destination || 'Destination'}</div>
          <div style="background:${isDelivered ? '#f0fdf4' : '#fff7ed'};border-radius:6px;padding:4px 8px;margin-top:8px;font-size:11px;color:${destColor};font-weight:600;">${isDelivered ? '\u2705 Package delivered' : '\u23F3 Awaiting arrival'}</div>
        </div>`);
        routeStopMarkers.push(m);

      } else {
        // Intermediate stop
        let bg, innerContent, statusLabel, statusBg, statusColor;
        if (isPast) {
          bg = '#16a34a'; innerContent = '\u2713'; // green tick
          statusLabel = '\u2705 Checkpoint Cleared'; statusBg = '#f0fdf4'; statusColor = '#16a34a';
        } else if (isCurrent && !isDelivered) {
          bg = '#FF8C00'; innerContent = idx; // orange with number
          statusLabel = isOnHold ? '\u23F8 Shipment Paused Here' : '\uD83D\uDEA7 Current Position'; statusBg = isOnHold ? '#eff6ff' : '#fff7ed'; statusColor = isOnHold ? '#1d4ed8' : '#FF8C00';
        } else if (isNext && isInTransit) {
          bg = '#7c3aed'; innerContent = idx; // purple = next stop
          statusLabel = '\u27A1\uFE0F Next Stop'; statusBg = '#f5f3ff'; statusColor = '#7c3aed';
        } else {
          bg = '#64748b'; innerContent = idx; // gray = future
          statusLabel = '\u23F3 Upcoming'; statusBg = '#f8fafc'; statusColor = '#64748b';
        }
        const sz = isPast ? 13 : 11;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38" width="38" height="38">
          <circle cx="19" cy="19" r="17" fill="${bg}" stroke="white" stroke-width="2.5"/>
          <text x="19" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="${sz}" font-weight="700" fill="white">${innerContent}</text>
        </svg>`;
        const m = new google.maps.Marker({
          position: pos, map,
          title: stop.name || `Stop ${idx}`,
          icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(38,38), anchor: new google.maps.Point(19,19) },
          zIndex: isPast ? 7 : isCurrent ? 12 : 8,
        });
        addMapInfoWindow(m, `<div style="font-family:Inter,sans-serif;padding:12px 16px;min-width:210px;">
          <div style="font-weight:700;color:${bg};font-size:13px;margin-bottom:6px;">Stop ${idx} of ${total - 1}</div>
          <div style="color:#111;font-size:13px;font-weight:600;">${stop.name || 'Waypoint ' + idx}</div>
          ${stop.reason ? `<div style="color:#666;font-size:11px;margin-top:4px;">${stop.reason}</div>` : ''}
          <div style="background:${statusBg};border-radius:6px;padding:4px 8px;margin-top:8px;font-size:11px;color:${statusColor};font-weight:600;">${statusLabel}</div>
        </div>`);
        routeStopMarkers.push(m);
      }
    });

    // ── 3. Transport / pause icon placed at start of current segment ────
    if (isOnHold) {
      const ps = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
        <circle cx="26" cy="26" r="24" fill="#1d4ed8" stroke="white" stroke-width="2.5"/>
        <rect x="14" y="13" width="9" height="26" rx="3" fill="white"/>
        <rect x="29" y="13" width="9" height="26" rx="3" fill="white"/>
      </svg>`;
      transportMarker = new google.maps.Marker({
        position: startCoord, map, title: 'Shipment On Hold',
        icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(ps), scaledSize: new google.maps.Size(52,52), anchor: new google.maps.Point(26,26) },
        zIndex: 25,
      });
      addMapInfoWindow(transportMarker, `<div style="font-family:Inter,sans-serif;padding:12px 16px;min-width:200px;">
        <div style="font-weight:700;color:#1d4ed8;font-size:14px;margin-bottom:6px;">\u23F8 Shipment On Hold</div>
        <div style="color:#555;font-size:12px;">${sorted[clampedIdx]?.name || 'Current checkpoint'}</div>
        <div style="color:#888;font-size:11px;margin-top:6px;">${shipment.status_reason || 'Awaiting clearance or resolution'}</div>
      </div>`);
    } else if (isDelivered) {
      // Show delivery icon at destination
      const delSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
        <circle cx="26" cy="26" r="24" fill="#16a34a" stroke="white" stroke-width="2.5"/>
        <text x="26" y="35" text-anchor="middle" font-size="26" fill="white">\u2713</text>
      </svg>`;
      transportMarker = new google.maps.Marker({
        position: allCoords[total - 1], map, title: 'Delivered',
        icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(delSvg), scaledSize: new google.maps.Size(52,52), anchor: new google.maps.Point(26,26) },
        zIndex: 25,
      });
      addMapInfoWindow(transportMarker, `<div style="font-family:Inter,sans-serif;padding:12px 16px;">
        <div style="font-weight:700;color:#16a34a;font-size:14px;">\uD83C\uDF89 Package Delivered!</div>
        <div style="color:#555;font-size:12px;margin-top:4px;">${sorted[total-1]?.name || shipment.destination || 'Destination'}</div>
      </div>`);
    } else {
      placeMarker(startCoord.lat, startCoord.lng, transportType);
    }

    // ── 4. Pulsing ring ─────────────────────────────────────
    if (PulseOverlayClass && !isDelivered) {
      pulseOverlay = new PulseOverlayClass(new google.maps.LatLng(startCoord.lat, startCoord.lng));
      pulseOverlay.setMap(map);
    }

    // ── 5. Progress info strip ───────────────────────────────
    _updateProgressStrip(sorted, clampedIdx, shipment);

    // ── 6. Fit all stops in view ─────────────────────────────
    const bounds = new google.maps.LatLngBounds();
    allCoords.forEach(c => bounds.extend(c));
    map.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });

    // ── 7. Start animation if In Transit ────────────────────
    // Build the remaining waypoints array: from the current position all
    // the way through every subsequent stop to the final destination.
    // This gives the icon a logical, continuous path to follow visibly.
    if (isInTransit && transportMarker) {
      const remainingWaypoints = allCoords.slice(clampedIdx);
      if (remainingWaypoints.length >= 2) {
        _startRouteAnimation(remainingWaypoints, transportType);
      }
    }
  }

  // ─── Update the progress strip above the map ─────────────
  function _updateProgressStrip(sorted, clampedIdx, shipment) {
    const el = document.getElementById('map-stop-count');
    if (!el) return;
    const total   = sorted.length;
    const status  = (shipment.status || '').trim();
    const pct     = total > 1 ? Math.round((clampedIdx / (total - 1)) * 100) : 100;
    const nextStop = sorted[clampedIdx + 1];
    let text = '';
    if (status === 'On Hold') {
      text = `\u23F8\uFE0F Paused at ${sorted[clampedIdx]?.name || 'checkpoint'} \u00B7 Stop ${clampedIdx} of ${total - 1}`;
    } else if (status === 'Delivered') {
      text = `\uD83C\uDF89 Delivered \u00B7 All ${total - 1} stops completed`;
    } else if (status === 'In Transit' && nextStop) {
      text = `\u27A1\uFE0F En route to ${nextStop.name} \u00B7 Stop ${clampedIdx} of ${total - 1} \u00B7 ${pct}% complete`;
    } else {
      text = `Stop ${clampedIdx} of ${total - 1} \u00B7 ${pct}% complete \u00B7 Updated ${new Date(shipment.updated_at || Date.now()).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`;
    }
    el.textContent = text;
  }

  // ─── Animate transport icon slowly along the FULL remaining route path ───
  // Logic:
  //   • waypoints[] = array of {lat, lng} from currentStop through all intermediate
  //     stops all the way to the final destination.
  //   • Each segment duration is proportional to its geographic distance so the
  //     icon always moves at a consistent, slow, visible speed.
  //   • The icon traverses each segment fully (0→100%) before moving to the next.
  //   • On the very last segment it stops at 95% — visually "approaching" the
  //     destination — and holds until the admin advances the stop index.
  //   • Speed constant: SPEED_DEG_PER_SEC controls how many degrees the icon covers
  //     per second. Lower = slower and more visible drift.
  function _startRouteAnimation(waypoints, transportType) {
    _stopAnimation();
    if (!transportMarker || !waypoints || waypoints.length < 2) return;

    // Speed: degrees per second at map scale.
    // 0.04 deg/s ≈ ~4.4 km/s on equator → very slow visible drift across a continent
    const SPEED_DEG_PER_SEC = 0.035;
    const MIN_SEG_MS  = 20000;  // never faster than 20 s per segment
    const MAX_SEG_MS  = 180000; // never slower than 3 min per segment

    // Pre-compute per-segment durations
    const segDurations = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i], b = waypoints[i + 1];
      const distDeg = Math.sqrt(
        Math.pow(b.lat - a.lat, 2) + Math.pow(b.lng - a.lng, 2)
      );
      const ms = Math.max(MIN_SEG_MS, Math.min(distDeg / SPEED_DEG_PER_SEC * 1000, MAX_SEG_MS));
      segDurations.push(ms);
    }

    const totalSegments = waypoints.length - 1;
    let currentSeg = 0;
    let segStartTime = null;

    function tick(timestamp) {
      if (!transportMarker) return;
      if (currentSeg >= totalSegments) return; // reached end — hold position

      if (!segStartTime) segStartTime = timestamp;

      const segDuration = segDurations[currentSeg];
      const elapsed = timestamp - segStartTime;
      const rawT = Math.min(elapsed / segDuration, 1);

      // Ease-in-out cubic for natural, smooth movement
      const eased = rawT < 0.5
        ? 2 * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 2) / 2;

      const isLastSeg = (currentSeg === totalSegments - 1);
      // On the final segment, stop at 95% to show "approaching destination"
      const t = isLastSeg ? eased * 0.95 : eased;

      const from = waypoints[currentSeg];
      const to   = waypoints[currentSeg + 1];
      const lat  = from.lat + (to.lat - from.lat) * t;
      const lng  = from.lng + (to.lng - from.lng) * t;
      const pos  = new google.maps.LatLng(lat, lng);

      transportMarker.setPosition(pos);
      if (pulseOverlay) pulseOverlay.moveTo(pos);

      if (rawT < 1) {
        // Still within this segment — keep ticking
        _animFrameId = requestAnimationFrame(tick);
      } else if (!isLastSeg) {
        // Completed this segment — snap to exact endpoint and move to next
        transportMarker.setPosition(new google.maps.LatLng(to.lat, to.lng));
        if (pulseOverlay) pulseOverlay.moveTo(new google.maps.LatLng(to.lat, to.lng));
        currentSeg++;
        segStartTime = null; // reset timer for next segment
        _animFrameId = requestAnimationFrame(tick);
      }
      // If isLastSeg && rawT >= 1: hold at 95% — animation complete
    }

    _animFrameId = requestAnimationFrame(tick);
  }

  // ─── Stop current animation ───────────────────────────────
  function _stopAnimation() {
    if (_animFrameId) { cancelAnimationFrame(_animFrameId); _animFrameId = null; }
    _animLoopCount = 0;
  }

  // ─── Place pins + three route lines + checkpoint markers ───
  function _renderRoute(originCoords, destCoords, currentCoords, shipment, transportType) {
    clearRouteVisualization();

    const isOnHold = shipment.status === 'On Hold';
    const stopIndex = shipment.current_stop_index || 0;

    // Build the stops array used by admin (if available) or simple O→D
    // We'll draw: origin → dest straight line (planned, purple dashed)
    // and traveled portion (green solid), and direct O→current (teal dashed)

    const iconCoords = currentCoords || {
      lat: (originCoords.lat + destCoords.lat) / 2,
      lng: (originCoords.lng + destCoords.lng) / 2,
    };

    // 1. Planned route — purple dashed, origin to dest
    plannedPolyline = new google.maps.Polyline({
      path: [originCoords, destCoords],
      geodesic: true, strokeOpacity: 0,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#5b21b6', scale: 2.5 },
        offset: '0', repeat: '14px',
      }],
      map, zIndex: 1,
    });

    // 2. Traveled path — green solid, origin to current
    traveledPolyline = new google.maps.Polyline({
      path: [originCoords, iconCoords],
      geodesic: true, strokeColor: '#22c55e', strokeOpacity: 1, strokeWeight: 3,
      map, zIndex: 2,
    });

    // 3. Direct path — teal dashed, origin to current (slightly offset for visual clarity)
    directPolyline = new google.maps.Polyline({
      path: [originCoords, iconCoords],
      geodesic: true, strokeOpacity: 0,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, strokeColor: '#14b8a6', scale: 2 },
        offset: '0', repeat: '12px',
      }],
      map, zIndex: 1,
    });

    // 4. Origin marker — flag pin
    originMarker = new google.maps.Marker({
      position: originCoords, map,
      title: 'Origin: ' + (shipment.origin || 'Origin'),
      label: { text: '🏁', fontSize: '20px' },
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
      zIndex: 10,
    });
    addMapInfoWindow(originMarker, `
      <div style="font-family:Inter,sans-serif;padding:10px 14px;min-width:180px;">
        <div style="font-weight:700;color:#5b21b6;font-size:13px;margin-bottom:4px;">🏁 Origin</div>
        <div style="color:#1a1a1a;font-size:12px;font-weight:600;">${shipment.origin || 'Origin'}</div>
        <div style="color:#888;font-size:10px;margin-top:3px;">Departure point</div>
      </div>`);

    // 5. Destination marker — orange teardrop
    destMarker = new google.maps.Marker({
      position: destCoords, map,
      title: 'Destination: ' + (shipment.destination || 'Destination'),
      icon: {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
        fillColor: '#FF8C00', fillOpacity: 1,
        strokeColor: '#ffffff', strokeWeight: 2,
        scale: 1.1, anchor: new google.maps.Point(0, 0),
      },
      zIndex: 10,
    });
    addMapInfoWindow(destMarker, `
      <div style="font-family:Inter,sans-serif;padding:10px 14px;min-width:180px;">
        <div style="font-weight:700;color:#FF8C00;font-size:13px;margin-bottom:4px;">🎯 Destination</div>
        <div style="color:#1a1a1a;font-size:12px;font-weight:600;">${shipment.destination || 'Destination'}</div>
        <div style="color:#888;font-size:10px;margin-top:3px;">Final delivery point</div>
      </div>`);

    // 6. Transport / current-location marker
    // If On Hold → show blue pause icon; else transport icon
    if (isOnHold) {
      const pauseSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <circle cx="24" cy="24" r="22" fill="#1d4ed8" stroke="white" stroke-width="3"/>
        <rect x="13" y="12" width="8" height="24" rx="2" fill="white"/>
        <rect x="27" y="12" width="8" height="24" rx="2" fill="white"/>
      </svg>`;
      const pauseUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pauseSvg);
      transportMarker = new google.maps.Marker({
        position: iconCoords, map,
        title: 'Shipment On Hold',
        icon: { url: pauseUrl, scaledSize: new google.maps.Size(48,48), anchor: new google.maps.Point(24,24) },
        animation: google.maps.Animation.DROP,
        zIndex: 25,
      });
      // Pulsing orange ring around it
      // (done via label trick)
      addMapInfoWindow(transportMarker, `<div style="font-family:Inter,sans-serif;padding:10px 14px;"><div style="font-weight:700;color:#1d4ed8;font-size:13px;">⏸ Shipment On Hold</div><div style="color:#888;font-size:11px;margin-top:4px;">${shipment.status_reason || 'Pending resolution'}</div></div>`);
    } else {
      placeMarker(iconCoords.lat, iconCoords.lng, transportType);
    }

    // 7. Update map stop info
    const stopCountEl = document.getElementById('map-stop-count');
    if (stopCountEl) stopCountEl.textContent = `Real-time delivery route · Updated ${new Date(shipment.updated_at || Date.now()).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`;

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(originCoords);
    bounds.extend(destCoords);
    bounds.extend(iconCoords);
    map.fitBounds(bounds, { top: 80, right: 60, bottom: 60, left: 60 });
  }

  // ─── Main entry: check route_stops first, then clean 2-point fallback ───
  // NOTE: We no longer auto-generate fake intermediate waypoints.
  // Numbered stops are ONLY shown when the admin has explicitly defined them
  // via the route builder in the admin panel. Without admin stops, we show a
  // clean origin→destination route with the transport icon drifting along it.
  // This avoids the problem of stops appearing over oceans, seas, or wrong terrain.
  async function drawShipmentOnMap(shipment) {
    if (!isMapReady || !map) {
      window._pendingShipmentRender = { shipment };
      return;
    }

    clearRouteVisualization();
    const transportType = shipment.transport_type || 'plane';
    const currentStopIndex = shipment.current_stop_index || 0;

    // ── Priority 1: Admin-defined DB route_stops ─────────────────────────
    try {
      const { data: stops } = await db
        .from('route_stops')
        .select('*')
        .eq('shipment_id', shipment.id)
        .order('stop_index', { ascending: true });

      if (stops && stops.length >= 2) {
        // Admin has set real stops — render with full numbered-stop system
        _renderRouteWithStops(stops, currentStopIndex, shipment, transportType);
        return;
      }
    } catch (e) {
      console.warn('[MapController] route_stops fetch failed:', e.message);
    }

    // ── Priority 2: No admin stops — clean 2-point route (origin → destination) ─
    // We do NOT generate fake intermediate waypoints. Stops over water or wrong
    // terrain are misleading to customers. The clean route shows the origin flag,
    // destination pin, and the transport icon slowly drifting along the path.
    // The admin can add real named stops at any time via the admin panel.
    const currentCoords = (shipment.lat && shipment.lng)
      ? { lat: parseFloat(shipment.lat), lng: parseFloat(shipment.lng) }
      : null;

    let originCoords = (shipment.origin_lat && shipment.origin_lng)
      ? { lat: parseFloat(shipment.origin_lat), lng: parseFloat(shipment.origin_lng) }
      : null;
    let destCoords = (shipment.destination_lat && shipment.destination_lng)
      ? { lat: parseFloat(shipment.destination_lat), lng: parseFloat(shipment.destination_lng) }
      : null;

    try {
      if (!originCoords && shipment.origin) originCoords = await geocodeAddress(shipment.origin);
      if (!destCoords && shipment.destination) destCoords = await geocodeAddress(shipment.destination);
    } catch (e) {
      console.warn('[MapController] Geocoding failed:', e.message);
    }

    if (originCoords && destCoords) {
      // Build a minimal 2-stop array: just origin and destination
      // The icon will drift from origin toward destination when In Transit
      const startCoord = currentCoords || originCoords;
      const simpleStops = [
        { stop_index: 0, name: shipment.origin || 'Origin',      lat: originCoords.lat, lng: originCoords.lng, stop_type: 'origin' },
        { stop_index: 1, name: shipment.destination || 'Destination', lat: destCoords.lat,   lng: destCoords.lng,   stop_type: 'destination' },
      ];
      // If admin has advanced stop index to 1, treat as delivered / at destination
      _renderRouteWithStops(simpleStops, Math.min(currentStopIndex, 1), shipment, transportType);

    } else if (currentCoords) {
      // Last resort: just place the icon at the GPS coordinate
      placeMarker(currentCoords.lat, currentCoords.lng, transportType);
      map.panTo(currentCoords);
      map.setZoom(5);
    }
  }

  function addMapInfoWindow(marker, content) {
    const iw = new google.maps.InfoWindow({ content });
    marker.addListener('click', () => iw.open(map, marker));
  }

  function clearRouteVisualization() {
    _stopAnimation(); // always cancel animation first
    if (routePolyline)    { routePolyline.setMap(null);    routePolyline = null; }
    if (plannedPolyline)  { plannedPolyline.setMap(null);  plannedPolyline = null; }
    if (traveledPolyline) { traveledPolyline.setMap(null); traveledPolyline = null; }
    if (directPolyline)   { directPolyline.setMap(null);   directPolyline = null; }
    if (originMarker)     { originMarker.setMap(null);     originMarker = null; }
    if (destMarker)       { destMarker.setMap(null);       destMarker = null; }
    if (transportMarker)  { transportMarker.setMap(null);  transportMarker = null; }
    if (pulseOverlay)     { pulseOverlay.setMap(null);     pulseOverlay = null; }
    checkpointMarkers.forEach(m => m.setMap(null));
    checkpointMarkers = [];
    routeStopMarkers.forEach(m => m.setMap(null));
    routeStopMarkers = [];
  }

  function placeMarker(lat, lng, type = 'plane') {
    if (!isMapReady || !map) {
      window._pendingMapCoords = { lat, lng };
      return;
    }
    const position = new google.maps.LatLng(lat, lng);
    const iconUrl  = getTransportSVGDataURI(type);
    const iconSize = getTransportSize(type);
    const anchor   = getTransportAnchor(type);

    if (transportMarker) {
      transportMarker.setIcon({ url: iconUrl, scaledSize: iconSize, anchor });
      animateMarkerTo(transportMarker, position);
    } else {
      transportMarker = new google.maps.Marker({
        position, map,
        title: 'Live Cargo Location',
        icon: { url: iconUrl, scaledSize: iconSize, anchor },
        animation: google.maps.Animation.DROP,
        zIndex: 20,
      });
      const iw = new google.maps.InfoWindow({
        content: `<div style="font-family:Inter,sans-serif;padding:8px 10px;min-width:160px;">
          <div style="font-weight:700;color:#050A30;font-size:13px;">📦 Live Cargo</div>
          <div style="color:#FF8C00;font-size:11px;margin-top:4px;">Real-time tracking</div>
          <div style="color:#666;font-size:10px;margin-top:2px;">Updated just now</div>
        </div>`
      });
      transportMarker.addListener('click', () => iw.open(map, transportMarker));
    }
  }

  function animateMarkerTo(marker, newPosition, duration = 1500) {
    const startPosition = marker.getPosition();
    const startLat = startPosition.lat(), startLng = startPosition.lng();
    const endLat = newPosition.lat(), endLng = newPosition.lng();
    const t0 = performance.now();
    function step(now) {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      marker.setPosition(new google.maps.LatLng(
        startLat + (endLat - startLat) * eased,
        startLng + (endLng - startLng) * eased
      ));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function startRealtime(shipmentId) {
    stopRealtime();
    currentShipmentId = shipmentId;
    realtimeChannel = db
      .channel(`shipment-${shipmentId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'shipments',
        filter: `id=eq.${shipmentId}`,
      }, async (payload) => {
        const updated = payload.new;
        const prevState = _lastShipmentState;

        // Detect what actually changed
        const stopChanged   = prevState && updated.current_stop_index !== prevState.currentStopIndex;
        const statusChanged = prevState && updated.status !== prevState.shipment.status;
        const typeChanged   = prevState && updated.transport_type !== prevState.transportType;

        // Show notification based on what changed
        if (stopChanged) {
          UIController.showRealtimeNotification('\uD83D\uDCCD Stop advanced — route updated!');
        } else if (statusChanged) {
          const statusEmoji = { 'On Hold':'\u23F8\uFE0F', 'In Transit':'\uD83D\DDE3\uFE0F', 'Delivered':'\uD83C\uDF89' };
          UIController.showRealtimeNotification(`${statusEmoji[updated.status] || '\uD83D\uDCE6'} Status updated: ${updated.status}`);
        } else if (typeChanged) {
          UIController.showRealtimeNotification('\uD83D\uDE9A Transport type changed!');
        }

        // Always do a full re-render so stops, animation, and status are in sync
        try {
          const { data: stops } = await db
            .from('route_stops')
            .select('*')
            .eq('shipment_id', shipmentId)
            .order('stop_index', { ascending: true });

          if (stops && stops.length >= 2) {
            _renderRouteWithStops(stops, updated.current_stop_index || 0, updated, updated.transport_type || 'plane');
          } else if (prevState && prevState.stops) {
            // Use cached auto-generated stops with updated shipment data
            _renderRouteWithStops(prevState.stops, updated.current_stop_index || 0, updated, updated.transport_type || 'plane');
          }
        } catch (e) {
          console.warn('[RT] Re-render failed:', e.message);
        }

        // Always sync status badge in sidebar
        if (updated.status) UIController.updateStatus(updated.status);
        if (updated.transport_type) UIController.updateTransportBadge(updated.transport_type);
      })
      .subscribe();
  }

  function startMilestonesRealtime(shipmentId) {
    db.channel(`milestones-${shipmentId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'milestones',
        filter: `shipment_id=eq.${shipmentId}`,
      }, (payload) => {
        UIController.prependMilestone(payload.new);
        UIController.showRealtimeNotification('🗺️ New tracking update received!');
      })
      .subscribe();
  }

  function stopRealtime() {
    if (realtimeChannel) { db.removeChannel(realtimeChannel); realtimeChannel = null; }
    clearRouteVisualization();
  }

  function resetMap() {
    stopRealtime();
    if (map) { map.setCenter({ lat: 20, lng: 25 }); map.setZoom(3); }
  }

  return { initMap, drawShipmentOnMap, placeMarker, startRealtime, startMilestonesRealtime, stopRealtime, resetMap };
})();


// ─────────────────────────────────────────
// 3. TRACKING ENGINE
// ─────────────────────────────────────────
const TrackingEngine = (() => {
  let currentShipment = null;

  async function fetchShipment(trackingNumber) {
    const { data, error } = await db
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber.trim().toUpperCase())
      .single();

    if (error || !data) return null;
    return data;
  }

  async function fetchMilestones(shipmentId) {
    const { data, error } = await db
      .from('milestones')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('timestamp', { ascending: false });

    return data || [];
  }

  async function track(trackingNumber) {
    const shipment = await fetchShipment(trackingNumber);
    if (!shipment) return null;

    currentShipment = shipment;
    const milestones = await fetchMilestones(shipment.id);

    return { shipment, milestones };
  }

  function getCurrentShipment() { return currentShipment; }

  return { track, fetchMilestones, getCurrentShipment };
})();


// ─────────────────────────────────────────
// 4. UI CONTROLLER
// ─────────────────────────────────────────
const UIController = (() => {
  const STATUS_STEPS = [
    { key: 'Order Placed', icon: '📋', label: 'Order Confirmed', sub: 'Shipment created & payment received' },
    { key: 'In Transit', icon: '✈️', label: 'In Transit', sub: 'Cargo en route to destination' },
    { key: 'Customs Hold', icon: '🔒', label: 'Customs Hold', sub: 'Package held at customs — awaiting clearance' },
    { key: 'Customs Cleared', icon: '🛃', label: 'Customs Cleared', sub: 'Passed customs inspection' },
    { key: 'Out for Delivery', icon: '🚚', label: 'Out for Delivery', sub: 'With local delivery courier' },
    { key: 'Delivered', icon: '✅', label: 'Delivered', sub: 'Package received by recipient' },
  ];

  function showTrackingSection() {
    const sec = document.getElementById('tracking');
    if (!sec) return;
    sec.style.display = 'block';
    setTimeout(() => sec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function hideTrackingSection() {
    const sec = document.getElementById('tracking');
    if (sec) sec.style.display = 'none';
    const dash = document.getElementById('tracking-dashboard');
    if (dash) dash.classList.add('hidden');
    const err = document.getElementById('tracking-error');
    if (err) err.classList.add('hidden');
  }

  function showError() {
    document.getElementById('tracking-error').classList.remove('hidden');
    document.getElementById('tracking-dashboard').classList.add('hidden');
  }

  function showDashboard(shipment, milestones) {
    document.getElementById('tracking-error').classList.add('hidden');
    document.getElementById('tracking-dashboard').classList.remove('hidden');

    // ── Card 1: Tracking number + status badge
    document.getElementById('display-tracking-id').textContent = shipment.tracking_number;
    document.getElementById('card-tracking-num').textContent = shipment.tracking_number;
    document.getElementById('card-description').textContent = shipment.description || '';

    const statusBadgeCard = document.getElementById('card-status-badge');
    if (statusBadgeCard) {
      statusBadgeCard.textContent = shipment.status || 'Unknown';
      const cls = {
        'Delivered': 'bg-green-600', 'In Transit': 'bg-blue-600',
        'Out for Delivery': 'bg-orange-500', 'Customs Cleared': 'bg-teal-600', 'Customs Hold': 'bg-red-600',
        'On Hold': 'bg-red-500', 'Order Placed': 'bg-gray-600',
      }[shipment.status] || 'bg-gray-600';
      statusBadgeCard.className = `text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide flex-shrink-0 ${cls}`;
    }

    // ── Barcode
    const barcodeEl = document.getElementById('shipment-barcode');
    const barcodeLbl = document.getElementById('barcode-label');
    if (barcodeEl && typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode(barcodeEl, shipment.tracking_number, {
          format: 'CODE128', width: 2.2, height: 60,
          displayValue: false, margin: 0,
        });
        if (barcodeLbl) barcodeLbl.textContent = shipment.tracking_number;
      } catch(e) { console.warn('Barcode error:', e); }
    }

    // ── Card 2: FROM / TO
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val || '—'; };
    set('from-name',    shipment.sender_name);
    set('from-city',    shipment.origin_city    || shipment.origin);
    set('from-country', shipment.origin_country);
    set('to-name',      shipment.receiver_name);
    set('to-city',      shipment.destination_city    || shipment.destination);
    set('to-country',   shipment.destination_country);

    // ── Card 3: Stats
    set('stat-distance', shipment.distance_km   ? shipment.distance_km   : '—');
    set('stat-eta',      shipment.eta_display   ? shipment.eta_display   : '—');
    if (shipment.estimated_delivery) {
      const d = new Date(shipment.estimated_delivery);
      set('stat-arrival', d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }));
    } else { set('stat-arrival', '—'); }

    // ── Card 4: Package details
    set('pkg-type',          shipment.package_type);
    set('pkg-service',       shipment.service_type ? `Service: ${shipment.service_type}` : 'Service: —');
    set('pkg-weight',        shipment.weight     ? `${shipment.weight} kg` : '—');
    set('pkg-qty',           shipment.quantity   ? `Qty: ${shipment.quantity}` : 'Qty: —');
    set('pkg-dims',          shipment.dimensions ? `Dimensions: ${shipment.dimensions}` : 'Dimensions: —');
    set('pkg-declared',      shipment.declared_value    ? `Declared: ${shipment.declared_value}` : 'Declared: —');
    set('pkg-shipping-cost', shipment.shipping_cost     ? `Shipping: ${shipment.shipping_cost}` : 'Shipping: —');

    // ── Card 5: On Hold alert
    const holdAlert = document.getElementById('on-hold-alert');
    if (holdAlert) {
      if (shipment.status === 'On Hold') {
        holdAlert.classList.remove('hidden');
        const reasonEl = document.getElementById('hold-reason-text');
        if (reasonEl) reasonEl.textContent = shipment.status_reason || 'Your shipment is currently on hold. Please contact us for more information.';
      } else {
        holdAlert.classList.add('hidden');
      }
    }

    // ── Map metadata
    const timeAgoEl = document.getElementById('map-time-ago');
    if (timeAgoEl && shipment.updated_at) {
      const diff = Math.floor((Date.now() - new Date(shipment.updated_at)) / 60000);
      const label = diff < 1 ? 'just now' : diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`;
      timeAgoEl.textContent = label;
      timeAgoEl.style.display = 'inline-block';
    }

    updateTransportBadge(shipment.transport_type || 'plane');

    updateStatus(shipment.status);
    renderMilestones(milestones);

    // Draw map
    MapController.drawShipmentOnMap(shipment);
    MapController.startRealtime(shipment.id);
    MapController.startMilestonesRealtime(shipment.id);
  }

  function updateStatus(status) {
    const stepperEl = document.getElementById('status-stepper');
    if (!stepperEl) return;

    const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);

    stepperEl.innerHTML = STATUS_STEPS.map((step, idx) => {
      let state = 'pending';
      if (idx < currentIdx) state = 'completed';
      else if (idx === currentIdx) state = 'active';

      let dotContent, dotBg;
      if (state === 'completed') {
        dotBg = 'bg-green-500';
        dotContent = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>`;
      } else if (state === 'active') {
        dotBg = 'bg-[#5b21b6]';
        dotContent = `<span class="text-white text-sm">${step.icon}</span>`;
      } else {
        dotBg = 'bg-gray-200';
        dotContent = `<span class="text-gray-500 text-xs font-bold">${idx + 1}</span>`;
      }

      const titleCls = state === 'active' ? 'text-[#5b21b6] font-bold' : state === 'completed' ? 'text-gray-700 font-semibold' : 'text-gray-400';
      const subCls = state === 'active' ? 'text-gray-600' : 'text-gray-400';
      const connector = idx < STATUS_STEPS.length - 1
        ? `<div class="absolute left-4 top-10 w-0.5 h-6 ${state !== 'pending' ? 'bg-green-400' : 'bg-gray-200'}"></div>` : '';

      return `
        <div class="relative flex items-start gap-4 pb-6">
          ${connector}
          <div class="w-8 h-8 rounded-full ${dotBg} flex items-center justify-center flex-shrink-0 shadow-sm">${dotContent}</div>
          <div class="pt-1">
            <div class="text-sm ${titleCls}">${step.label}</div>
            <div class="text-xs ${subCls} mt-0.5">${step.sub}</div>
          </div>
        </div>`;
    }).join('');
  }

  function renderMilestones(milestones) {
    const el = document.getElementById('milestones-list');
    if (!el) return;

    if (!milestones || milestones.length === 0) {
      el.innerHTML = '<div class="text-gray-400 text-sm text-center py-4">No tracking history available yet.</div>';
      return;
    }

    el.innerHTML = milestones.map((m, i) => {
      const date = new Date(m.timestamp);
      const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const isLatest = i === 0;
      return `
        <div class="flex items-start gap-3 py-3 ${i < milestones.length-1 ? 'border-b border-gray-100' : ''}">
          <div class="flex flex-col items-center flex-shrink-0">
            <div class="w-3 h-3 rounded-full ${isLatest ? 'bg-[#5b21b6] ring-4 ring-purple-100' : 'bg-gray-300'} mt-1"></div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-gray-800 text-sm font-medium leading-snug">${m.message}</p>
              ${isLatest ? '<span class="bg-[#5b21b6]/10 text-[#5b21b6] text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">LATEST</span>' : ''}
            </div>
            ${m.location_name ? `<p class="text-gray-500 text-xs mt-0.5">${m.location_name}</p>` : ''}
            <p class="text-gray-400 text-xs mt-1">${formatted}</p>
          </div>
        </div>`;
    }).join('');
  }

  function prependMilestone(milestone) {
    const el = document.getElementById('milestones-list');
    if (!el) return;

    // Remove "No history" placeholder if present
    const placeholder = el.querySelector('.text-gray-400.text-center');
    if (placeholder) placeholder.remove();

    const date = new Date(milestone.timestamp);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newItem = document.createElement('div');
    newItem.className = 'flex items-start gap-3 py-3 border-b border-gray-100';
    newItem.innerHTML = `
      <div class="flex flex-col items-center flex-shrink-0">
        <div class="w-3 h-3 rounded-full bg-[#5b21b6] ring-4 ring-purple-100 mt-1 animate-pulse"></div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <p class="text-gray-800 text-sm font-medium leading-snug">${milestone.message}</p>
          <span class="bg-[#5b21b6]/10 text-[#5b21b6] text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">LIVE</span>
        </div>
        ${milestone.location_name ? `<p class="text-gray-500 text-xs mt-0.5">${milestone.location_name}</p>` : ''}
        <p class="text-gray-400 text-xs mt-1">${formatted}</p>
      </div>
    `;
    el.prepend(newItem);
  }


  function showRealtimeNotification(message) {
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-24 right-4 border border-orange-500/30 text-white text-sm px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 font-medium';
    toastEl.style.cssText = 'background:rgba(5,10,48,0.95);backdrop-filter:blur(20px);animation:fadeSlideIn 0.4s ease-out forwards;';
    toastEl.innerHTML = `<div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0"></div>${message}`;
    document.body.appendChild(toastEl);
    setTimeout(() => { toastEl.style.opacity = '0'; toastEl.style.transition = 'opacity 0.4s'; setTimeout(() => toastEl.remove(), 400); }, 4000);
  }

  function updateTransportBadge(type) {
    const badge = document.getElementById('transport-badge');
    if (!badge) return;
    const labels = { plane: '✈️ Air Freight', ship: '🚢 Ocean Freight', bus: '🚌 Road Freight', train: '🚂 Rail Freight' };
    badge.textContent = labels[type] || '✈️ Air Freight';
    badge.style.display = 'inline-flex';
  }

  return { showTrackingSection, hideTrackingSection, showError, showDashboard, updateStatus, renderMilestones, prependMilestone, showRealtimeNotification, updateTransportBadge };
})();


// ─────────────────────────────────────────
// 5. ANIMATION CONTROLLER
// ─────────────────────────────────────────
const AnimationController = (() => {
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-animate').forEach(el => observer.observe(el));
  }

  function initCounterAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-count') || el.getAttribute('data-target') || '0', 10);
          animateCounter(el, target);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count], [data-target]').forEach(el => observer.observe(el));
  }

  function animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();
    const startValue = 0;

    function step(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const current = Math.round(startValue + (target - startValue) * eased);
      el.textContent = current.toLocaleString() + (el.textContent.includes('+') ? '+' : '') + (el.textContent.includes('%') ? '%' : '');

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const scroll = window.scrollY;
      if (scroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = scroll;
    }, { passive: true });
  }

  function initHero() {
    // Trigger hero animations
    document.querySelectorAll('[style*="opacity: 0"]').forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '1';
      }, 100 + i * 200);
    });
  }

  return { initScrollReveal, initCounterAnimation, initNavbar, initHero };
})();


// ─────────────────────────────────────────
// 6. QUOTE FORM HANDLER
// ─────────────────────────────────────────
const QuoteFormHandler = (() => {
  function init() {
    const form = document.getElementById('quote-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('quote-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Sending...</span>';

      const payload = {
        name: document.getElementById('q-name').value,
        email: document.getElementById('q-email').value,
        destination: document.getElementById('q-destination').value,
        weight: document.getElementById('q-weight').value,
        message: `Type: ${document.getElementById('q-type').value}. ${document.getElementById('q-message').value}`,
      };

      const { error } = await db.from('quote_requests').insert([payload]);

      if (error) {
        console.error('Quote submission error:', error);
        btn.disabled = false;
        btn.innerHTML = `<span>Request a Quote</span><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
        UIController.showRealtimeNotification('❌ Failed to submit. Please try again.');
        return;
      }

      form.classList.add('hidden');
      document.getElementById('quote-success').classList.remove('hidden');
    });
  }

  return { init };
})();


// ─────────────────────────────────────────
// 7. UTILITIES & GLOBAL FUNCTIONS
// ─────────────────────────────────────────

// Google Maps callback
window.initMap = function() {
  MapController.initMap();
};

// Mobile menu
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
  });
});

// Main track function (called from button & enter key)
window.trackShipment = async function(e) {
  if (e) e.preventDefault();

  const input = document.getElementById('hero-tracking-input');
  const trackingNumber = input?.value?.trim();

  if (!trackingNumber) {
    input?.focus();
    return;
  }

  // Redirect to the new dedicated tracking page
  window.location.href = `track.html?track=${encodeURIComponent(trackingNumber)}`;
};

// Enter key on tracking input
document.getElementById('hero-tracking-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') window.trackShipment(e);
});

// Close tracking panel
window.closeTracking = function() {
  UIController.hideTrackingSection();
  MapController.resetMap();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Chat widget toggle
window.toggleChat = function() {
  const bubble = document.getElementById('chat-bubble');
  const iconOpen = document.getElementById('chat-icon-open');
  const iconClose = document.getElementById('chat-icon-close');
  const notif = document.getElementById('chat-notif');

  bubble.classList.toggle('hidden');
  iconOpen.classList.toggle('hidden');
  iconClose.classList.toggle('hidden');
  if (notif) notif.style.display = 'none';
};

// Waybill PDF Generator
window.downloadWaybill = function() {
  const shipment = TrackingEngine.getCurrentShipment();
  if (!shipment) return;

  const content = `
    Nexshipment — OFFICIAL WAYBILL
    ========================================
    Tracking Number: ${shipment.tracking_number}
    Status:          ${shipment.status}
    
    SENDER:  ${shipment.sender_name || '—'}
    RECEIVER: ${shipment.receiver_name || '—'}
    
    ORIGIN:      ${shipment.origin || '—'}
    DESTINATION: ${shipment.destination || '—'}
    
    WEIGHT:   ${shipment.weight ? shipment.weight + ' kg' : '—'}
    CONTENTS: ${shipment.description || '—'}
    EST. DELIVERY: ${shipment.estimated_delivery || '—'}
    
    ========================================
    Generated: ${new Date().toLocaleString()}
    Coordinates: ${shipment.lat?.toFixed(4)}, ${shipment.lng?.toFixed(4)}
    
    This is an official waybill from Nexshipment.
    Nexshipmenttrace.com | contact@Nexshipmenttrace.com
  `;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `waybill-${shipment.tracking_number}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  UIController.showRealtimeNotification('📄 Waybill downloaded!');
};

// Share tracking
window.shareTracking = function() {
  const shipment = TrackingEngine.getCurrentShipment();
  if (!shipment) return;

  const url = `${window.location.origin}${window.location.pathname}?track=${shipment.tracking_number}`;

  if (navigator.share) {
    navigator.share({ title: 'Nexshipment', text: `Track shipment ${shipment.tracking_number}`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      UIController.showRealtimeNotification('🔗 Tracking link copied to clipboard!');
    });
  }
};

// Auto-track from URL param
function checkURLTracking() {
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get('track');
  if (trackId) {
    const input = document.getElementById('hero-tracking-input');
    if (input) {
      input.value = trackId;
      window.trackShipment();
    }
  }
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  AnimationController.initNavbar();
  AnimationController.initScrollReveal();
  AnimationController.initCounterAnimation();
  AnimationController.initHero();
  QuoteFormHandler.init();
  checkURLTracking();

  console.log('%c🚚 Nexshipment', 'color: #FF8C00; font-size: 18px; font-weight: bold;');
  console.log('%cPowered by Supabase Realtime + Google Maps', 'color: #050A30; font-size: 12px;');
});
