/* ==========================================
   SendFlex Logistics Solution � Command Centre JS
   ==========================================*/
'use strict';

// --- Supabase ---
const SUPABASE_URL = 'https://oswkzcwgtgvnkdlhrvop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zd2t6Y3dndGd2bmtkbGhydm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MzMzODAsImV4cCI6MjA5MTQwOTM4MH0.8n7dgTodojpZAD1C9VRP_bfcGOmc6TG_Xy4ik6P_5es';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-shipment-email`;

const ADMIN_CREDS = { username: 'admin', password: 'SendFlex2026!' };

let allShipments = [];
let adminMap = null;
let adminClickMarker = null; // the manual click-to-set marker
let modalShipmentId = null;
let modalClientEmail = null; // email stored for the shipment currently in the modal

// -------------------------------------
// MAP STYLE � Crystal Clear Midnight
// -------------------------------------
const MIDNIGHT = [
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

// -------------------------------------
// ROUTE STATE
// -------------------------------------
let routeState = {
  shipment: null,
  allStops: [],        // [{name, lat, lng, reason, type}] including origin & dest
  currentIndex: 0,     // which stop the shipment is currently at
  transportType: 'plane',
  routePolyline: null,
  originMarker: null,
  destMarker: null,
  transportMarker: null,
  stopMarkers: [],
  animFrame: null,
};

// -------------------------------------
// MAJOR TRANSIT HUBS DATABASE
// -------------------------------------
const TRANSPORT_HUBS = {
  plane: [
    { name: 'London Heathrow', lat: 51.4700, lng: -0.4543, type: 'International Airport' },
    { name: 'Dubai International Airport', lat: 25.2532, lng: 55.3657, type: 'International Airport' },
    { name: 'Singapore Changi', lat: 1.3644, lng: 103.9915, type: 'International Airport' },
    { name: 'Nairobi Jomo Kenyatta Intl', lat: -1.3192, lng: 36.9275, type: 'International Airport' },
    { name: 'Addis Ababa Bole Intl', lat: 8.9779, lng: 38.7993, type: 'International Airport' },
    { name: 'Istanbul Airport', lat: 41.2753, lng: 28.7519, type: 'International Airport' },
    { name: 'Amsterdam Schiphol', lat: 52.3086, lng: 4.7639, type: 'International Airport' },
    { name: 'Cairo International Airport', lat: 30.1219, lng: 31.4056, type: 'International Airport' },
    { name: 'O.R. Tambo, Johannesburg', lat: -26.1367, lng: 28.2411, type: 'International Airport' },
    { name: 'New York JFK', lat: 40.6413, lng: -73.7781, type: 'International Airport' },
    { name: 'Beijing Capital Airport', lat: 40.0799, lng: 116.6031, type: 'International Airport' },
    { name: 'Mumbai Chhatrapati Shivaji', lat: 19.0896, lng: 72.8656, type: 'International Airport' },
    { name: 'Doha Hamad International', lat: 25.2731, lng: 51.6086, type: 'International Airport' },
    { name: 'Paris Charles de Gaulle', lat: 49.0097, lng: 2.5479, type: 'International Airport' },
    { name: 'Abidjan Felix Houphouet', lat: 5.2613, lng: -3.9267, type: 'International Airport' },
    { name: 'Cape Town International', lat: -33.9715, lng: 18.6021, type: 'International Airport' },
    { name: 'Douala International Airport', lat: 4.0061, lng: 9.7195, type: 'International Airport' },
    { name: 'Frankfurt Airport', lat: 50.0379, lng: 8.5622, type: 'International Airport' },
    { name: 'Bangkok Suvarnabhumi', lat: 13.6900, lng: 100.7501, type: 'International Airport' },
    { name: 'Casablanca Mohammed V', lat: 33.3675, lng: -7.5898, type: 'International Airport' },
    { name: 'Accra Kotoka International', lat: 5.6052, lng: -0.1668, type: 'International Airport' },
    { name: 'Kigali International Airport', lat: -1.9686, lng: 30.1395, type: 'International Airport' },
    { name: 'Toronto Pearson', lat: 43.6777, lng: -79.6248, type: 'International Airport' },
    { name: 'Hong Kong International', lat: 22.3080, lng: 113.9185, type: 'International Airport' },
  ],
  ship: [
    { name: 'Port of Jebel Ali (Dubai)', lat: 25.0103, lng: 55.0672, type: 'Major Seaport' },
    { name: 'Port of Colombo, Sri Lanka', lat: 6.9319, lng: 79.8478, type: 'Major Seaport' },
    { name: 'Gulf of Aden', lat: 11.8592, lng: 43.7665, type: 'Ocean Waypoint' },
    { name: 'Suez Canal � Port Said', lat: 31.2567, lng: 32.2824, type: 'Canal Transit' },
    { name: 'Red Sea Passage', lat: 18.0, lng: 38.5, type: 'Ocean Waypoint' },
    { name: 'Port of Mombasa, Kenya', lat: -4.0435, lng: 39.6682, type: 'Major Seaport' },
    { name: 'Port of Dar es Salaam', lat: -6.8161, lng: 39.2902, type: 'Major Seaport' },
    { name: 'Port of Durban, South Africa', lat: -29.8587, lng: 31.0218, type: 'Major Seaport' },
    { name: 'Port of Cape Town', lat: -33.9017, lng: 18.4233, type: 'Major Seaport' },
    { name: 'Port of Cape Town, South Africa', lat: -33.9188, lng: 18.4233, type: 'Major Seaport' },
    { name: 'Port of Douala, Cameroon', lat: 4.0511, lng: 9.7679, type: 'Destination Port' },
    { name: 'Port of Rotterdam', lat: 51.9225, lng: 4.4792, type: 'Major Seaport' },
    { name: 'Port of Singapore', lat: 1.2655, lng: 103.8200, type: 'Major Seaport' },
    { name: 'Port of Abidjan', lat: 5.2827, lng: -4.0122, type: 'Major Seaport' },
    { name: 'Port of Dakar, Senegal', lat: 14.6928, lng: -17.4467, type: 'Major Seaport' },
    { name: 'Mediterranean Sea', lat: 35.1264, lng: 20.3034, type: 'Ocean Waypoint' },
    { name: 'Indian Ocean', lat: 5.0, lng: 65.0, type: 'Ocean Waypoint' },
    { name: 'Gulf of Guinea', lat: 1.0, lng: 4.0, type: 'Ocean Waypoint' },
  ],
  bus: [
    { name: 'Amman, Jordan', lat: 31.9522, lng: 35.2332, type: 'Border City' },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357, type: 'Capital City' },
    { name: 'Khartoum, Sudan', lat: 15.5007, lng: 32.5599, type: 'Capital City' },
    { name: 'Addis Ababa, Ethiopia', lat: 9.0320, lng: 38.7469, type: 'Capital City' },
    { name: 'Kampala, Uganda', lat: 0.3476, lng: 32.5825, type: 'Capital City' },
    { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219, type: 'Capital City' },
    { name: 'Kinshasa, DR Congo', lat: -4.3217, lng: 15.3222, type: 'Capital City' },
    { name: 'Yaound�, Cameroon', lat: 3.8480, lng: 11.5021, type: 'Capital City' },
    { name: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473, type: 'Major City' },
    { name: 'Abidjan, C�te d\'Ivoire', lat: 5.3600, lng: -4.0083, type: 'Major City' },
    { name: 'Accra, Ghana', lat: 5.6037, lng: -0.1870, type: 'Capital City' },
    { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, type: 'Major City' },
    { name: 'Muscat, Oman', lat: 23.5880, lng: 58.3829, type: 'Capital City' },
    { name: 'Beirut, Lebanon', lat: 33.8938, lng: 35.5018, type: 'Capital City' },
    { name: 'Dakar, Senegal', lat: 14.7167, lng: -17.4677, type: 'Capital City' },
  ],
  train: [
    { name: 'Istanbul Sirkeci Station', lat: 41.0190, lng: 28.9750, type: 'Rail Hub' },
    { name: 'Ankara Central Station', lat: 39.9334, lng: 32.8597, type: 'Rail Hub' },
    { name: 'Cairo Ramses Station', lat: 30.0626, lng: 31.2497, type: 'Rail Hub' },
    { name: 'Nairobi Railway Station', lat: -1.2921, lng: 36.8219, type: 'Rail Hub' },
    { name: 'Mombasa Station', lat: -4.0435, lng: 39.6682, type: 'Rail Hub' },
    { name: 'Frankfurt Hauptbahnhof', lat: 50.1069, lng: 8.6631, type: 'Rail Hub' },
    { name: 'Paris Gare du Nord', lat: 48.8809, lng: 2.3553, type: 'Rail Hub' },
    { name: 'London St Pancras', lat: 51.5309, lng: -0.1233, type: 'Rail Hub' },
    { name: 'Johannesburg Park Station', lat: -26.1981, lng: 28.0436, type: 'Rail Hub' },
    { name: 'Pretoria Station, South Africa', lat: -25.7554, lng: 28.1882, type: 'Rail Hub' },
    { name: 'Mumbai Central Station', lat: 18.9690, lng: 72.8193, type: 'Rail Hub' },
    { name: 'Beijing West Station', lat: 39.8980, lng: 116.3220, type: 'Rail Hub' },
  ],
};

// -------------------------------------
// TRANSPORT SVG ICONS
// -------------------------------------
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
      <rect x="35" y="10" width="6" height="8" rx="1" fill="rgba(255,140,0,0.2)"/>
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
      <rect x="4" y="25" width="4" height="7" rx="2" fill="#FF8C00" opacity="0.6"/>
      <rect x="60" y="22" width="8" height="7" rx="2" fill="#FF8C00" opacity="0.5"/>
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
      <line x1="0" y1="44" x2="78" y2="44" stroke="rgba(255,140,0,0.4)" stroke-width="2" stroke-dasharray="6,4"/>
    </svg>`,
  };
  const svg = svgs[type] || svgs.plane;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
}

