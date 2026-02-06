const API_BASE = '/api';
let currentUser = null;
let currentToken = localStorage.getItem('token');

// Auth State Management
async function initApp() {
    if (currentToken) {
        try {
            const response = await fetch(`${API_BASE}/auth/validate`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            const data = await response.json();
            if (data.valid) {
                currentUser = data.admin;
                if (document.getElementById('dashboard-page')) {
                    showDashboard();
                }
            } else {
                handleUnauthenticated();
            }
        } catch (e) {
            handleUnauthenticated();
        }
    } else {
        handleUnauthenticated();
    }
}

function handleUnauthenticated() {
    localStorage.removeItem('token');
    if (document.getElementById('dashboard-page')) {
        window.location.href = 'login.html';
    }
}

function showDashboard() {
    const dashboard = document.getElementById('dashboard-page');
    if (dashboard) {
        dashboard.style.display = 'grid';
        document.getElementById('user-name').textContent = currentUser.fullName;
        document.getElementById('user-initial').textContent = currentUser.fullName.charAt(0).toUpperCase();
        loadView('dashboard');
    }
}

// Auth logic moved to separate HTML files (login.html, register.html)

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        loadView(link.dataset.view);
    });
});

async function loadView(view) {
    const content = document.getElementById('view-content');
    const title = document.getElementById('view-title');
    const addBtn = document.getElementById('add-entity-btn');
    
    currentView = view;
    addBtn.style.display = view === 'dashboard' ? 'none' : 'flex';

    switch(view) {
        case 'dashboard':
            title.textContent = 'Dashboard Overview';
            content.innerHTML = `
                <div class="card-grid">
                    <div class="stat-card">
                        <h3>Total Buses</h3>
                        <p id="stat-buses" style="font-size: 2rem; font-weight: 700; color: var(--primary); margin-top: 1rem;">...</p>
                    </div>
                    <div class="stat-card">
                        <h3>Total Routes</h3>
                        <p id="stat-routes" style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-top: 1rem;">...</p>
                    </div>
                    <div class="stat-card">
                        <h3>Today's Bookings</h3>
                        <p id="stat-bookings" style="font-size: 2rem; font-weight: 700; color: var(--success); margin-top: 1rem;">...</p>
                    </div>
                </div>
            `;
            loadStats();
            break;
        case 'buses':
            title.textContent = 'Manage Buses';
            content.innerHTML = '<div class="stat-card"><p>Loading buses...</p></div>';
            loadBuses();
            break;
        case 'routes':
            title.textContent = 'Manage Routes';
            content.innerHTML = '<div class="stat-card"><p>Loading routes...</p></div>';
            loadRoutes();
            break;
        case 'schedules':
            title.textContent = 'Manage Schedules';
            content.innerHTML = '<div class="stat-card"><p>Loading schedules...</p></div>';
            loadSchedules();
            break;
        case 'drivers':
            title.textContent = 'Manage Drivers';
            content.innerHTML = '<div class="stat-card"><p>Loading drivers...</p></div>';
            loadDrivers();
            break;
        case 'bookings':
            title.textContent = 'Manage Bookings';
            content.innerHTML = '<div class="stat-card"><p>Loading bookings...</p></div>';
            loadBookings();
            break;
        case 'passengers':
            title.textContent = 'Manage Passengers';
            content.innerHTML = '<div class="stat-card"><p>Loading passengers...</p></div>';
            loadPassengers();
            break;
        default:
            content.innerHTML = `<div class="stat-card"><h3>${view.toUpperCase()}</h3><p>Coming soon...</p></div>`;
    }
}

async function loadStats() {
    try {
        const [buses, routes, bookings] = await Promise.all([
            apiFetch('/buses'),
            apiFetch('/routes'),
            apiFetch('/bookings')
        ]);
        document.getElementById('stat-buses').textContent = buses.length;
        document.getElementById('stat-routes').textContent = routes.length;
        document.getElementById('stat-bookings').textContent = bookings.length;
    } catch (e) {
        console.error('Failed to load stats', e);
    }
}

