let adminMap;

window.onload = async function () {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const username = user.user_metadata?.username || 'ecoadmin';
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

    const totalWaste = allLogs.reduce((sum, entry) => sum + entry.weight, 0);
    document.getElementById('admin-total-waste').textContent = totalWaste.toFixed(2) + ' kg';
    document.getElementById('admin-total-disposals').textContent = allLogs.length;

    const uniqueUsers = [...new Set(allLogs.map(e => e.user_id))].length;
    document.getElementById('admin-total-users').textContent = uniqueUsers + ' users';

    if (allLogs.length > 0) {
        const placeName = await reverseGeocode(allLogs[0].latitude, allLogs[0].longitude);
        document.getElementById('admin-top-location').textContent = '📍 ' + placeName;
    }

    updateWasteRanking(allLogs);
    updateAdminMap(allLogs);
    updateRecentEntries(allLogs);
}

function updateWasteRanking(allLogs) {
    const allCategories = ['Plastic', 'E-Waste', 'Organic', 'Metal', 'Paper', 'Glass'];
    const categoryTotals = {};
    allCategories.forEach(cat => categoryTotals[cat] = 0);
    allLogs.forEach(entry => {
        if (categoryTotals[entry.category] !== undefined) {
            categoryTotals[entry.category] += entry.weight;
        }
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const colors = {
        'Plastic': '#3498db',
        'E-Waste': '#e67e22',
        'Organic': '#27ae60',
        'Metal': '#95a5a6',
        'Paper': '#f39c12',
        'Glass': '#9b59b6'
    };

    const list = document.getElementById('waste-ranking-list');
    list.innerHTML = `
        <div class="entry-header">
            <span>Rank</span>
            <span>Category</span>
            <span>Total Weight</span>
        </div>
    ` + sorted.map(([category, total], index) => `
        <div class="entry-card" style="grid-template-columns: 0.5fr 2fr 1fr; border-left: 4px solid ${colors[category]}">
            <span class="entry-category">#${index + 1}</span>
            <span class="entry-category">${category}</span>
            <span class="entry-date">${total.toFixed(2)} kg</span>
        </div>
    `).join('');
}

function updateAdminMap(allLogs) {
    allLogs.forEach(entry => {
        if (entry.latitude && entry.longitude) {
            const displayName = entry.username || 'Unknown User';
            L.marker([entry.latitude, entry.longitude])
                .addTo(adminMap)
                .bindTooltip(`👤 ${displayName}`, { permanent: false, direction: 'top' })
                .bindPopup(`<b>👤 ${displayName}</b><br>${entry.category} — ${entry.weight} kg<br>${new Date(entry.created_at).toLocaleDateString()}`);
        }
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

    window.adminNoticesData = notices;

    list.innerHTML = notices.map((notice, index) => `
        <div class="notice-card" onclick="openNoticeModal(${index})">
            <span class="notice-title">📢 ${notice.title}</span>
            <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function openNoticeModal(index) {
    const notice = window.adminNoticesData[index];
    document.getElementById('notice-modal-title').textContent = notice.title;
    document.getElementById('notice-modal-message').textContent = notice.message;
    document.getElementById('notice-modal-date').textContent = '📅 ' + new Date(notice.created_at).toLocaleDateString();
    document.getElementById('notice-modal').style.display = 'flex';
}

function closeNoticeModal() {
    document.getElementById('notice-modal').style.display = 'none';
}

function toggleNoticeForm() {
    const form = document.getElementById('notice-form');
    const btn = document.getElementById('post-notice-btn');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        btn.textContent = '✕ Cancel';
    } else {
        form.style.display = 'none';
        btn.textContent = '+ Post Notice';
    }
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
        toggleNoticeForm();
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

    window.suggestionsData = suggestions;

    list.innerHTML = suggestions.map((s, index) => `
        <div class="notice-card" onclick="openSuggestionModal(${index})">
            <span class="notice-title">💬 ${s.username}</span>
            <span class="notice-date">${new Date(s.created_at).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function openSuggestionModal(index) {
    const s = window.suggestionsData[index];
    document.getElementById('suggestion-modal-username').textContent = '👤 ' + s.username;
    document.getElementById('suggestion-modal-message').textContent = s.message;
    document.getElementById('suggestion-modal-date').textContent = '📅 ' + new Date(s.created_at).toLocaleDateString();
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
