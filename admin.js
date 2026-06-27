let adminMap;

window.onload = async function () {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const username = user.user_metadata.username;
    if (username !== 'ecoadmin') {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('nav-username').textContent = '👤 ' + username;

    initAdminMap();
    loadAdminData();
    loadNotices();
    loadSuggestions();
};

function initAdminMap() {
    adminMap = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(adminMap);
}

async function loadAdminData() {
    const { data: allLogs, error } = await db
        .from('waste_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error fetching logs:', error.message);
        return;
    }

    // Global stats
    const totalWaste = allLogs.reduce((sum, entry) => sum + entry.weight, 0);
    document.getElementById('admin-total-waste').textContent = totalWaste.toFixed(2) + ' kg';
    document.getElementById('admin-total-disposals').textContent = allLogs.length;

    // Unique users
    const uniqueUsers = [...new Set(allLogs.map(e => e.user_id))].length;
    document.getElementById('admin-total-users').textContent = uniqueUsers + ' users';

    // Most active location
    if (allLogs.length > 0) {
        const placeName = await reverseGeocode(allLogs[0].latitude, allLogs[0].longitude);
        document.getElementById('admin-top-location').textContent = '📍 ' + placeName;
    }

    // User ranking
    const userStats = {};
    allLogs.forEach(entry => {
        if (!userStats[entry.username]) {
            userStats[entry.username] = { count: 0, totalWeight: 0 };
        }
        userStats[entry.username].count += 1;
        userStats[entry.username].totalWeight += entry.weight;
    });

    updateUserRanking(userStats);
    updateAdminMap(allLogs);
    updateRecentEntries(allLogs);
}

function updateUserRanking(userStats) {
    const list = document.getElementById('user-ranking-list');

    const sorted = Object.entries(userStats)
        .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

    if (sorted.length === 0) {
        list.innerHTML = '<p class="no-entries">No data yet.</p>';
        return;
    }

    list.innerHTML = `
        <div class="entry-header">
            <span>Rank</span>
            <span>Username</span>
            <span>Disposals</span>
            <span>Total Waste</span>
        </div>
    ` + sorted.map(([username, stats], index) => `
        <div class="entry-card" style="grid-template-columns: 0.5fr 2fr 1fr 1fr;">
            <span class="entry-category">#${index + 1}</span>
            <span class="entry-category">${username}</span>
            <span class="entry-weight">${stats.count}</span>
            <span class="entry-date">${stats.totalWeight.toFixed(2)} kg</span>
        </div>
    `).join('');
}

function updateAdminMap(allLogs) {
    allLogs.forEach(entry => {
        L.marker([entry.latitude, entry.longitude])
            .addTo(adminMap)
            .bindTooltip(
                `👤 ${entry.username || 'Unknown'}`,
                { permanent: false, direction: 'top' }
            );
    });
}

function updateRecentEntries(allLogs) {
    const list = document.getElementById('entries-list');
    const last5 = allLogs.slice(0, 5);

    if (last5.length === 0) {
        list.innerHTML = '<p class="no-entries">No entries yet.</p>';
        return;
    }

    list.innerHTML = `
        <div class="entry-header">
            <span>Username</span>
            <span>Category</span>
            <span>Weight</span>
            <span>Date</span>
        </div>
    ` + last5.map(entry => `
        <div class="entry-card">
            <span class="entry-category">${entry.username || 'Unknown'}</span>
            <span class="entry-weight">${entry.category}</span>
            <span class="entry-date">${entry.weight} kg</span>
            <span class="entry-coords">${new Date(entry.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

async function loadNotices() {
    const { data: notices, error } = await db
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    const list = document.getElementById('notice-list');

    if (notices.length === 0) {
        list.innerHTML = '<p class="no-entries">No notices posted yet.</p>';
        return;
    }

    list.innerHTML = notices.map(notice => `
        <div class="notice-card">
            <span class="notice-title">📢 ${notice.title}</span>
            <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

async function postNotice() {
    const title = document.getElementById('notice-title').value;
    const message = document.getElementById('notice-message').value;

    if (!title || !message) {
        document.getElementById('notice-status').textContent = 'Please fill in both fields.';
        return;
    }

    const { error } = await db.from('notices').insert({ title, message });

    if (error) {
        document.getElementById('notice-status').textContent = 'Error posting notice.';
    } else {
        document.getElementById('notice-status').textContent = '✅ Notice posted!';
        document.getElementById('notice-title').value = '';
        document.getElementById('notice-message').value = '';
        loadNotices();
    }
}

async function loadSuggestions() {
    const { data: suggestions, error } = await db
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    const list = document.getElementById('suggestions-list');

    if (suggestions.length === 0) {
        list.innerHTML = '<p class="no-entries">No suggestions yet.</p>';
        return;
    }

    list.innerHTML = suggestions.map(s => `
        <div class="notice-card" onclick="openSuggestionModal('${s.username}', \`${s.message}\`, '${new Date(s.created_at).toLocaleDateString()}')">
            <span class="notice-title">💬 ${s.username}</span>
            <span class="notice-date">${new Date(s.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function openSuggestionModal(username, message, date) {
    document.getElementById('suggestion-modal-username').textContent = '👤 ' + username;
    document.getElementById('suggestion-modal-message').textContent = message;
    document.getElementById('suggestion-modal-date').textContent = '📅 ' + date;
    document.getElementById('suggestion-modal').style.display = 'flex';
}

function closeSuggestionModal() {
    document.getElementById('suggestion-modal').style.display = 'none';
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

async function logout() {
    await db.auth.signOut();
    window.location.href = 'index.html';
}
