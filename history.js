window.onload = async function () {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const username = user.user_metadata.username;
    document.getElementById('nav-username').textContent = '👤 ' + username;

    const { data: entries, error } = await db
        .from('waste_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    const list = document.getElementById('history-list');

    if (entries.length === 0) {
        list.innerHTML = '<p class="no-entries">No entries yet.</p>';
        return;
    }

    list.innerHTML = `
        <div class="entry-header" style="grid-template-columns: 1.5fr 1fr 1fr 1.5fr 1fr;">
            <span>Category</span>
            <span>Weight</span>
            <span>Date</span>
            <span>Coordinates</span>
            <span>Photo</span>
        </div>
    ` + entries.map(entry => `
        <div class="entry-card" style="grid-template-columns: 1.5fr 1fr 1fr 1.5fr 1fr;">
            <span class="entry-category">${entry.category}</span>
            <span class="entry-weight">${entry.weight} kg</span>
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
