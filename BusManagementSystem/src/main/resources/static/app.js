console.log('✨ [APP.JS] File loaded! Timestamp:', new Date().toISOString());

const API_BASE = '/api';
let currentUser = null;
let currentToken = null;
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
    console.log('🔍 [AUTH DEBUG] initApp started');
    console.log('🔍 [AUTH DEBUG] Current page:', state.currentPage);
    
    // Refresh token from localStorage on every page load
    currentToken = localStorage.getItem('token');
    console.log('🔍 [AUTH DEBUG] Token from localStorage:', currentToken ? 'EXISTS (length: ' + currentToken.length + ')' : 'NULL');
    
    if (currentToken) {
        try {
            console.log('🔍 [AUTH DEBUG] Sending validation request to:', `${API_BASE}/auth/validate`);
            const response = await fetch(`${API_BASE}/auth/validate`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            
            console.log('🔍 [AUTH DEBUG] Validation response status:', response.status);
            
            if (!response.ok) {
                console.error('❌ [AUTH DEBUG] Token validation failed:', response.status);
                handleUnauthenticated();
                return;
            }

            const data = await response.json();
            console.log('🔍 [AUTH DEBUG] Validation response data:', data);
            
            if (data.valid) {
                currentUser = data.admin;
                console.log('✅ [AUTH DEBUG] Token valid! User:', currentUser.username, 'Role:', currentUser.role);
                initializeCommonUI();

                // Role-based Access Control & Redirection
                const adminPages = ['index.html', 'buses.html', 'routes.html', 'passengers.html'];
                const passengerPages = ['passenger-dashboard.html', 'book-ticket.html', 'my-bookings.html'];

                if (currentUser.role === 'USER') {
                    console.log('🔍 [AUTH DEBUG] User is PASSENGER, checking page access...');
                    // Redirect passengers away from admin pages
                    if (adminPages.includes(state.currentPage) || state.currentPage === '') {
                        console.log('⚠️ [AUTH DEBUG] Redirecting passenger from admin page to passenger-dashboard.html');
                        window.location.href = 'passenger-dashboard.html';
 return;
                    }
                } else if (currentUser.role === 'ADMIN') {
                    console.log('🔍 [AUTH DEBUG] User is ADMIN, checking page access...');
                    // Redirect admins away from passenger pages if they land there
                    if (passengerPages.includes(state.currentPage)) {
                        console.log('⚠️ [AUTH DEBUG] Redirecting admin from passenger page to index.html');
                        window.location.href = 'index.html';
                        return;
                    }
                }

                console.log('✅ [AUTH DEBUG] User has access to this page, initializing...');
                // Initialize Page Logic
                if (state.currentPage === 'index.html' || state.currentPage === '') {
                    initializeDashboard();
                } else if (state.currentPage === 'buses.html') {
                    initializeBusManagementPage();
                } else if (state.currentPage === 'routes.html') {
                    initializeRoutePlanningPage();
                } else if (state.currentPage === 'passengers.html') {
                    initializePassengerManagementPage();
                } else if (state.currentPage === 'passenger-dashboard.html') {
                    initializePassengerDashboard();
                } else if (state.currentPage === 'book-ticket.html') {
                    initializeBookTicketPage();
                } else if (state.currentPage === 'my-bookings.html') {
                    initializeMyBookingsPage();
                }
                console.log('✅ [AUTH DEBUG] Page initialized successfully');
            } else {
                console.error('❌ [AUTH DEBUG] Token marked as invalid by server');
                handleUnauthenticated();
            }
        } catch (e) {
            console.error('❌ [AUTH DEBUG] Auth check failed with error:', e);
            handleUnauthenticated();
        }
    } else {
        console.error('❌ [AUTH DEBUG] No token found in localStorage');
        handleUnauthenticated();
    }
}

