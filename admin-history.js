let allEntries = [];

window.onload = async function () {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    if (user.email !== 'ecoadmin@ecoaudit.com') {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('nav-username').textContent = '👤 ecoadmin';

    const { data: entries, error } = await db
        .from('waste_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    allEntries = entries;

    const usernames = [...new Set(entries.map(e => e.username).filter(Boolean))];
    const filter = document.getElementById('user-filter');
    usernames.forEach(u => {
        const option = document.createElement('option');
        option.value = u;
        option.textContent = u;
        filter.appendChild(option);
    });

    displayEntries(allEntries);
};

function filterByUser() {
    const selected = document.getElementById('user-filter').value;
    if (selected === 'all') {
        displayEntries(allEntries);
    } else {
        const filtered = allEntries.filter(e => e.username === selected);
        displayEntries(filtered);
    }
}

function displayEntries(entries) {
    const list = document.getElementById('history-list');

    if (entries.length === 0) {
        list.innerHTML = '<p class="no-entries">No entries found.</p>';
        return;
    }

    list.innerHTML = `
        <div class="entry-header" style="grid-template-columns: 1fr 1fr 1fr 1fr 2.5fr 1fr;">
            <span>Username</span>
            <span>Category</span>
            <span>Weight</span>
            <span>Date</span>
            <span>Coordinates</span>
            <span>Photo</span>
        </div>
    ` + entries.map(entry => `
        <div class="entry-card" style="grid-template-columns: 1fr 1fr 1fr 1fr 2.5fr 1fr;">
            <span class="entry-category">${entry.username || 'Unknown'}</span>
            <span class="entry-weight">${entry.category}</span>
            <span class="entry-date">${entry.weight} kg</span>
            <span class="entry-date">${new Date(entry.created_at).toLocaleDateString()}</span>
            <span class="entry-coords">📍 ${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}</span>
            <span class="entry-photo">
                ${entry.photo_url
                    ? `<img src="${entry.photo_url}" onclick="openPhoto('${entry.photo_url}')" class="entry-thumb" />`
                    : '-'}
            </span>
        </div>
    `).join('');
}

function openPhoto(url) {
    document.getElementById('photo-modal-img').src = url;
    document.getElementById('photo-modal').style.display = 'flex';
}

function closePhoto() {
    document.getElementById('photo-modal').style.display = 'none';
}

async function logout() {
    await db.auth.signOut();
    window.location.href = 'index.html';
}
