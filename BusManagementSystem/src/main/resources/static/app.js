const API_BASE = '/api';
let currentUser = null;
let currentToken = localStorage.getItem('token');
const DateTime = luxon.DateTime;

// Application state
const state = {
    buses: [],
    routes: [],
    schedules: [],
    drivers: [],
    bookings: [],
    passengers: [],
    activities: [],
    notifications: [],
    activeTab: 'dashboard',
    darkMode: false,
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    liveTrackingInterval: null,
    realTimeDataInterval: null,
    currentPage: window.location.pathname.split('/').pop() || 'index.html'
};

// Auth State Management
async function initApp() {
    if (currentToken) {
        try {
            const response = await fetch(`${API_BASE}/auth/validate`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            
            if (!response.ok) {
                handleUnauthenticated();
                return;
            }

            const data = await response.json();
            if (data.valid) {
                currentUser = data.admin;
                initializeCommonUI();
                if (state.currentPage === 'index.html' || state.currentPage === '') {
                    initializeDashboard();
                } else if (state.currentPage === 'buses.html') {
                    initializeBusManagementPage();
                }
            } else {
                handleUnauthenticated();
            }
        } catch (e) {
            console.error('Auth check failed:', e);
            handleUnauthenticated();
        }
    } else {
        handleUnauthenticated();
    }
}

function handleUnauthenticated() {
    localStorage.removeItem('token');
    const path = window.location.pathname;
    if (path.includes('index.html') || path.includes('buses.html') || path.endsWith('/')) {
        window.location.href = 'login.html';
    }
}

// Initialize Common UI (Header, Sidebar)
function initializeCommonUI() {
    if (currentUser) {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatarText');
        const roleEl = document.getElementById('userRole');
        
        if (nameEl) nameEl.textContent = currentUser.fullName;
        if (avatarEl) avatarEl.textContent = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
        if (roleEl) roleEl.textContent = currentUser.role === 'ADMIN' ? 'System Administrator' : 'Portal User';
    }

    applySavedPreferences();
    initializeUI();
    setupEventListeners();
}

// Initialize the dashboard
async function initializeDashboard() {
    state.activeTab = 'dashboard';
    
    // Load data from API
    await loadDashboardData();
    
    // Initialize real-time updates
    initializeRealTimeUpdates();
    
    // Show welcome message
    setTimeout(() => {
        showToast(`Welcome back, ${currentUser.fullName.split(' ')[0]}`, 'success');
    }, 1000);
}

// Initialize Bus Management Page
async function initializeBusManagementPage() {
    state.activeTab = 'bus-management';
    
    // Load data
    try {
        const buses = await apiFetch('/buses');
        state.buses = buses;
        populateBusManagement();
    } catch (e) {
        console.error('Failed to load buses:', e);
        showToast('Error loading fleet data', 'error');
    }
}

async function loadDashboardData() {
    try {
        // Fetch all necessary data in parallel
        const [buses, routes, schedules, drivers, bookings, passengers] = await Promise.all([
            apiFetch('/buses'),
            apiFetch('/routes'),
            apiFetch('/schedules'),
            apiFetch('/drivers'),
            apiFetch('/bookings'),
            apiFetch('/passengers')
        ]);
        
        state.buses = buses;
        state.routes = routes;
        state.schedules = schedules;
        state.drivers = drivers;
        state.bookings = bookings;
        state.passengers = passengers;
        
        // Map data for display
        updateStats();
        populateBusTable(); // Dashboard table
        populateBusManagement(); // Bus Management view
        updateActiveBusesList();
        
        // Mock some activities and notifications for now
        // In a real app, these would come from the backend too
        state.activities = generateMockActivities();
        state.notifications = generateMockNotifications();
        
        populateActivityTable();
        populateNotifications();
        updateSystemAlerts();
        
        // Initialize Charts
        initializeCharts();
        
    } catch (e) {
        console.error('Failed to load dashboard data:', e);
        showToast('Error loading real-time data', 'error');
    }
}

function updateStats() {
    document.getElementById('totalBuses').textContent = state.buses.length || 0;
    document.getElementById('totalRoutes').textContent = state.routes.length || 0;
    document.getElementById('totalPassengers').textContent = state.passengers.length.toLocaleString() || '0';
    
    // Calculate total revenue from bookings
    const totalRevenue = state.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    document.getElementById('dailyRevenue').textContent = '$' + totalRevenue.toLocaleString();
    
    // Efficiency mockup
    document.getElementById('fleetEfficiency').textContent = '94.2%';
    document.getElementById('activeIncidents').textContent = '3';
}

function populateBusTable() {
    const tableBody = document.getElementById('busTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const displayBuses = state.buses.slice(0, 10); // Show first 10
    
    displayBuses.forEach(bus => {
        const tr = document.createElement('tr');
        
        // Find if this bus has a schedule/route
        const busSchedule = state.schedules.find(s => s.bus && s.bus.busNumber === bus.busNumber);
        const routeName = busSchedule ? `${busSchedule.route.source} → ${busSchedule.route.destination}` : 'Unassigned';
        
        // Find driver
        const driverName = busSchedule && busSchedule.driver ? busSchedule.driver.fullName : 'To be assigned';
        
        const statusClass = bus.isAvailable ? 'status-active' : 'status-maintenance';
        const statusText = bus.isAvailable ? 'Available' : 'Maintenance';
        
        tr.innerHTML = `
            <td style="font-weight: 700;">${bus.busNumber}</td>
            <td><div class="bus-type">${bus.busType}</div></td>
            <td>${bus.totalSeats} seats</td>
            <td>${routeName}</td>
            <td>${driverName}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
            </td>
            <td><div class="efficiency-mini">95%</div></td>
            <td>
                <div class="d-flex gap-10">
                    <button class="btn btn-sm btn-icon btn-outline" onclick="viewBusDetails('${bus.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-outline" onclick="editBus('${bus.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-icon btn-outline" onclick="deleteBus('${bus.id}')" title="Delete" style="color: var(--danger); border-color: var(--danger);">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateActiveBusesList() {
    const list = document.getElementById('activeBusesList');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Only show "Available" buses as active in the tracking list
    const activeBuses = state.buses.filter(b => b.isAvailable).slice(0, 5);
    
    activeBuses.forEach(bus => {
        const busSchedule = state.schedules.find(s => s.bus && s.bus.busNumber === bus.busNumber);
        const routeName = busSchedule ? busSchedule.route.source + '...' : 'Standby';
        
        const item = document.createElement('div');
        item.className = 'tracking-item';
        item.innerHTML = `
            <div class="tracking-bus-info">
                <div class="tracking-bus-id">${bus.busNumber}</div>
                <div class="tracking-route">${routeName}</div>
            </div>
            <div class="tracking-status status-on-route">
                <i class="fas fa-circle"></i> Active
            </div>
            <button class="btn btn-sm btn-icon" onclick="trackBus('${bus.id}')">
                <i class="fas fa-crosshairs"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

// UI & Interaction
function initializeUI() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

function updateDateTime() {
    const now = DateTime.now();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = now.toFormat('hh:mm:ss a');
    if (dateElement) dateElement.textContent = now.toFormat('EEEE, MMMM dd, yyyy');
}

function setupEventListeners() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation (Now static links, but keep sidebar persistence)
    document.querySelectorAll('.sidebar-link').forEach(link => {
        // Just let the links work naturally, sidebar-link logic handled by server-side active classes
        // but we can ensure sidebar link clicks update our state if needed.
    });

    // Bus Management Controls
    const busSearchInput = document.getElementById('busSearchInput');
    if (busSearchInput) {
        busSearchInput.addEventListener('input', () => populateBusManagement());
    }

    const busTypeFilter = document.getElementById('busTypeFilter');
    if (busTypeFilter) {
        busTypeFilter.addEventListener('change', () => populateBusManagement());
    }

    const busStatusFilter = document.getElementById('busStatusFilter');
    if (busStatusFilter) {
        busStatusFilter.addEventListener('change', () => populateBusManagement());
    }

    const viewGridBtn = document.getElementById('viewGridBtn');
    if (viewGridBtn) {
        viewGridBtn.addEventListener('click', () => switchBusView('grid'));
    }

    const viewTableBtn = document.getElementById('viewTableBtn');
    if (viewTableBtn) {
        viewTableBtn.addEventListener('click', () => switchBusView('table'));
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleUnauthenticated();
        });
    }

    // Modal Events
    const addBusBtn = document.getElementById('addBusBtn');
    if (addBusBtn) addBusBtn.addEventListener('click', () => openModal('addBusModal'));
    
    const addBusBtnMain = document.getElementById('addBusBtnMain');
    if (addBusBtnMain) addBusBtnMain.addEventListener('click', () => openModal('addBusModal'));
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAllModals);
    
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeAllModals);

    const saveBusBtn = document.getElementById('saveBusBtn');
    if (saveBusBtn) saveBusBtn.addEventListener('click', saveNewBus);
}