function getTransportIconSize(type) {
  const s = { plane: [56,56], ship: [64,44], bus: [72,46], train: [78,46] };
  const [w,h] = s[type] || s.plane;
  return new google.maps.Size(w, h);
}

function getTransportAnchor(type) {
  const a = { plane: [28,28], ship: [32,22], bus: [36,23], train: [39,23] };
  const [x,y] = a[type] || a.plane;
  return new google.maps.Point(x, y);
}

// -------------------------------------
// LOGIN
// -------------------------------------
document.getElementById('login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('admin-username').value.trim();
  const p = document.getElementById('admin-password').value;
  const btn = document.getElementById('login-btn');
  const txt = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');
  const err = document.getElementById('login-error');

  btn.disabled = true;
  txt.textContent = 'Verifying...';
  spinner.classList.remove('hidden');
  err.classList.add('hidden');

  await new Promise(r => setTimeout(r, 700));

  if (u === ADMIN_CREDS.username && p === ADMIN_CREDS.password) {
    sessionStorage.setItem('gft_cmd', '1');
    mountDashboard();
  } else {
    err.classList.remove('hidden');
    btn.disabled = false;
    txt.textContent = 'Access Command Centre';
    spinner.classList.add('hidden');
  }
});

function mountDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';

  // Wire search input
  const searchEl = document.getElementById('search-shipments');
  if (searchEl) {
    searchEl.addEventListener('input', e => filterShipments(e.target.value));
  }

  // Auto-calculate distance & ETA when origin / destination / transport type / shipped date changes
  ['cs-origin', 'cs-destination', 'cs-shipped-date'].forEach(id => {
    document.getElementById(id)?.addEventListener('blur', autoCalcDistanceETA);
  });
  document.getElementById('cs-transport')?.addEventListener('change', autoCalcDistanceETA);

  // -- Event delegation for shipment table buttons --
  // This is more reliable than inline onclick in file:// context
  function handleTableClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id, num, status } = btn.dataset;
    if (action === 'status') openModal(id, num, status);
    if (action === 'edit')   openEditModal(id);
    if (action === 'delete') delShipment(id, num);
  }
  document.getElementById('shipments-tbody-dashboard')?.addEventListener('click', handleTableClick);
  document.getElementById('shipments-tbody-all')?.addEventListener('click', handleTableClick);

  // Load data and build UI
  loadShipments().then(() => renderStatusBtns());
  loadQuotes();
}

function adminLogout() {
  sessionStorage.removeItem('gft_cmd');
  location.reload();
}

function togglePwd() {
  const f = document.getElementById('admin-password');
  f.type = f.type === 'password' ? 'text' : 'password';
}

window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('gft_cmd') === '1') mountDashboard();
});

// -------------------------------------
// MAP INIT
// -------------------------------------
window.initAdminMap = function () {
  const el = document.getElementById('admin-map');
  if (!el) return;

  adminMap = new google.maps.Map(el, {
    center: { lat: 20, lng: 25 },
    zoom: 2,
    styles: MIDNIGHT,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    gestureHandling: 'cooperative',
    backgroundColor: '#061422',
  });

  adminMap.addListener('click', e => {
    const lat = +e.latLng.lat().toFixed(6);
    const lng = +e.latLng.lng().toFixed(6);

    document.getElementById('lu-lat').value = lat;
    document.getElementById('lu-lng').value = lng;
    document.getElementById('sel-lat').textContent = lat;
    document.getElementById('sel-lng').textContent = lng;

    if (adminClickMarker) {
      adminClickMarker.setPosition(e.latLng);
    } else {
      adminClickMarker = new google.maps.Marker({
        position: e.latLng,
        map: adminMap,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#FF8C00',
          fillOpacity: 0.85,
          strokeColor: 'white',
          strokeWeight: 2,
        },
        title: 'Target Position',
        zIndex: 5,
      });
    }
    log(`?? Clicked: ${lat}, ${lng}`);
  });
};

// -------------------------------------
// PANEL NAV
// -------------------------------------
const PANELS = {
  dashboard:    { title: 'Dashboard', sub: 'Real-time operations overview' },
  'live-update':{ title: 'Live Route Control', sub: 'Map route � transport icon � stop management' },
  shipments:    { title: 'All Shipments', sub: 'Full waybill database' },
  create:       { title: 'Create Shipment', sub: 'Add new tracking waybill' },
  milestones:   { title: 'Push Milestone', sub: 'Add tracking update for customer' },
  quotes:       { title: 'Quote Requests', sub: 'Incoming lead management' },
};

function showPanel(id) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));

  const panel = document.getElementById(`panel-${id}`);
  if (panel) panel.classList.add('active');

  const link = document.querySelector(`.admin-nav-link[onclick="showPanel('${id}')"]`);
  if (link) link.classList.add('active');

  const meta = PANELS[id] || {};
  document.getElementById('panel-title').textContent = meta.title || id;
  document.getElementById('panel-subtitle').textContent = meta.sub || '';

  if (id === 'shipments') renderAllTable();
  if (id === 'quotes') loadQuotes();
  if (id === 'live-update' || id === 'milestones') populateSelects();
}

// -------------------------------------
// DATA
// -------------------------------------
async function loadShipments() {
  const { data, error } = await db.from('shipments').select('*').order('updated_at', { ascending: false });
  if (error) { console.error('loadShipments error:', error); toast('? Failed to load shipments: ' + error.message, true); return; }
  if (data) allShipments = data;
  renderDashTable();
  renderAllTable();
  updateStats();
  populateSelects();
  checkArrivalAlerts(allShipments);
  return data;
}

// Alias used by HTML Refresh button  onclick="loadAllShipments()"
const loadAllShipments = loadShipments;

function updateStats() {
  const t = allShipments.length;
  const tr = allShipments.filter(s => ['In Transit','Customs Hold','Customs Cleared','Out for Delivery'].includes(s.status)).length;
  const d = allShipments.filter(s => s.status === 'Delivered').length;
  setEl('stat-total', t); setEl('stat-transit', tr); setEl('stat-delivered', d);
}

function renderDashTable() {
  // HTML id = 'shipments-tbody-dashboard'
  const tbody = document.getElementById('shipments-tbody-dashboard');
  if (!tbody) return;
  if (!allShipments.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);">No shipments found.</td></tr>';
    return;
  }
  const transportIcons = { plane: '??', ship: '??', bus: '??', train: '??' };
  tbody.innerHTML = allShipments.slice(0, 10).map(s => `
    <tr>
      <td><code style="color:#FF8C00;font-family:monospace;font-size:12px;">${esc(s.tracking_number)}</code></td>
      <td>${esc(s.sender_name || '�')}</td>
      <td>${esc(s.destination || '�')}</td>
      <td>${s.weight ? s.weight + ' kg' : '�'}</td>
      <td><span class="status-chip ${chipCls(s.status)}">${esc(s.status)}</span></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button
            data-action="status"
            data-id="${s.id}"
            data-num="${esc(s.tracking_number)}"
            data-status="${esc(s.status)}"
            style="font-size:11px;color:#FF8C00;background:rgba(255,140,0,0.1);border:none;padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:600;">Status</button>
          <button
            data-action="edit"
            data-id="${s.id}"
            style="font-size:11px;color:#60a5fa;background:rgba(59,130,246,0.1);border:none;padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:600;">Edit</button>
          <a href="index.html?track=${esc(s.tracking_number)}" target="_blank" style="font-size:11px;color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:8px;text-decoration:none;font-weight:600;">View</a>
        </div>
      </td>
    </tr>`).join('');
}