async function loadBuses() {
    try {
        const buses = await apiFetch('/buses');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Number</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Fare/KM</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        buses.forEach(bus => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${bus.busNumber}</td>
                    <td>${bus.busType}</td>
                    <td>${bus.totalSeats}</td>
                    <td>$${bus.farePerKm}</td>
                    <td>
                        <span class="badge ${bus.isAvailable ? 'badge-success' : 'badge-danger'}">
                            ${bus.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                    </td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="editBus(${bus.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn" style="padding: 0.5rem; color: var(--error);" onclick="deleteBus(${bus.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = buses.length ? html : '<div class="stat-card"><p>No buses found.</p></div>';
    } catch (e) {
        alert('Failed to load buses');
    }
}

async function loadRoutes() {
    try {
        const routes = await apiFetch('/routes');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Destination</th>
                        <th>Distance (KM)</th>
                        <th>Est. Time</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        routes.forEach(route => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${route.source}</td>
                    <td>${route.destination}</td>
                    <td>${route.distance}</td>
                    <td>${route.estimatedTravelTime} mins</td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="editRoute(${route.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn" style="padding: 0.5rem; color: var(--error);" onclick="deleteRoute(${route.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = routes.length ? html : '<div class="stat-card"><p>No routes found.</p></div>';
    } catch (e) {
        alert('Failed to load routes');
    }
}

async function loadSchedules() {
    try {
        const schedules = await apiFetch('/schedules');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Bus</th>
                        <th>Route</th>
                        <th>Departure</th>
                        <th>Arrival</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        schedules.forEach(s => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${s.bus.busNumber}</td>
                    <td>${s.route.source} → ${s.route.destination}</td>
                    <td>${new Date(s.departureTime).toLocaleString()}</td>
                    <td>${new Date(s.arrivalTime).toLocaleString()}</td>
                    <td>$${s.price}</td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="editSchedule(${s.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn" style="padding: 0.5rem; color: var(--error);" onclick="deleteSchedule(${s.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = schedules.length ? html : '<div class="stat-card"><p>No schedules found.</p></div>';
    } catch (e) {
        alert('Failed to load schedules');
    }
}

async function loadDrivers() {
    try {
        const drivers = await apiFetch('/drivers');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>License</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        drivers.forEach(d => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${d.fullName}</td>
                    <td>${d.licenseNumber}</td>
                    <td>${d.phoneNumber}</td>
                    <td>
                        <span class="badge ${d.isAvailable ? 'badge-success' : 'badge-warning'}">
                            ${d.isAvailable ? 'Active' : 'On Leave'}
                        </span>
                    </td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="editDriver(${d.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn" style="padding: 0.5rem; color: var(--error);" onclick="deleteDriver(${d.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = drivers.length ? html : '<div class="stat-card"><p>No drivers found.</p></div>';
    } catch (e) {
        alert('Failed to load drivers');
    }
}

// Modal Logic
function openModal(title, fieldsHtml, onSave) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-fields').innerHTML = fieldsHtml;
    document.getElementById('modal-overlay').style.display = 'flex';
    
    document.getElementById('modal-form').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

// Add Entity Logic
document.getElementById('add-entity-btn').addEventListener('click', () => {
    switch(currentView) {
        case 'buses':
            showAddBusModal();
            break;
        case 'routes':
            showAddRouteModal();
            break;
        case 'schedules':
            showAddScheduleModal();
            break;
        case 'drivers':
            showAddDriverModal();
            break;
    }
});

async function showAddScheduleModal() {
    const [buses, routes, drivers] = await Promise.all([
        apiFetch('/buses'),
        apiFetch('/routes'),
        apiFetch('/drivers')
    ]);
    
    const fields = `
        <div class="input-group">
            <label>Bus</label>
            <select name="bus_id" class="input-group input" style="width: 100%; padding: 0.75rem;">
                ${buses.map(b => `<option value="${b.id}">${b.busNumber} (${b.busType})</option>`).join('')}
            </select>
        </div>
        <div class="input-group">
            <label>Route</label>
            <select name="route_id" class="input-group input" style="width: 100%; padding: 0.75rem;">
                ${routes.map(r => `<option value="${r.id}">${r.source} to ${r.destination}</option>`).join('')}
            </select>
        </div>
        <div class="input-group">
            <label>Driver</label>
            <select name="driver_id" class="input-group input" style="width: 100%; padding: 0.75rem;">
                ${drivers.map(d => `<option value="${d.id}">${d.fullName}</option>`).join('')}
            </select>
        </div>
        <div class="input-group">
            <label>Departure Time</label>
            <input type="datetime-local" name="departureTime" required>
        </div>
        <div class="input-group">
            <label>Arrival Time</label>
            <input type="datetime-local" name="arrivalTime" required>
        </div>
    `;
    
    openModal('Add New Schedule', fields, async (data) => {
        const body = {
            bus: { id: data.bus_id },
            route: { id: data.route_id },
            driver: { id: data.driver_id },
            departureTime: data.departureTime,
            arrivalTime: data.arrivalTime
        };
        try {
            await apiFetch('/schedules', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            closeModal();
            loadSchedules();
        } catch (e) {
            alert('Error adding schedule');
        }
    });
}

function showAddDriverModal() {
    const fields = `
        <div class="input-group">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="Driver Name">
        </div>
        <div class="input-group">
            <label>License Number</label>
            <input type="text" name="licenseNumber" required placeholder="LIC-9988">
        </div>
        <div class="input-group">
            <label>Contact Number</label>
            <input type="text" name="contactNumber" required placeholder="9876543210">
        </div>
        <div class="input-group">
            <label>Email</label>
            <input type="email" name="email" required placeholder="driver@buswise.com">
        </div>
        <div class="input-group">
            <label>Date of Birth</label>
            <input type="date" name="dateOfBirth" required>
        </div>
    `;
    openModal('Add New Driver', fields, async (data) => {
        try {
            await apiFetch('/drivers', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            loadDrivers();
        } catch (e) {
            alert('Error adding driver');
        }
    });
}

async function loadBookings() {
    try {
        const bookings = await apiFetch('/bookings');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Booking #</th>
                        <th>Passenger</th>
                        <th>Bus</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        bookings.forEach(b => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${b.bookingNumber}</td>
                    <td>${b.passenger.fullName}</td>
                    <td>${b.schedule.bus.busNumber}</td>
                    <td>
                        <span class="badge ${b.bookingStatus === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}">
                            ${b.bookingStatus}
                        </span>
                    </td>
                    <td>$${b.totalAmount}</td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="viewBooking(${b.id})"><i class="fas fa-eye"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = bookings.length ? html : '<div class="stat-card"><p>No bookings found.</p></div>';
    } catch (e) {
        alert('Failed to load bookings');
    }
}

async function loadPassengers() {
    try {
        const passengers = await apiFetch('/passengers');
        const content = document.getElementById('view-content');
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        passengers.forEach(p => {
            html += `
                <tr>
                    <td style="font-weight: 600;">${p.fullName}</td>
                    <td>${p.email}</td>
                    <td>${p.phoneNumber}</td>
                    <td>
                        <button class="btn" style="padding: 0.5rem; color: var(--primary);" onclick="editPassenger(${p.id})"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        content.innerHTML = passengers.length ? html : '<div class="stat-card"><p>No passengers found.</p></div>';
    } catch (e) {
        alert('Failed to load passengers');
    }
}

// Global functions for inline HTML calls
window.editBus = (id) => alert('Edit bus ' + id);
window.deleteBus = async (id) => {
    if (confirm('Delete this bus?')) {
        await apiFetch(`/buses/${id}`, { method: 'DELETE' });
        loadBuses();
    }
};
window.editRoute = (id) => alert('Edit route ' + id);
window.deleteRoute = async (id) => {
    if (confirm('Delete this route?')) {
        await apiFetch(`/routes/${id}`, { method: 'DELETE' });
        loadRoutes();
    }
};
window.closeModal = closeModal;
window.viewBooking = (id) => alert('Viewing booking ' + id);
window.editPassenger = (id) => alert('Edit passenger ' + id);
window.editDriver = (id) => alert('Edit driver ' + id);
window.deleteDriver = async (id) => {
    if (confirm('Delete this driver?')) {
        await apiFetch(`/drivers/${id}`, { method: 'DELETE' });
        loadDrivers();
    }
};
window.editSchedule = (id) => alert('Edit schedule ' + id);
window.deleteSchedule = async (id) => {
    if (confirm('Delete this schedule?')) {
        await apiFetch(`/schedules/${id}`, { method: 'DELETE' });
        loadSchedules();
    }
};

async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (!response.ok) {
            if (response.status === 403) {
                localStorage.removeItem('token');
                window.location.reload();
            }
            const errorData = await response.json();
            const errorMsg = errorData.message || errorData.error || 'API request failed';
            throw new Error(errorMsg);
        }
        return response.json();
    } catch (e) {
        console.error(e);
        throw e;
    }
}

initApp();