function handleUnauthenticated() {
    console.log('🚫 [AUTH DEBUG] handleUnauthenticated called - clearing token and redirecting');
    console.log('🚫 [AUTH DEBUG] Current page:', state.currentPage);
    console.log('🚫 [AUTH DEBUG] Current path:', window.location.pathname);
    localStorage.removeItem('token');
    const path = window.location.pathname;
    const adminPages = ['index.html', 'buses.html', 'routes.html', 'passengers.html'];
    const passengerPages = ['passenger-dashboard.html', 'book-ticket.html', 'my-bookings.html'];
    
    if (adminPages.includes(state.currentPage) || passengerPages.includes(state.currentPage) || path.endsWith('/')) {
        console.log('🚫 [AUTH DEBUG] Redirecting to login.html');
        window.location.href = 'login.html';
    } else {
        console.log('🚫 [AUTH DEBUG] Not redirecting - page is:', state.currentPage);
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

// Initialize Passenger Management Page
async function initializePassengerManagementPage() {
    state.activeTab = 'passenger-management';
    
    // Load data
    try {
        const passengers = await apiFetch('/passengers');
        state.passengers = passengers;
        populatePassengers();
    } catch (e) {
        console.error('Failed to load passengers:', e);
        showToast('Error loading passenger data', 'error');
    }

    // Set up page specific listeners
    const addPassengerBtn = document.getElementById('addPassengerBtn');
    if (addPassengerBtn) addPassengerBtn.addEventListener('click', () => openModal('addPassengerModal'));

    const cancelPassengerModal = document.getElementById('cancelPassengerModal');
    if (cancelPassengerModal) cancelPassengerModal.addEventListener('click', () => {
        closeAllModals();
        document.getElementById('addPassengerForm').reset();
    });

    const savePassengerBtn = document.getElementById('savePassengerBtn');
    if (savePassengerBtn) savePassengerBtn.addEventListener('click', saveNewPassenger);

    const passengerSearchInput = document.getElementById('passengerSearchInput');
    if (passengerSearchInput) {
        passengerSearchInput.addEventListener('input', () => populatePassengers());
    }

    const passengerViewGridBtn = document.getElementById('passengerViewGridBtn');
    if (passengerViewGridBtn) {
        passengerViewGridBtn.addEventListener('click', () => switchPassengerView('grid'));
    }

    const passengerViewTableBtn = document.getElementById('passengerViewTableBtn');
    if (passengerViewTableBtn) {
        passengerViewTableBtn.addEventListener('click', () => switchPassengerView('table'));
    }
}

// Passenger Specific Initializations
async function initializePassengerDashboard() {
    state.activeTab = 'passenger-home';
    document.getElementById('welcomeName').textContent = currentUser.fullName.split(' ')[0];
    
    try {
        const bookings = await apiFetch(`/bookings/passenger/${currentUser.id}`);
        state.myBookings = bookings;
        
        // Update Stats
        document.getElementById('statTotalTrips').textContent = bookings.length;
        const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        document.getElementById('statSpent').textContent = `NPR ${totalSpent.toLocaleString()}`;
        
        // Populate Upcoming Trip
        const upcoming = bookings.filter(b => b.bookingStatus === 'CONFIRMED').sort((a,b) => new Date(a.bookingDate) - new Date(b.bookingDate))[0];
        if (upcoming) {
            const container = document.getElementById('upcomingBookings');
            container.innerHTML = `
                <div class="booking-card fade-in">
                    <div class="trip-info">
                        <h4>${upcoming.schedule.route.source} to ${upcoming.schedule.route.destination}</h4>
                        <p><i class="far fa-calendar-alt"></i> ${new Date(upcoming.schedule.departureTime).toLocaleDateString()} | <i class="far fa-clock"></i> ${new Date(upcoming.schedule.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p><i class="fas fa-bus"></i> ${upcoming.schedule.bus.busNumber} (${upcoming.schedule.bus.busType})</p>
                    </div>
                    <div style="text-align: right;">
                        <span class="status-badge status-confirmed">Confirmed</span>
                        <div style="margin-top: 10px; font-weight: 700; color: var(--primary);">Seat ${upcoming.seatNumber}</div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error('Failed to load passenger data:', e);
    }
}

async function initializeBookTicketPage() {
    state.activeTab = 'book-ticket';
    
    try {
        const routes = await apiFetch('/routes');
        const sourceSelect = document.getElementById('searchSource');
        const destSelect = document.getElementById('searchDestination');
        
        const sources = [...new Set(routes.map(r => r.source))].sort();
        const destinations = [...new Set(routes.map(r => r.destination))].sort();
        
        sources.forEach(s => sourceSelect.add(new Option(s, s)));
        destinations.forEach(d => destSelect.add(new Option(d, d)));
        
        document.getElementById('findBusesBtn').addEventListener('click', searchSchedules);
    } catch (e) {
        showToast('Error loading search data', 'error');
    }
}

async function initializeMyBookingsPage() {
    state.activeTab = 'my-bookings';
    
    try {
        const bookings = await apiFetch(`/bookings/passenger/${currentUser.id}`);
        const tableBody = document.getElementById('myBookingsTableBody');
        const emptyMsg = document.getElementById('noBookingsMessage');
        
        if (bookings.length === 0) {
            emptyMsg.style.display = 'block';
            return;
        }
        
        tableBody.innerHTML = '';
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.className = 'fade-in';
            tr.innerHTML = `
                <td style="font-weight: 600;">#BKG-${b.id}</td>
                <td>
                    <div style="font-weight: 600;">${b.schedule.route.source} → ${b.schedule.route.destination}</div>
                    <div style="font-size: 12px; color: #666;">${b.schedule.bus.busNumber}</div>
                </td>
                <td>${new Date(b.schedule.departureTime).toLocaleDateString()}</td>
                <td>${b.seatNumber}</td>
                <td style="font-weight: 600;">NPR ${b.totalAmount}</td>
                <td><span class="status-badge status-${b.bookingStatus.toLowerCase()}">${b.bookingStatus}</span></td>
                <td>
                    ${b.bookingStatus === 'CONFIRMED' ? `<button class="btn-cancel" onclick="cancelMyBooking(${b.id})">Cancel</button>` : '-'}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (e) {
        showToast('Error loading booking history', 'error');
    }
}

async function searchSchedules() {
    const source = document.getElementById('searchSource').value;
    const dest = document.getElementById('searchDestination').value;
    
    if (!source || !dest) {
        showToast('Please select source and destination', 'warning');
        return;
    }
    
    try {
        const schedules = await apiFetch('/schedules');
        const filtered = schedules.filter(s => s.route.source === source && s.route.destination === dest);
        
        const container = document.getElementById('searchResults');
        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 50px; color: #666;">No buses found for this route. Try another one!</div>`;
            return;
        }
        
        container.innerHTML = '';
        filtered.forEach(s => {
            const card = document.createElement('div');
            card.className = 'schedule-card fade-in';
            card.innerHTML = `
                <div class="trip-point">
                    <h3>${new Date(s.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
                    <p>${s.route.source}</p>
                </div>
                <div class="trip-duration">
                    <span>${s.route.estimatedTravelTime} mins</span>
                    <div class="trip-line"></div>
                    <span class="seats-info">${s.bus.totalSeats} seats available</span>
                </div>
                <div class="trip-point">
                    <h3>${new Date(new Date(s.departureTime).getTime() + s.route.estimatedTravelTime*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</h3>
                    <p>${s.route.destination}</p>
                </div>
                <div class="trip-price">
                    <h2>NPR ${s.route.distance * s.bus.farePerKm}</h2>
                    <button class="btn btn-primary" onclick="bookNow(${s.id})">Book Now</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        showToast('Search failed', 'error');
    }
}

window.bookNow = async (scheduleId) => {
    // Basic auto-book for now
    if (confirm('Proceed with booking this seat?')) {
        try {
            const bookingData = {
                passenger: { id: currentUser.id },
                schedule: { id: scheduleId },
                bookingDate: new Date().toISOString(),
                seatNumber: 'A' + Math.floor(Math.random() * 40 + 1),
                totalAmount: 1000, // Should be calculated
                bookingStatus: 'CONFIRMED',
                paymentStatus: 'PAID'
            };
            
            await apiFetch('/bookings', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });
            
            showToast('Ticket booked successfully!', 'success');
            window.location.href = 'my-bookings.html';
        } catch (e) {
            showToast('Booking failed', 'error');
        }
    }
};

window.cancelMyBooking = async (id) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
        try {
            await apiFetch(`/bookings/${id}/cancel`, { method: 'POST' });
            showToast('Booking cancelled', 'success');
            initializeMyBookingsPage();
        } catch (e) {
            showToast('Cancellation failed', 'error');
        }
    }
}

// Initialize Route Planning Page
async function initializeRoutePlanningPage() {
    state.activeTab = 'route-planning';
    
    // Load data
    try {
        const routes = await apiFetch('/routes');
        state.routes = routes;
        populateRoutes();
    } catch (e) {
        console.error('Failed to load routes:', e);
        showToast('Error loading route data', 'error');
    }

    // Set up page specific listeners if any (mostly handled by global setup)
    const addRouteBtn = document.getElementById('addRouteBtn');
    if (addRouteBtn) addRouteBtn.addEventListener('click', () => openModal('addRouteModal'));

    const cancelRouteModal = document.getElementById('cancelRouteModal');
    if (cancelRouteModal) cancelRouteModal.addEventListener('click', () => {
        closeAllModals();
        document.getElementById('addRouteForm').reset();
    });

    const saveRouteBtn = document.getElementById('saveRouteBtn');
    if (saveRouteBtn) saveRouteBtn.addEventListener('click', saveNewRoute);

    const routeSearchInput = document.getElementById('routeSearchInput');
    if (routeSearchInput) {
        routeSearchInput.addEventListener('input', () => populateRoutes());
    }

    const routeViewGridBtn = document.getElementById('routeViewGridBtn');
    if (routeViewGridBtn) {
        routeViewGridBtn.addEventListener('click', () => switchRouteView('grid'));
    }

    const routeViewTableBtn = document.getElementById('routeViewTableBtn');
    if (routeViewTableBtn) {
        routeViewTableBtn.addEventListener('click', () => switchRouteView('table'));
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

function switchRouteView(viewType) {
    const gridContainer = document.getElementById('routeGridContainer');
    const tableContainer = document.getElementById('routeTableContainer');
    const gridBtn = document.getElementById('routeViewGridBtn');
    const tableBtn = document.getElementById('routeViewTableBtn');

    if (viewType === 'grid') {
        gridContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
        gridBtn.classList.add('btn-primary');
        gridBtn.classList.remove('btn-outline');
        tableBtn.classList.add('btn-outline');
        tableBtn.classList.remove('btn-primary');
    } else {
        gridContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        gridBtn.classList.add('btn-outline');
        gridBtn.classList.remove('btn-primary');
        tableBtn.classList.add('btn-primary');
        tableBtn.classList.remove('btn-outline');
    }
}

function populateRoutes() {
    const gridContainer = document.getElementById('routeGridContainer');
    const tableBody = document.getElementById('routeTableBody');
    if (!gridContainer || !tableBody) return;

    const searchTerm = document.getElementById('routeSearchInput')?.value.toLowerCase() || '';

    const filteredRoutes = state.routes.filter(route => {
        return route.source.toLowerCase().includes(searchTerm) || 
               route.destination.toLowerCase().includes(searchTerm);
    });

    // Update stats
    document.getElementById('mgmtTotalRoutes').textContent = state.routes.length;

    // Render Grid
    gridContainer.innerHTML = '';
    filteredRoutes.forEach(route => {
        gridContainer.appendChild(renderRouteCard(route));
    });

    // Render Table
    tableBody.innerHTML = '';
    filteredRoutes.forEach(route => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; padding: 15px;">${route.source}</td>
            <td>${route.destination}</td>
            <td>${route.distance} km</td>
            <td>${route.estimatedTravelTime} mins</td>
            <td>
                <div class="d-flex gap-10">
                    <button class="btn btn-sm btn-icon btn-outline" onclick="editRoute('${route.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-icon btn-outline" onclick="deleteRoute('${route.id}')" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderRouteCard(route) {
    const card = document.createElement('div');
    card.className = 'route-card fade-in';
    card.innerHTML = `
        <div class="d-flex justify-between align-start">
            <span class="badge" style="background: var(--primary-light); color: var(--primary);">RT-${route.id || 'N/A'}</span>
            <div class="d-flex gap-5">
                <button class="btn btn-sm btn-icon btn-outline" style="padding: 4px; min-width: 30px;" onclick="editRoute('${route.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-icon btn-outline" style="padding: 4px; min-width: 30px; color: var(--danger);" onclick="deleteRoute('${route.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        
        <div class="route-path">
            <div class="route-point">
                <span class="point-label">Source</span>
                <span class="point-name">${route.source.split(' ')[0]}</span>
            </div>
            <div class="path-arrow">
                <div class="path-line"></div>
            </div>
            <div class="route-point" style="text-align: right;">
                <span class="point-label">Destination</span>
                <span class="point-name">${route.destination.split(' ')[0]}</span>
            </div>
        </div>

        <div style="font-size: 13px; font-weight: 600; margin-top: 5px; color: var(--gray-dark);">${route.source} → ${route.destination}</div>

        <div class="route-details">
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-road"></i></div>
                <div class="detail-text">
                    <span class="detail-value">${route.distance} km</span>
                    <span class="detail-label">Distance</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-icon"><i class="fas fa-clock"></i></div>
                <div class="detail-text">
                    <span class="detail-value">${route.estimatedTravelTime}m</span>
                    <span class="detail-label">Est. Time</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

async function saveNewRoute() {
    const form = document.getElementById('addRouteForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const routeData = {
        source: document.getElementById('routeSource').value,
        destination: document.getElementById('routeDestination').value,
        distance: parseFloat(document.getElementById('routeDistance').value),
        estimatedTravelTime: parseInt(document.getElementById('routeTime').value),
        description: document.getElementById('routeDescription').value
    };
    
    try {
        await apiFetch('/routes', {
            method: 'POST',
            body: JSON.stringify(routeData)
        });
        
        showToast('New route designed and saved!', 'success');
        closeAllModals();
        form.reset();
        
        // Refresh routes
        const routes = await apiFetch('/routes');
        state.routes = routes;
        populateRoutes();
        
    } catch (e) {
        console.error('Save failed:', e);
        showToast('Error saving route', 'error');
    }
}

// Placeholder for edit/delete
window.editRoute = (id) => showToast('Edit functionality coming soon', 'info');
window.deleteRoute = async (id) => {
    if (confirm('Are you sure you want to delete this route?')) {
        try {
            await apiFetch(`/routes/${id}`, { method: 'DELETE' });
            showToast('Route deleted successfully', 'success');
            const routes = await apiFetch('/routes');
            state.routes = routes;
            populateRoutes();
        } catch (e) {
            showToast('Error deleting route', 'error');
        }
    }
};

function switchPassengerView(viewType) {
    const gridContainer = document.getElementById('passengerGridContainer');
    const tableContainer = document.getElementById('passengerTableContainer');
    const gridBtn = document.getElementById('passengerViewGridBtn');
    const tableBtn = document.getElementById('passengerViewTableBtn');

    if (viewType === 'grid') {
        gridContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
        gridBtn.classList.add('btn-primary');
        gridBtn.classList.remove('btn-outline');
        tableBtn.classList.add('btn-outline');
        tableBtn.classList.remove('btn-primary');
    } else {
        gridContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        gridBtn.classList.add('btn-outline');
        gridBtn.classList.remove('btn-primary');
        tableBtn.classList.add('btn-primary');
        tableBtn.classList.remove('btn-outline');
    }
}

function populatePassengers() {
    const gridContainer = document.getElementById('passengerGridContainer');
    const tableBody = document.getElementById('passengerTableBody');
    if (!gridContainer || !tableBody) return;

    const searchTerm = document.getElementById('passengerSearchInput')?.value.toLowerCase() || '';

    const filteredPassengers = state.passengers.filter(p => {
        return p.firstName.toLowerCase().includes(searchTerm) || 
               p.lastName.toLowerCase().includes(searchTerm) ||
               p.email.toLowerCase().includes(searchTerm) ||
               p.phoneNumber.includes(searchTerm);
    });

    // Update stats
    document.getElementById('mgmtTotalPassengers').textContent = state.passengers.length;

    // Render Grid
    gridContainer.innerHTML = '';
    filteredPassengers.forEach(p => {
        gridContainer.appendChild(renderPassengerCard(p));
    });

    // Render Table
    tableBody.innerHTML = '';
    filteredPassengers.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; padding: 15px;">${p.firstName} ${p.lastName}</td>
            <td>${p.email}</td>
            <td>${p.phoneNumber}</td>
            <td>${new Date(p.registrationDate).toLocaleDateString()}</td>
            <td>
                <div class="d-flex gap-10">
                    <button class="btn btn-sm btn-icon btn-outline" onclick="editPassenger('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-icon btn-outline" onclick="deletePassenger('${p.id}')" style="color: var(--danger);"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderPassengerCard(p) {
    const card = document.createElement('div');
    card.className = 'passenger-card fade-in';
    const initals = (p.firstName[0] + p.lastName[0]).toUpperCase();
    card.innerHTML = `
        <div class="passenger-header">
            <div class="passenger-avatar">${initals}</div>
            <div class="d-flex gap-5">
                <button class="btn btn-sm btn-icon btn-outline" style="padding: 4px; min-width: 30px;" onclick="editPassenger('${p.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-icon btn-outline" style="padding: 4px; min-width: 30px; color: var(--danger);" onclick="deletePassenger('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        
        <div class="passenger-info-text">
            <h3>${p.firstName} ${p.lastName}</h3>
            <p>Passenger ID: #PASS-${p.id}</p>
        </div>

        <div class="contact-details">
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span>${p.email}</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span>${p.phoneNumber}</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${p.address || 'No address provided'}</span>
            </div>
        </div>

        <div class="registration-date">
            <i class="fas fa-calendar-alt"></i>
            Registered on ${new Date(p.registrationDate).toLocaleDateString()}
        </div>
    `;
    return card;
}

async function saveNewPassenger() {
    const form = document.getElementById('addPassengerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const passengerData = {
        firstName: document.getElementById('passFirstName').value,
        lastName: document.getElementById('passLastName').value,
        email: document.getElementById('passEmail').value,
        phoneNumber: document.getElementById('passPhone').value,
        address: document.getElementById('passAddress').value
    };
    
    try {
        await apiFetch('/passengers', {
            method: 'POST',
            body: JSON.stringify(passengerData)
        });
        
        showToast('Passenger profile created successfully!', 'success');
        closeAllModals();
        form.reset();
        
        // Refresh passengers
        const passengers = await apiFetch('/passengers');
        state.passengers = passengers;
        populatePassengers();
        
    } catch (e) {
        console.error('Save failed:', e);
        showToast('Error registering passenger', 'error');
    }
}

// Placeholder for edit/delete
window.editPassenger = (id) => showToast('Edit functionality coming soon', 'info');
window.deletePassenger = async (id) => {
    if (confirm('Are you sure you want to delete this passenger profile?')) {
        try {
            await apiFetch(`/passengers/${id}`, { method: 'DELETE' });
            showToast('Passenger deleted successfully', 'success');
            const passengers = await apiFetch('/passengers');
            state.passengers = passengers;
            populatePassengers();
        } catch (e) {
            showToast('Error deleting passenger', 'error');
        }
    }
};

// Start the app
// TEMPORARY: Commented out to debug redirect issue
// document.addEventListener('DOMContentLoaded', initApp);

// Manual init function for testing
window.manualInit = function() {
    console.log('🔧 Manual init called');
    initApp();
};

console.log('✅ [APP.JS] Reached end of file - DOMContentLoaded listener NOT attached');
console.log('✅ [APP.JS] Call window.manualInit() to manually start auth');