// handleNavigation removed as we use multi-page anchors now

function switchBusView(viewType) {
    const gridContainer = document.getElementById('busGridContainer');
    const tableContainer = document.getElementById('busTableContainer');
    const gridBtn = document.getElementById('viewGridBtn');
    const tableBtn = document.getElementById('viewTableBtn');

    if (viewType === 'grid') {
        gridContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
        gridBtn.classList.add('active');
        tableBtn.classList.remove('active');
    } else {
        gridContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        gridBtn.classList.remove('active');
        tableBtn.classList.add('active');
    }
}

function populateBusManagement() {
    const gridContainer = document.getElementById('busGridContainer');
    const tableBody = document.getElementById('busManagementTableBody');
    if (!gridContainer || !tableBody) return;

    const searchTerm = document.getElementById('busSearchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('busTypeFilter')?.value || 'all';
    const statusFilter = document.getElementById('busStatusFilter')?.value || 'all';

    const filteredBuses = state.buses.filter(bus => {
        const matchesSearch = bus.busNumber.toLowerCase().includes(searchTerm) || 
                              bus.busType.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || bus.busType.toLowerCase() === typeFilter;
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'active' ? bus.isAvailable : !bus.isAvailable);
        return matchesSearch && matchesType && matchesStatus;
    });

    // Update Stats in Bus Management view
    document.getElementById('mgmtTotalBuses').textContent = state.buses.length;
    document.getElementById('mgmtActiveBuses').textContent = state.buses.filter(b => b.isAvailable).length;
    document.getElementById('mgmtMaintenanceBuses').textContent = state.buses.filter(b => !b.isAvailable).length;

    // Render Grid
    gridContainer.innerHTML = '';
    filteredBuses.forEach(bus => {
        gridContainer.appendChild(renderBusCard(bus));
    });

    // Render Table
    tableBody.innerHTML = '';
    filteredBuses.forEach(bus => {
        const tr = document.createElement('tr');
        const statusClass = bus.isAvailable ? 'status-active' : 'status-maintenance';
        const statusText = bus.isAvailable ? 'Available' : 'Maintenance';
        
        tr.innerHTML = `
            <td style="font-weight: 700;">${bus.busNumber}</td>
            <td><div class="bus-type">${bus.busType}</div></td>
            <td>NEP-1029</td>
            <td>Tata Motors</td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
            </td>
            <td>
                <div class="d-flex gap-10">
                    <button class="btn btn-sm btn-icon btn-outline" onclick="editBus('${bus.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-icon btn-outline" onclick="deleteBus('${bus.id}')" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderBusCard(bus) {
    const card = document.createElement('div');
    card.className = 'stat-card fade-in';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    card.style.padding = '20px';
    card.style.gap = '15px';

    const statusClass = bus.isAvailable ? 'active' : 'maintenance';
    const statusText = bus.isAvailable ? 'Active' : 'In Shop';
    const statusColor = bus.isAvailable ? 'var(--success)' : 'var(--warning)';

    card.innerHTML = `
        <div class="d-flex justify-between align-start">
            <div class="d-flex align-center gap-15">
                <div class="stat-icon" style="width: 50px; height: 50px; background: var(--primary-light); color: var(--primary); border-radius: 12px;">
                    <i class="fas fa-bus"></i>
                </div>
                <div>
                    <h3 style="font-size: 18px; margin-bottom: 2px;">${bus.busNumber}</h3>
                    <div class="bus-type" style="font-size: 11px;">${bus.busType}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <span class="status-badge status-${statusClass}" style="margin-bottom: 5px;">
                    <i class="fas fa-circle"></i> ${statusText}
                </span>
                <div style="font-size: 10px; color: var(--gray);">Last Sync: 2m ago</div>
            </div>
        </div>

        <div class="bus-stats-mini" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
            <div style="background: var(--gray-light); padding: 10px; border-radius: 8px;">
                <div style="font-size: 10px; color: var(--gray);">Capacity</div>
                <div style="font-weight: 600; font-size: 14px;">${bus.totalSeats} Seats</div>
            </div>
            <div style="background: var(--gray-light); padding: 10px; border-radius: 8px;">
                <div style="font-size: 10px; color: var(--gray);">Occupancy</div>
                <div style="font-weight: 600; font-size: 14px;">75%</div>
            </div>
        </div>

        <div class="card-progress" style="margin-top: 5px;">
            <div class="d-flex justify-between mb-5">
                <span style="font-size: 11px; color: var(--gray);">Fuel Level</span>
                <span style="font-size: 11px; font-weight: 600;">82%</span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--gray-light); border-radius: 10px; overflow: hidden;">
                <div style="width: 82%; height: 100%; background: var(--success); border-radius: 10px;"></div>
            </div>
        </div>

        <div class="d-flex gap-10 mt-10">
            <button class="btn btn-primary btn-sm" style="flex: 1; justify-content: center;" onclick="viewBusDetails('${bus.id}')">
                Details
            </button>
            <button class="btn btn-outline btn-sm btn-icon" title="Edit" onclick="editBus('${bus.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline btn-sm btn-icon" title="View Route" onclick="trackBus('${bus.id}')">
                <i class="fas fa-route"></i>
            </button>
        </div>
    `;
    return card;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.querySelector('.content-area');
    const icon = document.querySelector('#sidebarToggle i');
    
    sidebar.classList.toggle('sidebar-collapsed');
    contentArea.classList.toggle('sidebar-collapsed-margin');
    
    if (sidebar.classList.contains('sidebar-collapsed')) {
        icon.className = 'fas fa-chevron-right';
        state.sidebarCollapsed = true;
    } else {
        icon.className = 'fas fa-chevron-left';
        state.sidebarCollapsed = false;
    }
    
    localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

async function saveNewBus() {
    const form = document.getElementById('addBusForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const busData = {
        busNumber: document.getElementById('busId').value,
        busType: document.getElementById('busType').value,
        totalSeats: parseInt(document.getElementById('capacity').value),
        farePerKm: 1.5, // Default or gathered from form
        isAvailable: document.getElementById('status').value === 'active'
    };
    
    try {
        const response = await apiFetch('/buses', {
            method: 'POST',
            body: JSON.stringify(busData)
        });
        
        showToast(`Bus ${busData.busNumber} added successfully!`, 'success');
        closeAllModals();
        await loadDashboardData(); // Refresh data
        
    } catch (e) {
        console.error('Save failed:', e);
        showToast('Error saving bus', 'error');
    }
}

// Charts (Adapted from index.html)
function initializeCharts() {
    const passengerCtx = document.getElementById('passengerChart');
    if (passengerCtx) {
        new Chart(passengerCtx, {
            type: 'line',
            data: {
                labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'],
                datasets: [{
                    label: 'Current Passengers',
                    data: [120, 450, 380, 520, 680, 310, 80],
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue',
                    data: [1200, 1900, 1500, 2100, 2400, 1800, 1300],
                    backgroundColor: '#7209b7',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// Utility API Link
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
            handleUnauthenticated();
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
    }
    return response.json();
}

// Mock Data Generators
function generateMockActivities() {
    return [
        { time: '10:45 AM', activity: 'Schedule Updated', busId: 'BUS-102', details: 'Route change confirmed' },
        { time: '09:30 AM', activity: 'Maintenance Log', busId: 'BUS-055', details: 'Oil change completed' },
        { time: '08:15 AM', activity: 'New Driver', busId: 'N/A', details: 'Added: Sarah Smith' }
    ];
}

function generateMockNotifications() {
    return [
        { id: 1, text: 'New booking on Route 5', time: '5m ago', read: false },
        { id: 2, text: 'Bus-012 maintenance due', time: '1h ago', read: false }
    ];
}

// Toasts
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

function applySavedPreferences() {
    if (state.sidebarCollapsed) {
        const sidebar = document.getElementById('sidebar');
        const contentArea = document.querySelector('.content-area');
        if (sidebar) sidebar.classList.add('sidebar-collapsed');
        if (contentArea) contentArea.classList.add('sidebar-collapsed-margin');
        const icon = document.querySelector('#sidebarToggle i');
        if (icon) icon.className = 'fas fa-chevron-right';
    }
}

function initializeRealTimeUpdates() {
    // Simulated updates every 20 seconds
    setInterval(() => {
        if (state.activeTab === 'dashboard') {
            // Randomly update a stat to show "life"
            const passCount = parseInt(document.getElementById('totalPassengers').textContent.replace(',', ''));
            document.getElementById('totalPassengers').textContent = (passCount + Math.floor(Math.random() * 5)).toLocaleString();
        }
    }, 20000);
}

function populateActivityTable() {
    const tableBody = document.getElementById('activityTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    state.activities.forEach(act => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${act.time}</td><td>${act.activity}</td><td>${act.busId}</td><td>${act.details}</td>`;
        tableBody.appendChild(tr);
    });
}

function populateNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    list.innerHTML = '';
    state.notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item ${notif.read ? '' : 'unread'} ${notif.id === 2 ? 'urgent' : ''}`;
        item.innerHTML = `
            <div class="notification-title">${notif.id === 2 ? 'Maintenance Alert' : 'New Booking'}</div>
            <div class="notification-message">${notif.text}</div>
            <div class="notification-time"><i class="far fa-clock"></i> ${notif.time}</div>
        `;
        list.appendChild(item);
    });
}

function updateSystemAlerts() {
    const list = document.getElementById('systemAlertsList');
    if (!list) return;
    
    list.innerHTML = '';
    const alerts = [
        { type: 'danger', icon: 'exclamation-triangle', title: 'Route 5 Delay', message: 'Bus-012 is 15 mins behind schedule' },
        { type: 'warning', icon: 'wrench', title: 'Maintenance Due', message: '3 buses require scheduled service' },
        { type: 'info', icon: 'info-circle', title: 'System Healthy', message: 'All backend services operational' }
    ];
    
    alerts.forEach(alert => {
        const item = document.createElement('div');
        item.style.padding = '15px';
        item.style.marginBottom = '10px';
        item.style.borderRadius = 'var(--radius-sm)';
        item.style.background = 'var(--light)';
        item.style.borderLeft = `4px solid var(--${alert.type})`;
        item.innerHTML = `
            <div class="d-flex align-center gap-10">
                <i class="fas fa-${alert.icon}" style="color: var(--${alert.type})"></i>
                <div>
                    <div style="font-weight: 600; font-size: 14px;">${alert.title}</div>
                    <div style="font-size: 12px; color: var(--gray);">${alert.message}</div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', initApp);