function renderAllTable(list) {
  const rows = list || allShipments;
  // HTML id = 'shipments-tbody-all'
  const tbody = document.getElementById('shipments-tbody-all');
  if (!tbody) return;
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);">No shipments.</td></tr>'; return; }
  const tIcons = { plane: '??', ship: '??', bus: '??', train: '??' };
  tbody.innerHTML = rows.map(s => `
    <tr>
      <td><code style="color:#FF8C00;font-family:monospace;font-size:12px;">${esc(s.tracking_number)}</code></td>
      <td>${esc(s.sender_name||'�')}</td>
      <td>${esc(s.receiver_name||'�')}</td>
      <td style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(s.origin||'�')} ? ${esc(s.destination||'�')}</td>
      <td>${s.weight ? s.weight+' kg' : '�'}</td>
      <td><span class="status-chip ${chipCls(s.status)}">${esc(s.status)}</span></td>
      <td style="color:rgba(255,255,255,0.5);font-size:12px;">${s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '�'}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button
            data-action="status"
            data-id="${s.id}"
            data-num="${esc(s.tracking_number)}"
            data-status="${esc(s.status)}"
            style="font-size:11px;color:#FF8C00;background:rgba(255,140,0,0.1);border:none;padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:600;">Status</button>
          <button
            data-action="edit"
            data-id="${s.id}"
            style="font-size:11px;color:#60a5fa;background:rgba(59,130,246,0.1);border:none;padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:600;">Edit</button>
          <button
            data-action="delete"
            data-id="${s.id}"
            data-num="${esc(s.tracking_number)}"
            style="font-size:11px;color:rgba(239,68,68,0.7);background:rgba(239,68,68,0.08);border:none;padding:4px 10px;border-radius:8px;cursor:pointer;font-weight:600;">Del</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterShipments(q) {
  const filtered = allShipments.filter(s =>
    [(s.tracking_number||''),(s.sender_name||''),(s.receiver_name||''),(s.destination||'')]
      .join(' ').toLowerCase().includes(q.toLowerCase())
  );
  renderAllTable(filtered);
}

function populateSelects() {
  // HTML uses 'lu-shipment-select' (not 'lu-select') and 'ms-shipment'
  ['lu-shipment-select','ms-shipment'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">-- Select shipment --</option>' +
      allShipments.map(s => `<option value="${s.id}" data-num="${esc(s.tracking_number)}" data-transport="${s.transport_type||'plane'}">${esc(s.tracking_number)} � ${esc(s.origin||'?')} ? ${esc(s.destination||'?')}</option>`).join('');
  });
}

async function loadQuotes() {
  const { data } = await db.from('quote_requests').select('*').order('created_at', { ascending: false });
  setEl('stat-quotes', data?.length ?? 0);
  const tbody = document.getElementById('quotes-tbody');
  if (!tbody) return;
  if (!data?.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:rgba(255,255,255,0.3);">No leads yet.</td></tr>'; return; }
  tbody.innerHTML = data.map(q => `
    <tr>
      <td>${esc(q.name||'�')}</td>
      <td><a href="mailto:${esc(q.email)}" style="color:#FF8C00;">${esc(q.email||'�')}</a></td>
      <td>${esc(q.destination||'�')}</td>
      <td>${esc(q.weight||'�')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,0.5);">${esc(q.message||'�')}</td>
      <td style="color:rgba(255,255,255,0.4);font-size:12px;white-space:nowrap;">${new Date(q.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
    </tr>`).join('');
}

// -------------------------------------
// ROUTE � LOAD SHIPMENT
// -------------------------------------
async function loadShipmentRoute() {
  const shipmentId = document.getElementById('lu-shipment-select').value;
  if (!shipmentId) { toast('Select a shipment first.', true); return; }

  const shipment = allShipments.find(s => s.id === shipmentId);
  if (!shipment) { toast('Shipment not found.', true); return; }
  if (!shipment.origin || !shipment.destination) {
    toast('Shipment needs Origin & Destination set to load route.', true); return;
  }

  showRouteLoading(true);
  try {
    const [oRes, dRes] = await Promise.all([
      geocodePromise(null, shipment.origin),
      geocodePromise(null, shipment.destination),
    ]);


    const originLatLng = oRes.geometry.location;
    const destLatLng   = dRes.geometry.location;

    // Cache geocoded coords
    if (!shipment.origin_lat) {
      await db.from('shipments').update({
        origin_lat: originLatLng.lat(), origin_lng: originLatLng.lng(),
        destination_lat: destLatLng.lat(), destination_lng: destLatLng.lng(),
      }).eq('id', shipmentId);
    }

    const transportType = shipment.transport_type || 'plane';
    const waypoints = generateSmartWaypoints(originLatLng, destLatLng, transportType);

    const stops = [
      { name: shipment.origin, lat: originLatLng.lat(), lng: originLatLng.lng(), type: 'origin', reason: 'Departure Point' },
      ...waypoints,
      { name: shipment.destination, lat: destLatLng.lat(), lng: destLatLng.lng(), type: 'destination', reason: 'Final Destination' },
    ];

    const savedIndex = Math.min(shipment.current_stop_index || 0, stops.length - 1);

    routeState = {
      ...routeState,
      shipment,
      allStops: stops,
      currentIndex: savedIndex,
      transportType,
      routePolyline: null, originMarker: null, destMarker: null,
      transportMarker: null, stopMarkers: [],
    };

    // Draw
    clearRoute();
    drawRouteOnMap(stops, transportType, savedIndex);

    // Update UI
    updateTransportTypeUI(transportType);
    renderStopsList(stops, savedIndex);

    // Enable advance button
    enableAdvanceBtn(savedIndex < stops.length - 1);

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    stops.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
    adminMap.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });

    log(`??? Route loaded: ${shipment.origin} ? ${shipment.destination} (${stops.length} stops, ${transportType})`);
    toast(`Route loaded! ${stops.length} stops via ${transportType} ???`);

    // Persist to DB so customer tracking map shows multi-stop route
    await persistRouteStops(shipmentId, stops);

  } catch (err) {
    toast('? ' + err.message, true);
    console.error(err);
  } finally {
    showRouteLoading(false);
  }
}

async function geocodePromise(_, address) {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SendFlexTrace/1.0' }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    // Return a mock result shape compatible with the caller
    return { geometry: { location: { lat: () => lat, lng: () => lng } } };
  }
  throw new Error(`Could not find "${address}" on map. Check spelling.`);
}


// -------------------------------------
// ROUTE � DRAW ON MAP
// -------------------------------------
function drawRouteOnMap(stops, transportType, currentIndex) {
  if (!adminMap) return;

  const path = stops.map(s => ({ lat: s.lat, lng: s.lng }));

  // Dotted route line
  routeState.routePolyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeOpacity: 0,
    icons: [{
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, strokeColor: '#FF8C00', scale: 3.5 },
      offset: '0', repeat: '18px',
    }],
    map: adminMap, zIndex: 1,
  });

  // --- Origin pin (green) ---
  routeState.originMarker = new google.maps.Marker({
    position: { lat: stops[0].lat, lng: stops[0].lng },
    map: adminMap,
    title: stops[0].name + ' (Origin)',
    icon: {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: '#4ade80', fillOpacity: 1,
      strokeColor: 'white', strokeWeight: 2,
      scale: 1.2, anchor: new google.maps.Point(0, 0),
    },
    zIndex: 12,
  });
  addInfoWindow(routeState.originMarker, `
    <div style="font-family:Inter,sans-serif;padding:8px 10px;min-width:160px;">
      <div style="font-weight:700;color:#050A30;font-size:13px;">?? Origin</div>
      <div style="color:#333;font-size:12px;margin-top:4px;font-weight:600;">${stops[0].name}</div>
      <div style="color:#777;font-size:10px;margin-top:2px;">Departure point</div>
    </div>`);

  // --- Destination pin (orange) ---
  const last = stops[stops.length - 1];
  routeState.destMarker = new google.maps.Marker({
    position: { lat: last.lat, lng: last.lng },
    map: adminMap,
    title: last.name + ' (Destination)',
    icon: {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: '#FF8C00', fillOpacity: 1,
      strokeColor: 'white', strokeWeight: 2,
      scale: 1.2, anchor: new google.maps.Point(0, 0),
    },
    zIndex: 12,
  });
  addInfoWindow(routeState.destMarker, `
    <div style="font-family:Inter,sans-serif;padding:8px 10px;min-width:160px;">
      <div style="font-weight:700;color:#050A30;font-size:13px;">?? Destination</div>
      <div style="color:#333;font-size:12px;margin-top:4px;font-weight:600;">${last.name}</div>
      <div style="color:#777;font-size:10px;margin-top:2px;">Final delivery point</div>
    </div>`);

  // --- Intermediate stop markers ---
  routeState.stopMarkers = [];
  for (let i = 1; i < stops.length - 1; i++) {
    const stop = stops[i];
    const isPassed  = i < currentIndex;
    const isCurrent = i === currentIndex;
    const marker = new google.maps.Marker({
      position: { lat: stop.lat, lng: stop.lng },
      map: adminMap,
      title: `Stop ${i}: ${stop.name}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: isPassed ? '#4ade80' : (isCurrent ? '#FF8C00' : '#334477'),
        fillOpacity: 1,
        strokeColor: isPassed ? '#4ade80' : (isCurrent ? '#FF8C00' : 'rgba(255,255,255,0.5)'),
        strokeWeight: 2,
      },
      label: { text: String(i), color: 'white', fontSize: '10px', fontWeight: 'bold' },
      zIndex: 9,
    });
    addInfoWindow(marker, `
      <div style="font-family:Inter,sans-serif;padding:8px 10px;min-width:160px;">
        <div style="font-weight:700;color:#050A30;font-size:12px;">Stop ${i}: ${stop.name}</div>
        <div style="color:#FF8C00;font-size:11px;margin-top:3px;">${stop.reason || 'Transit'}</div>
        <div style="color:#888;font-size:10px;margin-top:2px;">${stop.type || 'Hub'}</div>
      </div>`);
    routeState.stopMarkers.push(marker);
  }

  // --- Transport icon at current position ---
  const cur = stops[currentIndex] || stops[0];
  routeState.transportMarker = new google.maps.Marker({
    position: { lat: cur.lat, lng: cur.lng },
    map: adminMap,
    title: 'Current Cargo Position',
    icon: {
      url: getTransportSVGDataURI(transportType),
      scaledSize: getTransportIconSize(transportType),
      anchor: getTransportAnchor(transportType),
    },
    zIndex: 20,
    animation: google.maps.Animation.BOUNCE,
  });
  setTimeout(() => { if (routeState.transportMarker) routeState.transportMarker.setAnimation(null); }, 2000);
}

