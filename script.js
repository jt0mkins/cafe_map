const map = L.map('map').setView(
    [-41.3, 173.5],
    5
);

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

const loadingMessage = document.getElementById('loadingMessage');
const visitedCount = document.getElementById('visitedCount');
const wishlistCount = document.getElementById('wishlistCount');
const averageScore = document.getElementById('averageScore');
const cafeList = document.getElementById('cafeList');
const cityFilter = document.getElementById('cityFilter');
const detailPanel = document.getElementById('detailPanel');
const detailContent = document.getElementById('detailContent');
const closeDetail = document.getElementById('closeDetail');

let allCafes = [];
const markerLayer = L.layerGroup().addTo(map);

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);

    return Number.isFinite(parsed) ? parsed : null;
};

const formatScore = (value) => {
    if (value === null || value === undefined) {
        return '—';
    }

    return `${value.toFixed(2)} ⭐`;
};

const scoreColor = (value) => {
    if (value === null || Number.isNaN(value)) {
        return '#7f8c8d';
    }

    if (value >= 8.5) return '#1f7a1f';
    if (value >= 7.0) return '#ff9f1c';
    if (value >= 5.0) return '#ef476f';
    return '#6c5ce7';
};

const getPhotoUrls = (value) => {
    if (!value) {
        return [];
    }

    return String(value)
        .split(/[|,\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const showDetailPanel = (cafe) => {
    const scoreBreakdown = [
        ['Coffee Quality', cafe.coffeeQuality],
        ['Food Quality', cafe.foodQuality],
        ['Aesthetics', cafe.aesthetics],
        ['Rain Vibes', cafe.rainVibes],
        ['Lighting', cafe.lighting],
        ['Main Character Energy', cafe.mainCharacterEnergy],
        ['Dietaries', cafe.dietaries],
        ['Work Friendly', cafe.workFriendly],
        ['Stay a While Factor', cafe.stayAWileFactor],
        ['Staff', cafe.staff],
        ['Post Exercise', cafe.postExercise],
        ['First Date', cafe.firstDate]
    ];

    const photoMarkup = cafe.photos.length
        ? cafe.photos.map((photo) => `
            <a href="${photo}" target="_blank" rel="noopener noreferrer">
                <img src="${photo}" alt="${cafe.name} photo" />
            </a>
        `).join('')
        : '<p class="photo-placeholder">No photos added for this café yet.</p>';

    detailContent.innerHTML = `
        <div class="detail-header">
            <div>
                <p class="detail-kicker">#${cafe.rank || '—'} • ${cafe.city}</p>
                <h2>${cafe.name}</h2>
            </div>
            <div class="detail-score-pill">${formatScore(cafe.score)}</div>
        </div>

        <div class="detail-meta-block">
            <p><strong>Status:</strong> ${cafe.status}</p>
            <p><strong>Address:</strong> ${cafe.address}</p>
            <p><strong>Notes:</strong> ${cafe.notes}</p>
        </div>

        <div class="detail-grid">
            ${scoreBreakdown.map(([label, value]) => `
                <div class="detail-score-item">
                    <span>${label}</span>
                    <strong>${value !== null ? value : '—'}</strong>
                </div>
            `).join('')}
        </div>

        <div class="detail-photos">
            <h3>Photos</h3>
            ${photoMarkup}
        </div>
    `;

    detailPanel.classList.remove('hidden');
    detailPanel.setAttribute('aria-hidden', 'false');
    map.flyTo([cafe.latitude, cafe.longitude], 12, { duration: 1.5 });
};

const renderCafeList = (cafes) => {
    const sorted = [...cafes].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

    cafeList.innerHTML = sorted.slice(0, 12).map((cafe) => `
        <div class="cafe-item" data-lat="${cafe.latitude}" data-lng="${cafe.longitude}">
            <div class="cafe-item-top">
                <span class="rank-badge">#${cafe.rank || '—'}</span>
                <strong>${cafe.name}</strong>
            </div>
            <div class="cafe-score">${formatScore(cafe.score)}</div>
            <div class="cafe-meta">${cafe.city} • ${cafe.status}</div>
        </div>
    `).join('');

    document.querySelectorAll('.cafe-item').forEach((item) => {
        item.addEventListener('click', () => {
            const lat = Number(item.dataset.lat);
            const lng = Number(item.dataset.lng);
            const selectedCafe = allCafes.find((cafe) => cafe.latitude === lat && cafe.longitude === lng);

            if (selectedCafe) {
                showDetailPanel(selectedCafe);
            }
        });
    });
};

const renderStats = (cafes) => {
    const visited = cafes.filter((cafe) => cafe.status.toLowerCase() === 'visited');
    const wishlist = cafes.filter((cafe) => cafe.status.toLowerCase() === 'wishlist');
    const scores = visited.map((cafe) => cafe.score).filter((score) => score !== null);
    const average = scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null;

    visitedCount.textContent = String(visited.length);
    wishlistCount.textContent = String(wishlist.length);
    averageScore.textContent = average === null ? '—' : average.toFixed(2);
};

const populateCityFilter = (cafes) => {
    const cities = [...new Set(cafes.map((cafe) => cafe.city).filter(Boolean))].sort();

    cityFilter.innerHTML = ['<option value="all">All cities</option>']
        .concat(cities.map((city) => `<option value="${city}">${city}</option>`))
        .join('');
};

const renderMap = (cafes) => {
    markerLayer.clearLayers();

    cafes.forEach((cafe) => {
        if (!cafe.latitude || !cafe.longitude) {
            return;
        }

        const marker = L.circleMarker([cafe.latitude, cafe.longitude], {
            radius: 7,
            color: scoreColor(cafe.score),
            weight: 2,
            fillColor: scoreColor(cafe.score),
            fillOpacity: 0.85
        });

        marker.on('click', () => showDetailPanel(cafe));
        marker.addTo(markerLayer);
    });
};

const applyCityFilter = () => {
    const selectedCity = cityFilter.value;
    const filtered = selectedCity === 'all'
        ? allCafes
        : allCafes.filter((cafe) => cafe.city === selectedCity);

    renderStats(filtered);
    renderCafeList(filtered);
    renderMap(filtered);

    loadingMessage.textContent = selectedCity === 'all'
        ? `Loaded ${allCafes.length} cafe locations`
        : `Showing ${filtered.length} cafe locations in ${selectedCity}`;
};

const loadCafeData = async () => {
    try {
        const response = await fetch('cafes.csv');

        if (!response.ok) {
            throw new Error(`Unable to fetch cafes.csv: ${response.status}`);
        }

        const csvText = await response.text();
        const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });

        allCafes = parsed.data
            .map((row) => ({
                name: row.Name?.trim() || 'Unknown Cafe',
                city: row.City?.trim() || '—',
                address: row.Address?.trim() || '—',
                status: row.Status?.trim() || 'Unknown',
                notes: row.Notes?.trim() || '—',
                score: toNumber(row['Weighted Score']),
                rank: toNumber(row.Rank),
                latitude: toNumber(row.Latitude),
                longitude: toNumber(row.Longitude),
                coffeeQuality: toNumber(row['Coffee Quality']),
                foodQuality: toNumber(row['Food Quality']),
                aesthetics: toNumber(row['Aesthetics']),
                rainVibes: toNumber(row['Rain Vibes']),
                lighting: toNumber(row['Lighting']),
                mainCharacterEnergy: toNumber(row['Main Character Energy']),
                dietaries: toNumber(row['Dietaries']),
                workFriendly: toNumber(row['Work Friendly']),
                stayAWileFactor: toNumber(row['Stay a While Factor']),
                staff: toNumber(row['Staff']),
                postExercise: toNumber(row['Post Exercise']),
                firstDate: toNumber(row['First Date']),
                photos: getPhotoUrls(row.Photos)
            }))
            .filter((cafe) => cafe.latitude !== null && cafe.longitude !== null);

        populateCityFilter(allCafes);
        cityFilter.addEventListener('change', applyCityFilter);
        closeDetail.addEventListener('click', () => {
            detailPanel.classList.add('hidden');
            detailPanel.setAttribute('aria-hidden', 'true');
        });
        applyCityFilter();
    } catch (error) {
        console.error(error);
        loadingMessage.textContent = 'Unable to load spreadsheet data. Please start a local server and keep cafes.csv in the project root.';
    }
};

loadCafeData();
//