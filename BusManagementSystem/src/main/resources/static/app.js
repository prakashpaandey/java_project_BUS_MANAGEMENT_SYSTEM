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
    realTimeDataInterval: null
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
                initializeDashboard();
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
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        window.location.href = 'login.html';
    }
}

// Initialize the dashboard
async function initializeDashboard() {
    // Set user info
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.fullName;
        document.getElementById('userAvatarText').textContent = currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Apply saved preferences
    applySavedPreferences();
    
    // Initialize UI components
    initializeUI();
    
    // Load data from API
    await loadDashboardData();
    
    // Initialize real-time updates
    initializeRealTimeUpdates();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show welcome message
    setTimeout(() => {
        showToast(`Welcome back, ${currentUser.fullName.split(' ')[0]}`, 'success');
    }, 1000);
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
        populateBusTable();
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
    
    // Navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.querySelector('span').textContent.toLowerCase().replace(' ', '-');
            handleNavigation(view, this);
        });
    });

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
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAllModals);
    
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeAllModals);

    const saveBusBtn = document.getElementById('saveBusBtn');
    if (saveBusBtn) saveBusBtn.addEventListener('click', saveNewBus);
}

function handleNavigation(view, linkElement) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    linkElement.classList.add('active');
    
    state.activeTab = view;
    showToast(`Navigated to ${linkElement.querySelector('span').textContent}`, 'info');
    
    // In a real SPA, this would swap content. 
    // Here we might just filter or update the current view if we stay on one page.
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