function addInfoWindow(marker, content) {
  const iw = new google.maps.InfoWindow({ content });
  marker.addListener('click', () => iw.open(adminMap, marker));
}

// -------------------------------------
// ROUTE � PERSIST STOPS TO DB
// -------------------------------------
async function persistRouteStops(shipmentId, stops) {
  // Atomically replace: delete old rows, insert new rows
  await db.from('route_stops').delete().eq('shipment_id', shipmentId);

  const rows = stops.map((stop, idx) => ({
    shipment_id: shipmentId,
    stop_index:  idx,
    name:        stop.name || `Stop ${idx}`,
    lat:         stop.lat,
    lng:         stop.lng,
    stop_type:   idx === 0 ? 'origin' : (idx === stops.length - 1 ? 'destination' : 'waypoint'),
    reason:      stop.reason || null,
  }));

  const { error } = await db.from('route_stops').insert(rows);
  if (error) {
    console.warn('[Admin] route_stops persist error:', error.message);
    toast('?? Route in-memory only � DB sync failed: ' + error.message, true);
  } else {
    log(`? Route stops (${rows.length}) synced to DB � customer map updated`);
  }
}

// -------------------------------------
// ROUTE � CLEAR
// -------------------------------------
function clearRoute() {
  if (routeState.routePolyline) { routeState.routePolyline.setMap(null); routeState.routePolyline = null; }
  if (routeState.originMarker)  { routeState.originMarker.setMap(null);  routeState.originMarker = null; }
  if (routeState.destMarker)    { routeState.destMarker.setMap(null);    routeState.destMarker = null; }
  if (routeState.transportMarker){ routeState.transportMarker.setMap(null); routeState.transportMarker = null; }
  routeState.stopMarkers.forEach(m => m && m.setMap(null));
  routeState.stopMarkers = [];
  if (routeState.animFrame) { cancelAnimationFrame(routeState.animFrame); routeState.animFrame = null; }
}

// -------------------------------------
// ROUTE � ADVANCE TO NEXT STOP
// -------------------------------------
async function advanceToNextStop() {
  if (!routeState.shipment || !routeState.allStops.length) {
    toast('Load a shipment route first.', true); return;
  }
  if (routeState.currentIndex >= routeState.allStops.length - 1) {
    toast('?? Already at final destination!'); return;
  }

  const nextIndex = routeState.currentIndex + 1;
  const nextStop  = routeState.allStops[nextIndex];
  const isLast    = nextIndex === routeState.allStops.length - 1;

  enableAdvanceBtn(false);

  // Animate transport icon to next stop
  if (routeState.transportMarker) {
    await animateMarkerTo(routeState.transportMarker, new google.maps.LatLng(nextStop.lat, nextStop.lng), 2000);
  }

  // Update state
  routeState.currentIndex = nextIndex;

  // Refresh stop markers appearance
  updateStopMarkers();

  // Update UI
  renderStopsList(routeState.allStops, nextIndex);
  enableAdvanceBtn(!isLast);

  // Pan map to new position
  adminMap.panTo({ lat: nextStop.lat, lng: nextStop.lng });

  // Save to DB
  const { error } = await db.from('shipments').update({
    lat: nextStop.lat,
    lng: nextStop.lng,
    current_stop_index: nextIndex,
    updated_at: new Date().toISOString(),
  }).eq('id', routeState.shipment.id);

  if (!error) {
    const msg = isLast
      ? `?? Arrived at FINAL DESTINATION: ${nextStop.name}`
      : `?? Advanced to Stop ${nextIndex}/${routeState.allStops.length-1}: ${nextStop.name} � ${nextStop.reason}`;
    toast(msg);
    log(msg);
    loadShipments();
  } else {
    toast('? DB save failed: ' + error.message, true);
  }
}

function updateStopMarkers() {
  routeState.stopMarkers.forEach((marker, i) => {
    const stopIdx   = i + 1;
    const isPassed  = stopIdx < routeState.currentIndex;
    const isCurrent = stopIdx === routeState.currentIndex;
    marker.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: isPassed ? '#4ade80' : (isCurrent ? '#FF8C00' : '#334477'),
      fillOpacity: 1,
      strokeColor: isPassed ? '#4ade80' : (isCurrent ? '#FF8C00' : 'rgba(255,255,255,0.5)'),
      strokeWeight: 2,
    });
  });
}

function enableAdvanceBtn(enabled) {
  const btn = document.getElementById('advance-btn');
  if (!btn) return;
  btn.style.opacity = enabled ? '1' : '0.4';
  btn.style.pointerEvents = enabled ? 'auto' : 'none';
}

