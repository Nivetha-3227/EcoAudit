// Map variable declared outside so all functions can access it
let map;
let currentLocationMarker;

// Runs automatically when page loads
window.onload = async function () {

    // STEP 1: Check if user is logged in
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // STEP 2: Show username in navbar
    const username = user.user_metadata.username;
    document.getElementById('nav-username').textContent = '👤 ' + username;

    // STEP 3: Initialize the map
    initMap();

    // STEP 4: Fetch entries and update everything
    loadDashboard(user.id);
};

// Sets up the Leaflet map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Centers on India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Show blinking blue dot for current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Create blinking marker for current location
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

// Fetches all entries and updates stats, map, entries list
async function loadDashboard(userId) {
    // Fetch all waste logs for this user from Supabase
    const { data: entries, error } = await db
        .from('waste_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.log('Error fetching entries:', error.message);
        return;
    }

    // Update all sections with fetched data
    updateStats(entries);
    updateMap(entries);
    updateEntriesList(entries);
}

// Calculates and displays the 3 stat cards
async function updateStats(entries) {
    // Total weight - add up all weights
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    document.getElementById('total-weight').textContent = totalWeight.toFixed(2) + ' kg';
    
    // Total count - just the length of entries list
    document.getElementById('total-count').textContent = entries.length;

    // Most frequent category
    const categoryCounts = {};
    entries.forEach(entry => {
        categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });
    const topCategory = Object.keys(categoryCounts).reduce((a, b) =>
        categoryCounts[a] > categoryCounts[b] ? a : b, '-');
    document.getElementById('top-category').textContent = topCategory;

    // Most frequent location using reverse geocoding
    if (entries.length > 0) {
        const mostFrequentEntry = entries[0]; // Most recent entry
        const placeName = await reverseGeocode(mostFrequentEntry.latitude, mostFrequentEntry.longitude);
        document.getElementById('top-category').textContent = topCategory + ' | 📍 ' + placeName;
    }
    const wasteTotals = {};

entries.forEach(entry=>{
    wasteTotals[entry.category] =
        (wasteTotals[entry.category] || 0) + entry.weight;
});
    const top3 = Object.entries(wasteTotals)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3);
    document.getElementById("top3-waste").innerHTML =
top3.map(item=>`

<p>
<b>${item[0]}</b>

${item[1].toFixed(2)} kg

</p>

`).join("");
}

// Converts latitude and longitude to a real place name
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        // Returns suburb or city name
        return data.address.suburb || data.address.city || data.address.town || 'Unknown location';
    } catch (error) {
        return 'Unknown location';
    }
}

// Drops pins on map for each past entry
function updateMap(entries) {
    entries.forEach(entry => {
        L.marker([entry.latitude, entry.longitude])
            .addTo(map)
            .bindTooltip(
`
Latitude: ${entry.latitude.toFixed(5)}
<br>
Longitude: ${entry.longitude.toFixed(5)}
`
);
    });
}

// Fills the past entries dropdown list
function updateEntriesList(entries) {
    const list = document.getElementById('entries-list');
    if (entries.length === 0) {
        list.innerHTML = '<p class="no-entries">No entries yet. Start disposing!</p>';
        return;
    }

    <div class="entry-card">
    <div>
        <strong>${entry.category}</strong><br>
        ${entry.weight} kg<br>
        ${new Date(entry.created_at).toLocaleDateString()}<br>
        📍 ${entry.latitude.toFixed(5)}, ${entry.longitude.toFixed(5)}
    </div>
</div>
}

// Shows or hides past entries dropdown
function toggleEntries() {
    const list = document.getElementById('entries-list');
    const btn = document.querySelector('.dropdown-btn');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.textContent = 'Past Entries ▲';
    } else {
        list.style.display = 'none';
        btn.textContent = 'Past Entries ▼';
    }
}

// Opens the dispose modal
function openModal() {
    document.getElementById('modal').style.display = 'flex';
}

// Closes the dispose modal
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-message').textContent = '';
    document.getElementById('waste-category').value = '';
    document.getElementById('waste-weight').value = '';
}

// Handles waste submission
async function submitWaste() {
    const category = document.getElementById('waste-category').value;
    const weight = parseFloat(document.getElementById('waste-weight').value);

    // Basic validation
    if (!category || !weight || weight <= 0) {
        document.getElementById('modal-message').textContent = 'Please fill in all fields correctly.';
        return;
    }

    document.getElementById('location-status').textContent = '📍 Capturing your location...';

    // Get current user
    const { data: { user } } = await db.auth.getUser();

    // Capture GPS location then save
    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Save to Supabase
            const { error } = await db.from('waste_logs').insert({
                user_id: user.id,
                category: category,
                weight: weight,
                latitude: lat,
                longitude: lng
            });

            if (error) {
                document.getElementById('modal-message').textContent = 'Error saving. Try again.';
            } else {
                closeModal();
                loadDashboard(user.id); // Refresh everything
            }
        },
        function () {
            // If user denies location
            document.getElementById('location-status').textContent = '❌ Location access denied. Please allow location to submit.';
        }
    );
}

// Logs the user out
async function logout() {
    await db.auth.signOut();
    window.location.href = 'index.html';
}
