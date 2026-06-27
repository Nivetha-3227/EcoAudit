let map;
let currentLocationMarker;
let currentUser;
window.onload = async function () {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const username = user.user_metadata.username;
    document.getElementById('nav-username').textContent = '👤 ' + username;

    initMap();
    loadDashboard(user.id);
    loadNotices();
};

function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const blinkIcon = L.divIcon({
                className: 'blink-marker',
                html: '<div class="blink-dot"></div>',
                iconSize: [20, 20]
            });

            currentLocationMarker = L.marker([lat, lng], { icon: blinkIcon })
                .addTo(map)
                .bindPopup('📍 You are here')
                .openPopup();

            map.setView([lat, lng], 13);
        });
    }
}

async function loadDashboard(userId) {
    const { data: entries, error } = await db
        .from('waste_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error fetching entries:', error.message);
        return;
    }

    updateStats(entries);
    updateTopWaste(entries);
    updateMap(entries);
    updateEntriesList(entries);
}

async function updateStats(entries) {
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    document.getElementById('total-weight').textContent = totalWeight.toFixed(2) + ' kg';
    document.getElementById('total-count').textContent = entries.length;

    const categoryCounts = {};
    entries.forEach(entry => {
        categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });
    const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
        categoryCounts[a] > categoryCounts[b] ? a : b, '-');

    if (entries.length > 0) {
        const mostFrequentEntry = entries[0];
        const placeName = await reverseGeocode(mostFrequentEntry.latitude, mostFrequentEntry.longitude);
        document.getElementById('top-category').textContent = topCategory + ' | 📍 ' + placeName;
    } else {
        document.getElementById('top-category').textContent = topCategory;
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        return data.address.suburb || data.address.city || data.address.town || 'Unknown location';
    } catch (error) {
        return 'Unknown location';
    }
}

function updateMap(entries) {
    entries.forEach(entry => {
        L.marker([entry.latitude, entry.longitude])
            .addTo(map)
            .bindTooltip(
                `📍 ${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}`,
                { permanent: false, direction: 'top' }
            );
    });
}

function updateEntriesList(entries) {
    const list = document.getElementById('entries-list');
    const last5 = entries.slice(0, 5);

    if (last5.length === 0) {
        list.innerHTML = '<p class="no-entries">No entries yet. Start disposing!</p>';
        return;
    }

    list.innerHTML = `
        <div class="entry-header">
            <span>Category</span>
            <span>Weight</span>
            <span>Date</span>
            <span>Coordinates</span>
        </div>
    ` + last5.map(entry => `
        <div class="entry-card">
            <span class="entry-category">${entry.category}</span>
            <span class="entry-weight">${entry.weight} kg</span>
            <span class="entry-date">${new Date(entry.created_at).toLocaleDateString()}</span>
            <span class="entry-coords">📍 ${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}</span>
        </div>
    `).join('');
}

function updateTopWaste(entries) {
    const categoryTotals = {};
    entries.forEach(entry => {
        if (!categoryTotals[entry.category]) {
            categoryTotals[entry.category] = 0;
        }
        categoryTotals[entry.category] += entry.weight;
    });

    const top3 = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const container = document.getElementById('top-waste-list');

    if (top3.length === 0) {
        container.innerHTML = '<p class="no-entries">No data yet</p>';
        return;
    }

    const colors = {
        'Plastic': '#3498db',
        'E-Waste': '#e67e22',
        'Organic': '#27ae60',
        'Metal': '#95a5a6',
        'Paper': '#f39c12',
        'Glass': '#9b59b6'
    };

    container.innerHTML = top3.map(([category, total], index) => `
        <div class="top-waste-card" style="border-left: 4px solid ${colors[category] || '#2d6a2d'}">
            <span class="top-waste-rank">#${index + 1}</span>
            <span class="top-waste-category">${category}</span>
            <span class="top-waste-amount">${total.toFixed(2)} kg</span>
        </div>
    `).join('');
}

async function loadNotices() {
    const { data: notices, error } = await db
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error fetching notices:', error.message);
        return;
    }

    const list = document.getElementById('notice-list');

    if (notices.length === 0) {
        list.innerHTML = '<p class="no-entries">No notices yet.</p>';
        return;
    }

    list.innerHTML = notices.map(notice => `
        <div class="notice-card" onclick="openNoticeModal('${notice.title}', '${notice.message}', '${new Date(notice.created_at).toLocaleDateString()}')">
            <span class="notice-title">📢 ${notice.title}</span>
            <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function openNoticeModal(title, message, date) {
    document.getElementById('notice-modal-title').textContent = title;
    document.getElementById('notice-modal-message').textContent = message;
    document.getElementById('notice-modal-date').textContent = '📅 ' + date;
    document.getElementById('notice-modal').style.display = 'flex';
}

function closeNoticeModal() {
    document.getElementById('notice-modal').style.display = 'none';
}

function toggleEntries() {
    const list = document.getElementById('entries-list');
    const btn = document.querySelector('.dropdown-btn');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.textContent = 'Recent Entries ▲';
    } else {
        list.style.display = 'none';
        btn.textContent = 'Recent Entries ▼';
    }
}

function openModal() {
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-message').textContent = '';
    document.getElementById('waste-category').value = '';
    document.getElementById('waste-weight').value = '';
}

async function submitWaste() {
    const category = document.getElementById('waste-category').value;
    const weight = parseFloat(document.getElementById('waste-weight').value);

    if (!category || !weight || weight <= 0) {
        document.getElementById('modal-message').textContent = 'Please fill in all fields correctly.';
        return;
    }

    document.getElementById('location-status').textContent = '📍 Capturing your location...';

    const { data: { user } } = await db.auth.getUser();

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const { error } = await db.from('waste_logs').insert({
                user_id: user.id,
                username: username,
                category: category,
                weight: weight,
                latitude: lat,
                longitude: lng
            });

            if (error) {
                document.getElementById('modal-message').textContent = 'Error saving. Try again.';
            } else {
                closeModal();
                loadDashboard(user.id);
            }
        },
        function () {
            document.getElementById('location-status').textContent = '❌ Location access denied. Please allow location to submit.';
        }
    );
}

async function logout() {
    await db.auth.signOut();
    window.location.href = 'index.html';
}