// -------------------------------------
// ROUTE � RENDER STOPS LIST
// -------------------------------------
function renderStopsList(stops, currentIndex) {
  const el = document.getElementById('route-stops-list');
  if (!el) return;

  el.innerHTML = stops.map((stop, i) => {
    const isPassed  = i < currentIndex;
    const isCurrent = i === currentIndex;
    const label = i === 0 ? 'ORIGIN' : (i === stops.length - 1 ? 'DESTINATION' : `STOP ${i}`);
    const icon  = i === 0 ? '??' : (i === stops.length - 1 ? '??' : (isPassed ? '?' : (isCurrent ? '??' : '?')));
    const borderColor = isCurrent ? 'rgba(255,140,0,0.35)' : (isPassed ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)');
    const bg = isCurrent ? 'rgba(255,140,0,0.1)' : (isPassed ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)');
    const nameColor = isCurrent ? '#FF8C00' : (isPassed ? '#4ade80' : 'rgba(255,255,255,0.8)');
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:10px;margin-bottom:5px;background:${bg};border:1px solid ${borderColor};">
        <div style="font-size:14px;flex-shrink:0;">${icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:600;color:${nameColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${stop.name}</div>
          <div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:2px;">${label}${stop.reason ? ' � '+stop.reason : ''}</div>
        </div>
        ${isCurrent ? '<span style="font-size:9px;font-weight:700;color:#FF8C00;background:rgba(255,140,0,0.15);padding:2px 6px;border-radius:5px;flex-shrink:0;">HERE</span>' : ''}
      </div>`;
  }).join('');

  // Update progress badge
  const badge = document.getElementById('route-progress-badge');
  if (badge) {
    badge.style.display = 'inline-block';
    badge.textContent = `${currentIndex + 1} / ${stops.length}`;
  }
}

// -------------------------------------
// ROUTE � TRANSPORT TYPE
// -------------------------------------
async function setRouteTransportType(type) {
  routeState.transportType = type;
  updateTransportTypeUI(type);

  if (routeState.shipment) {
    // Update DB
    await db.from('shipments').update({ transport_type: type, updated_at: new Date().toISOString() }).eq('id', routeState.shipment.id);

    // Update transport icon on map
    if (routeState.transportMarker) {
      routeState.transportMarker.setIcon({
        url: getTransportSVGDataURI(type),
        scaledSize: getTransportIconSize(type),
        anchor: getTransportAnchor(type),
      });
    }

    // Regenerate waypoints with new transport type
    if (routeState.allStops.length >= 2) {
      const origin = routeState.allStops[0];
      const dest   = routeState.allStops[routeState.allStops.length - 1];
      const oLatLng = new google.maps.LatLng(origin.lat, origin.lng);
      const dLatLng = new google.maps.LatLng(dest.lat, dest.lng);
      const waypoints = generateSmartWaypoints(oLatLng, dLatLng, type);
      routeState.allStops = [origin, ...waypoints, dest];
      routeState.currentIndex = 0;
      clearRoute();
      drawRouteOnMap(routeState.allStops, type, 0);
      renderStopsList(routeState.allStops, 0);
      enableAdvanceBtn(routeState.allStops.length > 1);

      // Sync regenerated route to DB
      await persistRouteStops(routeState.shipment.id, routeState.allStops);
    }

    toast(`Transport changed to ${type} � route regenerated!`);
    log(`?? Transport type: ${type}`);
  }
}

function updateTransportTypeUI(type) {
  ['plane','ship','bus','train'].forEach(t => {
    const btn = document.getElementById(`transport-btn-${t}`);
    if (!btn) return;
    const active = t === type;
    btn.style.background    = active ? 'rgba(255,140,0,0.2)' : 'rgba(255,255,255,0.05)';
    btn.style.borderColor   = active ? 'rgba(255,140,0,0.4)' : 'rgba(255,255,255,0.1)';
    btn.style.color         = active ? '#FF8C00'              : 'rgba(255,255,255,0.5)';
  });
}

function showRouteLoading(show) {
  const el = document.getElementById('route-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// -------------------------------------
// SMART WAYPOINT GENERATOR
// -------------------------------------
function generateSmartWaypoints(originLatLng, destLatLng, transportType) {
  const hubs = TRANSPORT_HUBS[transportType] || TRANSPORT_HUBS.plane;
  const oCoord = { lat: originLatLng.lat(), lng: originLatLng.lng() };
  const dCoord = { lat: destLatLng.lat(), lng: destLatLng.lng() };
  const totalDist = haversineDistance(oCoord, dCoord);

  // Number of intermediate stops based on distance
  const numStops = totalDist > 9000 ? 3 : totalDist > 4500 ? 2 : 1;

  const reasons = {
    plane: ['Refuel & Transit Stop', 'Connecting Flight Hub', 'Cargo Transfer'],
    ship:  ['Port of Call', 'Canal / Ocean Transit', 'Customs Clearance Port'],
    bus:   ['Border Crossing', 'Rest & Customs Stop', 'Transit Terminal'],
    train: ['Rail Junction', 'Border Crossing', 'Transfer Station'],
  }[transportType] || ['Transit Hub', 'Waypoint', 'Intermediate Stop'];

  const found = new Set();
  const waypoints = [];

  for (let i = 0; i < numStops; i++) {
    const t = (i + 1) / (numStops + 1);
    const mid = interpolateGreatCircle(originLatLng, destLatLng, t);
    const midCoord = { lat: mid.lat(), lng: mid.lng() };

    let best = null, minDist = Infinity;
    for (const hub of hubs) {
      if (found.has(hub.name)) continue;
      const d = haversineDistance(midCoord, { lat: hub.lat, lng: hub.lng });
      if (d < minDist) { minDist = d; best = hub; }
    }

    if (best && minDist < 6000) {
      found.add(best.name);
      waypoints.push({ name: best.name, lat: best.lat, lng: best.lng, type: best.type, reason: reasons[i % reasons.length] });
    } else {
      waypoints.push({ name: `Transit Zone ${i+1}`, lat: midCoord.lat, lng: midCoord.lng, type: 'Ocean/Air Path', reason: reasons[i % reasons.length] });
    }
  }
  return waypoints;
}

// Great-circle interpolation (slerp)
function interpolateGreatCircle(from, to, t) {
  const lat1 = from.lat() * Math.PI / 180, lng1 = from.lng() * Math.PI / 180;
  const lat2 = to.lat()   * Math.PI / 180, lng2 = to.lng()   * Math.PI / 180;
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat2-lat1)/2), 2) + Math.cos(lat1)*Math.cos(lat2)*Math.pow(Math.sin((lng2-lng1)/2), 2)
  ));
  if (d < 0.0001) return from;
  const A = Math.sin((1-t)*d)/Math.sin(d), B = Math.sin(t*d)/Math.sin(d);
  const x = A*Math.cos(lat1)*Math.cos(lng1) + B*Math.cos(lat2)*Math.cos(lng2);
  const y = A*Math.cos(lat1)*Math.sin(lng1) + B*Math.cos(lat2)*Math.sin(lng2);
  const z = A*Math.sin(lat1)                + B*Math.sin(lat2);
  return new google.maps.LatLng(
    Math.atan2(z, Math.sqrt(x*x+y*y)) * 180/Math.PI,
    Math.atan2(y, x) * 180/Math.PI
  );
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat-a.lat)*Math.PI/180, dLng = (b.lng-a.lng)*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// -------------------------------------
// ANIMATE MARKER (smooth movement)
// -------------------------------------
function animateMarkerTo(marker, newPos, duration = 2000) {
  return new Promise(resolve => {
    const start = marker.getPosition();
    const sLat = start.lat(), sLng = start.lng();
    const eLat = newPos.lat(), eLng = newPos.lng();
    const t0 = performance.now();

    function step(now) {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      marker.setPosition(new google.maps.LatLng(
        sLat + (eLat - sLat) * eased,
        sLng + (eLng - sLng) * eased
      ));
      if (progress < 1) { routeState.animFrame = requestAnimationFrame(step); }
      else resolve();
    }
    routeState.animFrame = requestAnimationFrame(step);
  });
}

// -------------------------------------
// LIVE LOCATION UPDATE (manual coords)
// -------------------------------------
async function updateLocation() {
  const id  = document.getElementById('lu-shipment-select').value;
  const lat = parseFloat(document.getElementById('lu-lat').value);
  const lng = parseFloat(document.getElementById('lu-lng').value);
  const btn = document.getElementById('lu-btn');

  if (!id)  { toast('Select a shipment first.', true); return; }
  if (isNaN(lat)||isNaN(lng)) { toast('Click the map or enter valid coordinates.', true); return; }

  btn.disabled = true;
  btn.textContent = '? Pushing...';

  const { error } = await db.from('shipments').update({ lat, lng, updated_at: new Date().toISOString() }).eq('id', id);

  btn.disabled = false;
  btn.textContent = '?? Push Position to Map';

  const sel = document.getElementById('lu-shipment-select');
  const num = sel.options[sel.selectedIndex]?.getAttribute('data-num') || id;

  if (!error) {
    if (routeState.transportMarker && routeState.shipment?.id === id) {
      routeState.transportMarker.setPosition(new google.maps.LatLng(lat, lng));
    }
    toast(`?? ${num}: position pushed to customer map!`);
    log(`? ${num}: coords ? ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    loadShipments();
  } else {
    toast('? Update failed: ' + error.message, true);
  }
}

// -------------------------------------
// STATUS BUTTONS
// -------------------------------------
function renderStatusBtns() {
  const statuses = ['Order Placed','In Transit','Customs Hold','Customs Cleared','Out for Delivery','Delivered'];
  const icons = { 'Order Placed':'📋','In Transit':'✈️','Customs Hold':'🔒','Customs Cleared':'🛃','Out for Delivery':'🚚','Delivered':'✅' };
  const el = document.getElementById('status-buttons');
  if (!el) return;
  el.innerHTML = statuses.map(s => `
    <button onclick="quickStatus('${s}')" style="width:100%;text-align:left;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);font-size:12px;font-weight:500;padding:9px 12px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s;"
      onmouseover="this.style.background='rgba(255,140,0,0.1)';this.style.color='#FF8C00';this.style.borderColor='rgba(255,140,0,0.25)'"
      onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.color='rgba(255,255,255,0.7)';this.style.borderColor='rgba(255,255,255,0.08)'">
      ${icons[s]} ${s}
    </button>`).join('');
}

async function quickStatus(status) {
  const id = document.getElementById('lu-shipment-select').value;
  if (!id) { toast('Select a shipment first.', true); return; }
  const { error } = await db.from('shipments').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (!error) {
    const sel = document.getElementById('lu-shipment-select');
    const num = sel.options[sel.selectedIndex]?.getAttribute('data-num') || id;
    toast(`Changed ${num} ? ${status}`);
    log(`?? ${num}: status ? ${status}`);
    loadShipments();
  } else toast('? ' + error.message, true);
}

// -------------------------------------
// EMAIL NOTIFICATION SYSTEM
// -------------------------------------

/**
 * Main update + conditional email sender.
 * Called by the Status Modal's Apply button.
 * @param {object} shipmentData  - Full shipment row data
 * @param {boolean} shouldNotify - true = send email after DB save
 */
async function handleUpdateWithEmail(shipmentData, shouldNotify) {
  const { id, status, status_reason, tracking_number, updated_at, client_email } = shipmentData;

  // -- 1. Save to database --
  const { error } = await db.from('shipments').update({
    status,
    status_reason: status_reason || null,
    updated_at: updated_at || new Date().toISOString(),
  }).eq('id', id);

  if (error) {
    toast('? DB save failed: ' + error.message, true);
    return;
  }

  // -- 2. Conditionally send email --
  if (shouldNotify) {
    if (!client_email) {
      toast('?? Status saved but no email found for this shipment.', true);
      log(`? ${tracking_number}: status ? ${status} (no email)`);
      loadShipments();
      return;
    }

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          tracking_number,
          status,
          status_reason: status_reason || '',
          client_email,
          updated_at: updated_at || new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast('? Shipment Updated & Client Notified Successfully! ??');
        log(`? ${tracking_number}: status ? ${status} | Email sent to ${client_email}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('?? Status saved, but email failed: ' + (errData.error || res.statusText), true);
        log(`?? ${tracking_number}: status ? ${status} | Email error: ${errData.error || res.statusText}`);
      }
    } catch (fetchErr) {
      toast('?? Status saved, but email request failed. Check console.', true);
      console.error('Email fetch error:', fetchErr);
      log(`?? ${tracking_number}: status saved but email fetch failed`);
    }
  } else {
    toast(`? ${tracking_number} ? "${status}" saved silently.`);
    log(`? ${tracking_number}: status ? ${status} (no email)`);
  }

  loadShipments();
}

// -------------------------------------
// TOGGLE SWITCH ANIMATION
// -------------------------------------
function toggleNotifySwitch() {
  const checkbox  = document.getElementById('modal-notify-toggle');
  const track     = document.getElementById('toggle-track');
  const thumb     = document.getElementById('toggle-thumb');
  const sublabel  = document.getElementById('notify-sublabel');
  const applyBtn  = document.getElementById('modal-apply-btn');
  const applyLbl  = document.getElementById('modal-apply-label');
  const emailAlert = document.getElementById('modal-email-alert');

  checkbox.checked = !checkbox.checked;
  const on = checkbox.checked;

  if (on) {
    track.style.background = '#7C3AED';
    track.style.borderColor = '#7C3AED';
    thumb.style.left = '29px';
    thumb.style.background = '#ffffff';
    sublabel.textContent = 'Email notification WILL be sent after saving';
    sublabel.style.color = '#a78bfa';
    applyLbl.textContent = 'Save & Notify Client';
    applyBtn.style.background = '#7C3AED';
    applyBtn.onmouseover = () => applyBtn.style.background = '#6D28D9';
    applyBtn.onmouseout  = () => applyBtn.style.background = '#7C3AED';

    // Show email alert if no email on this shipment
    if (!modalClientEmail) {
      emailAlert.classList.remove('hidden');
    } else {
      emailAlert.classList.add('hidden');
    }
  } else {
    track.style.background = 'rgba(255,255,255,0.1)';
    track.style.borderColor = 'rgba(255,255,255,0.15)';
    thumb.style.left = '3px';
    thumb.style.background = 'rgba(255,255,255,0.4)';
    sublabel.textContent = 'Toggle ON to send email notification after saving';
    sublabel.style.color = 'rgba(255,255,255,0.4)';
    applyLbl.textContent = 'Save Changes';
    applyBtn.style.background = '#FF8C00';
    applyBtn.onmouseover = () => applyBtn.style.background = '#e67e00';
    applyBtn.onmouseout  = () => applyBtn.style.background = '#FF8C00';
    emailAlert.classList.add('hidden');
  }
}

// -------------------------------------
// STATUS MODAL
// -------------------------------------
function openModal(id, trackingNum, currentStatus) {
  if (!id || id === 'null' || id === 'undefined') {
    toast('? Cannot open modal: shipment ID is missing.', true);
    return;
  }
  modalShipmentId = id;

  // Find shipment to pre-read email + reason
  const shipment = allShipments.find(s => s.id === id);
  modalClientEmail = shipment?.client_email || null;

  document.getElementById('modal-tracking-id').textContent = trackingNum;
  document.getElementById('modal-status').value = currentStatus;
  document.getElementById('modal-reason').value = shipment?.status_reason || '';

  // -- Populate client email field so CEO can add/edit it directly
  const emailInput = document.getElementById('modal-client-email');
  if (emailInput) emailInput.value = modalClientEmail || '';

  // Reset toggle to OFF state
  const checkbox = document.getElementById('modal-notify-toggle');
  if (checkbox && checkbox.checked) toggleNotifySwitch();
  if (checkbox) checkbox.checked = false;
  const toggleTrack = document.getElementById('toggle-track');
  const toggleThumb = document.getElementById('toggle-thumb');
  if (toggleTrack) { toggleTrack.style.background = 'rgba(255,255,255,0.1)'; toggleTrack.style.borderColor = 'rgba(255,255,255,0.15)'; }
  if (toggleThumb) { toggleThumb.style.left = '3px'; toggleThumb.style.background = 'rgba(255,255,255,0.4)'; }
  const sublabel = document.getElementById('notify-sublabel');
  if (sublabel) sublabel.textContent = 'Toggle ON to send email notification after saving';
  const applyLabel = document.getElementById('modal-apply-label');
  if (applyLabel) applyLabel.textContent = 'Save Changes';
  const applyBtn = document.getElementById('modal-apply-btn');
  if (applyBtn) applyBtn.style.background = '#FF8C00';
  document.getElementById('modal-email-alert')?.classList.add('hidden');

  document.getElementById('status-modal').classList.remove('hidden');
}

async function applyStatusUpdate() {
  const status        = document.getElementById('modal-status').value;
  const status_reason = document.getElementById('modal-reason').value.trim();
  const shouldNotify  = document.getElementById('modal-notify-toggle')?.checked || false;

  if (!modalShipmentId) { toast('? No shipment selected.', true); return; }

  // -- Capture ID and email into locals BEFORE closing the modal
  // (closeStatusModal nulls out modalShipmentId, so we must snapshot it first)
  const shipmentId    = modalShipmentId;
  let   activeEmail   = modalClientEmail;

  // -- Pick up email from modal input field (CEO may have just typed it)
  const emailInputEl = document.getElementById('modal-client-email');
  const enteredEmail = emailInputEl?.value.trim() || null;

  // If a new email was entered, save it to DB now
  if (enteredEmail && enteredEmail !== activeEmail) {
    await db.from('shipments').update({ client_email: enteredEmail }).eq('id', shipmentId);
    activeEmail = enteredEmail;
  }

  // Validate: notify ON but still no email?
  if (shouldNotify && !activeEmail) {
    document.getElementById('modal-email-alert')?.classList.remove('hidden');
    toast('?? No client email on file. Add an email below the toggle before notifying.', true);
    return;
  }

  const shipment = allShipments.find(s => s.id === shipmentId);
  const tracking_number = shipment?.tracking_number || shipmentId;

  closeStatusModal(); // ? safe to close now; we already have local copies

  await handleUpdateWithEmail({
    id: shipmentId,
    status,
    status_reason,
    tracking_number,
    client_email: activeEmail,
    updated_at: new Date().toISOString(),
  }, shouldNotify);
}

function closeStatusModal() {
  document.getElementById('status-modal').classList.add('hidden');
  modalShipmentId  = null;
  modalClientEmail = null;
}

document.getElementById('status-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('status-modal')) closeStatusModal();
});

// -------------------------------------
// CREATE SHIPMENT
// -------------------------------------
document.getElementById('create-shipment-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('create-btn');
  const errEl = document.getElementById('create-error');
  const okEl  = document.getElementById('create-success');
  btn.disabled = true;
  btn.innerHTML = '<div style="width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;"></div> Creating...';
  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  const payload = {
    tracking_number:  document.getElementById('cs-tracking').value.trim().toUpperCase(),
    status:           document.getElementById('cs-status').value,
    transport_type:   document.getElementById('cs-transport')?.value || 'plane',
    sender_name:      document.getElementById('cs-sender').value.trim() || null,
    sender_phone:     document.getElementById('cs-sender-phone')?.value.trim() || null,
    receiver_name:    document.getElementById('cs-receiver').value.trim() || null,
    receiver_phone:   document.getElementById('cs-receiver-phone')?.value.trim() || null,
    receiver_email:   document.getElementById('cs-receiver-email')?.value.trim() || null,
    origin:           document.getElementById('cs-origin').value.trim() || null,
    destination:      document.getElementById('cs-destination').value.trim() || null,
    lat:              parseFloat(document.getElementById('cs-lat').value) || null,
    lng:              parseFloat(document.getElementById('cs-lng').value) || null,
    weight:           parseFloat(document.getElementById('cs-weight').value) || null,
    estimated_delivery: document.getElementById('cs-delivery').value || null,
    description:      document.getElementById('cs-description').value.trim() || null,
    client_email:     document.getElementById('cs-email')?.value.trim() || null,
    status_reason:    document.getElementById('cs-reason')?.value.trim() || null,
    shipped_date:     document.getElementById('cs-shipped-date')?.value || null,
    // -- New tracking card detail fields --
    origin_city:      document.getElementById('cs-origin-city')?.value.trim() || null,
    origin_country:   document.getElementById('cs-origin-country')?.value.trim() || null,
    destination_city: document.getElementById('cs-destination-city')?.value.trim() || null,
    destination_country: document.getElementById('cs-destination-country')?.value.trim() || null,
    distance_km:      document.getElementById('cs-distance')?.value.trim() || null,
    eta_display:      document.getElementById('cs-eta')?.value.trim() || null,
    package_type:     document.getElementById('cs-package-type')?.value.trim() || null,
    service_type:     document.getElementById('cs-service-type')?.value.trim() || null,
    quantity:         parseInt(document.getElementById('cs-quantity')?.value) || null,
    dimensions:       document.getElementById('cs-dimensions')?.value.trim() || null,
    declared_value:   document.getElementById('cs-declared-value')?.value.trim() || null,
    shipping_cost:    document.getElementById('cs-shipping-cost')?.value.trim() || null,
  };

  const { error } = await db.from('shipments').insert([payload]);
  btn.disabled = false;
  btn.innerHTML = `<svg style="width:20px;height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> Create Shipment`;

  if (error) {
    errEl.textContent = '? Error: ' + error.message;
    errEl.classList.remove('hidden');
  } else {
    okEl.innerHTML = `? <strong>${payload.tracking_number}</strong> created! <a href="index.html?track=${payload.tracking_number}" target="_blank" style="color:#FF8C00;text-decoration:underline;">Track it ?</a>`;
    okEl.classList.remove('hidden');
    document.getElementById('create-shipment-form').reset();
    loadShipments();
    setTimeout(() => okEl.classList.add('hidden'), 8000);
  }
});


function autoGenId() {
  const y = new Date().getFullYear();
  const r = String(Math.floor(Math.random()*900)+100);
  document.getElementById('cs-tracking').value = `GFT-${y}-${r}`;
}
// Alias used by admin.html button
const generateTrackingId = autoGenId;

// -------------------------------------
// DELETE
// -------------------------------------
async function delShipment(id, num) {
  if (!confirm(`Delete shipment ${num}? This is permanent.`)) return;
  const { error } = await db.from('shipments').delete().eq('id', id);
  if (!error) { toast(`??? ${num} deleted.`); loadShipments(); }
  else toast('? ' + error.message, true);
}

// -------------------------------------
// MILESTONE
// -------------------------------------
document.getElementById('milestone-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const shipId = document.getElementById('ms-shipment').value;
  const message = document.getElementById('ms-message').value.trim();
  const location_name = document.getElementById('ms-location').value.trim() || null;
  const msg = document.getElementById('milestone-result');
  if (!shipId||!message) { showFormMsg(msg, '? Select a shipment and enter a message.', false); return; }
  const { error } = await db.from('milestones').insert([{ shipment_id:shipId, message, location_name, timestamp:new Date().toISOString() }]);
  if (error) { showFormMsg(msg, '? ' + error.message, false); }
  else {
    showFormMsg(msg, '? Milestone pushed � visible instantly on customer tracking page!', true);
    document.getElementById('ms-message').value = '';
    document.getElementById('ms-location').value = '';
    toast('??? Milestone sent to customer!');
  }
});

function setTpl(text) { document.getElementById('ms-message').value = text; }
// Alias used in admin.html onclick
const setMilestoneTemplate = setTpl;

// -------------------------------------
// REALTIME
// -------------------------------------
db.channel('cmd-shipments')
  .on('postgres_changes', { event:'*', schema:'public', table:'shipments' }, () => loadShipments())
  .subscribe();

// -------------------------------------
// UTILITIES
// -------------------------------------
function chipCls(s) {
  return {
    'Delivered':       'green',
    'In Transit':      'blue',
    'Out for Delivery':'orange',
    'Customs Cleared': 'orange',
    'Customs Hold':    'red',
    'On Hold':         'red',
  }[s] || 'gray';
}

// -------------------------------------
// EDIT SHIPMENT MODAL
// -------------------------------------
function openEditModal(id) {
  const s = allShipments.find(x => x.id === id);
  if (!s) { toast('Shipment not found.', true); return; }

  // Populate all fields
  document.getElementById('edit-id').value                = s.id;
  document.getElementById('edit-tracking').value          = s.tracking_number || '';
  document.getElementById('edit-status').value            = s.status || 'Order Placed';
  document.getElementById('edit-sender').value            = s.sender_name || '';
  document.getElementById('edit-sender-phone').value      = s.sender_phone || '';
  document.getElementById('edit-receiver').value          = s.receiver_name || '';
  document.getElementById('edit-receiver-phone').value    = s.receiver_phone || '';
  document.getElementById('edit-client-email').value      = s.client_email || '';
  document.getElementById('edit-receiver-email').value    = s.receiver_email || '';
  document.getElementById('edit-origin').value            = s.origin || '';
  document.getElementById('edit-destination').value       = s.destination || '';
  document.getElementById('edit-weight').value            = s.weight || '';
  document.getElementById('edit-description').value       = s.description || '';
  document.getElementById('edit-transport').value         = s.transport_type || 'plane';
  document.getElementById('edit-shipped-date').value      = s.shipped_date || '';
  document.getElementById('edit-delivery').value          = s.estimated_delivery || '';
  document.getElementById('edit-distance').value          = s.distance_km || '';
  document.getElementById('edit-eta').value               = s.eta_display || '';
  document.getElementById('edit-package-type').value      = s.package_type || '';
  document.getElementById('edit-service-type').value      = s.service_type || '';
  document.getElementById('edit-quantity').value          = s.quantity || '';
  document.getElementById('edit-dimensions').value        = s.dimensions || '';
  document.getElementById('edit-declared-value').value    = s.declared_value || '';
  document.getElementById('edit-shipping-cost').value     = s.shipping_cost || '';
  document.getElementById('edit-origin-city').value       = s.origin_city || '';
  document.getElementById('edit-origin-country').value    = s.origin_country || '';
  document.getElementById('edit-destination-city').value  = s.destination_city || '';
  document.getElementById('edit-destination-country').value = s.destination_country || '';

  document.getElementById('edit-error').classList.add('hidden');
  document.getElementById('edit-success').classList.add('hidden');
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function saveEditShipment() {
  const id = document.getElementById('edit-id').value;
  if (!id) { toast('No shipment ID found.', true); return; }

  const btn = document.getElementById('edit-save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const payload = {
    tracking_number:      document.getElementById('edit-tracking').value.trim(),
    status:               document.getElementById('edit-status').value,
    sender_name:          document.getElementById('edit-sender').value.trim(),
    sender_phone:         document.getElementById('edit-sender-phone').value.trim(),
    receiver_name:        document.getElementById('edit-receiver').value.trim(),
    receiver_phone:       document.getElementById('edit-receiver-phone').value.trim(),
    client_email:         document.getElementById('edit-client-email').value.trim(),
    receiver_email:       document.getElementById('edit-receiver-email').value.trim(),
    origin:               document.getElementById('edit-origin').value.trim(),
    destination:          document.getElementById('edit-destination').value.trim(),
    weight:               parseFloat(document.getElementById('edit-weight').value) || null,
    description:          document.getElementById('edit-description').value.trim(),
    transport_type:       document.getElementById('edit-transport').value,
    shipped_date:         document.getElementById('edit-shipped-date').value || null,
    estimated_delivery:   document.getElementById('edit-delivery').value || null,
    distance_km:          document.getElementById('edit-distance').value.trim() || null,
    eta_display:          document.getElementById('edit-eta').value.trim() || null,
    package_type:         document.getElementById('edit-package-type').value.trim() || null,
    service_type:         document.getElementById('edit-service-type').value.trim() || null,
    quantity:             parseInt(document.getElementById('edit-quantity').value) || null,
    dimensions:           document.getElementById('edit-dimensions').value.trim() || null,
    declared_value:       document.getElementById('edit-declared-value').value.trim() || null,
    shipping_cost:        document.getElementById('edit-shipping-cost').value.trim() || null,
    origin_city:          document.getElementById('edit-origin-city').value.trim() || null,
    origin_country:       document.getElementById('edit-origin-country').value.trim() || null,
    destination_city:     document.getElementById('edit-destination-city').value.trim() || null,
    destination_country:  document.getElementById('edit-destination-country').value.trim() || null,
    updated_at:           new Date().toISOString(),
  };

  const { error } = await db.from('shipments').update(payload).eq('id', id);

  btn.disabled = false;
  btn.textContent = 'Save Changes';

  if (error) {
    document.getElementById('edit-error').textContent = '❌ ' + error.message;
    document.getElementById('edit-error').classList.remove('hidden');
  } else {
    document.getElementById('edit-success').textContent = '✅ Shipment updated successfully!';
    document.getElementById('edit-success').classList.remove('hidden');
    toast('✅ Shipment updated successfully!');
    log(`✏️ Shipment ${payload.tracking_number} edited`);
    loadShipments();
    setTimeout(() => closeEditModal(), 1500);
  }
}

// -------------------------------------
// ADMIN ARRIVAL ALERT (In Transit → Customs Hold)
// -------------------------------------
const _alertedArrivals = new Set();

function checkArrivalAlerts(shipments) {
  const banner = document.getElementById('arrival-alert-banner');
  const list   = document.getElementById('arrival-alert-list');
  if (!banner || !list) return;

  const arrived = shipments.filter(s => s.status === 'In Transit' && s._arrived_at_dest);
  // Fallback: flag any In Transit shipments where progress >= 98%
  // (we check via the routeState if available, but also just show all In Transit as a reminder)
  const inTransit = shipments.filter(s => s.status === 'In Transit');
  if (!inTransit.length) { banner.classList.add('hidden'); return; }

  let hasNew = false;
  const items = inTransit.map(s => {
    const isNew = !_alertedArrivals.has(s.id);
    if (isNew) { _alertedArrivals.add(s.id); hasNew = true; }
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <div>
        <span style="color:#fbbf24;font-weight:700;font-size:13px;">${esc(s.tracking_number)}</span>
        <span style="color:rgba(255,255,255,0.5);font-size:12px;margin-left:8px;">${esc(s.origin||'?')} → ${esc(s.destination||'?')}</span>
      </div>
      <button onclick="openModal('${s.id}','${esc(s.tracking_number)}','In Transit')" style="font-size:11px;background:#7c3aed;color:#fff;border:none;padding:4px 12px;border-radius:8px;cursor:pointer;font-weight:600;white-space:nowrap;">Update Status</button>
    </div>`;
  }).join('');

  list.innerHTML = items;
  banner.classList.remove('hidden');
}

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function setEl(id, val) { const e = document.getElementById(id); if (e) e.textContent = val; }

// -------------------------------------
// AUTO-CALCULATE DISTANCE & ETA
// -------------------------------------
function haversineKmAdmin(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function autoCalcDistanceETA() {
  const origin      = document.getElementById('cs-origin')?.value.trim();
  const destination = document.getElementById('cs-destination')?.value.trim();
  const transportType = document.getElementById('cs-transport')?.value || 'plane';
  const distField     = document.getElementById('cs-distance');
  const etaField      = document.getElementById('cs-eta');
  const deliveryField = document.getElementById('cs-delivery');
  const shippedDate   = document.getElementById('cs-shipped-date')?.value;

  if (!origin || !destination || origin.length < 3 || destination.length < 3) return;

  // Show calculating state
  if (distField) { distField.value = ''; distField.placeholder = '📍 Calculating...'; }
  if (etaField)  { etaField.value  = ''; etaField.placeholder  = '⏱ Calculating...'; }

  try {
    const [oRes, dRes] = await Promise.all([
      geocodePromise(null, origin),
      geocodePromise(null, destination)
    ]);

    const oLat = oRes.geometry.location.lat();
    const oLng = oRes.geometry.location.lng();
    const dLat = dRes.geometry.location.lat();
    const dLng = dRes.geometry.location.lng();

    const distKm = Math.round(haversineKmAdmin(oLat, oLng, dLat, dLng));

    // Realistic transport speeds (km/h)
    const speeds = { plane: 900, ship: 35, bus: 80, train: 120 };
    const speed  = speeds[transportType] || 900;
    const hours  = distKm / speed;

    let etaStr;
    if (hours < 1)       etaStr = `${Math.round(hours * 60)} min`;
    else if (hours < 48) etaStr = `${Math.round(hours)}h`;
    else                 etaStr = `${Math.ceil(hours / 24)} days`;

    if (distField) { distField.value = `${distKm.toLocaleString()} km`; distField.placeholder = 'e.g. 4065 km'; }
    if (etaField)  { etaField.value  = etaStr; etaField.placeholder  = 'e.g. 63h or 4 days'; }

    // ── Auto-calculate Estimated Arrival Date ──
    // Use the admin-entered shipped date; fall back to today if not set
    const baseDate = shippedDate ? new Date(shippedDate + 'T00:00:00') : new Date();
    const arrivalDate = new Date(baseDate.getTime() + hours * 3600 * 1000);
    const arrivalISO  = arrivalDate.toISOString().split('T')[0]; // YYYY-MM-DD
    if (deliveryField && !deliveryField.value) {
      // Only auto-fill if not already manually set
      deliveryField.value = arrivalISO;
    } else if (deliveryField) {
      // If shipped date changed, always update
      deliveryField.value = arrivalISO;
    }

    const arrivalDisplay = arrivalDate.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
    toast(`📐 Auto-calculated — ${distKm.toLocaleString()} km · ETA: ${etaStr} · Arrival: ${arrivalDisplay}`);
  } catch (err) {
    if (distField) distField.placeholder = 'e.g. 4065 km';
    if (etaField)  etaField.placeholder  = 'e.g. 63h or 4 days';
    console.warn('Auto-calc distance/ETA failed:', err);
  }
}

function log(msg) {
  // HTML uses id='update-log'
  const el = document.getElementById('update-log');
  if (!el) return;
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.prepend(line);
  el.querySelectorAll('div').forEach((d,i) => { if (i > 30) d.remove(); });
}

function toast(msg, isErr = false) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;font-size:13px;font-weight:500;padding:12px 18px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;backdrop-filter:blur(20px);border:1px solid ${isErr?'rgba(239,68,68,0.2)':'rgba(255,140,0,0.2)'};background:${isErr?'rgba(30,0,0,0.9)':'rgba(5,10,48,0.95)'};color:${isErr?'#f87171':'white'};animation:fadeIn 0.3s ease;max-width:360px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 5000);
}

function showFormMsg(el, msg, ok) {
  el.innerHTML = msg;
  el.style.cssText = `border-radius:12px;padding:12px 16px;font-size:13px;${ok?'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#4ade80;':'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#f87171;'}`;
  el.classList.remove('hidden');
  if (ok) setTimeout(() => el.classList.add('hidden'), 6000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from { opacity:0;transform:translateX(20px); } to { opacity:1;transform:translateX(0); } }
  .status-chip.red   { background:rgba(239,68,68,0.15);color:#f87171; }
`;
document.head.appendChild(style);

console.log('%c?? GFT Command Centre', 'color:#FF8C00;font-size:16px;font-weight:bold;');
