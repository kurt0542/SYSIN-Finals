// API client communicating through reverse proxy
const API = {
    songs: '/api/songs/',
    playlists: '/api/playlists/'
};

let allSongs = [];
let allPlaylists = [];
let selectedPlaylistId = null;

// Format duration into readable m:ss
function formatTime(seconds) {
    const sec = Number(seconds) || 0;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Display banner notification
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.classList.remove('hidden');
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// Fetch and render songs
async function loadSongs() {
    try {
        const res = await fetch(API.songs);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allSongs = await res.json();
        
        document.getElementById('songs-count').textContent = `${allSongs.length} tracks`;
        populateGenreFilter(allSongs);
        renderSongs(allSongs);
    } catch (err) {
        console.error('Failed to load songs:', err);
        document.getElementById('songs-list').innerHTML = 
            `<tr><td colspan="5" class="text-center" style="color:red">Failed to load songs from API</td></tr>`;
    }
}

// Populate genre dropdown
function populateGenreFilter(songs) {
    const select = document.getElementById('genre-filter');
    const genres = Array.from(new Set(songs.map(s => s.genre))).filter(Boolean);
    
    // Retain default
    select.innerHTML = '<option value="">All Genres</option>';
    genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        select.appendChild(opt);
    });
}

// Render songs list
function renderSongs(songs) {
    const tbody = document.getElementById('songs-list');
    if (songs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No songs match criteria</td></tr>`;
        return;
    }

    tbody.innerHTML = songs.map(song => `
        <tr>
            <td><strong>${escapeHtml(song.title)}</strong></td>
            <td>${escapeHtml(song.artist)}</td>
            <td><span class="badge" style="font-size:0.75rem">${escapeHtml(song.genre)}</span></td>
            <td>${formatTime(song.duration_seconds)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="promptAddToPlaylist(${song.id})">
                    + Add to Playlist
                </button>
            </td>
        </tr>
    `).join('');
}

// Fetch and render playlists
async function loadPlaylists() {
    try {
        const res = await fetch(API.playlists);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allPlaylists = await res.json();

        document.getElementById('playlists-count').textContent = `${allPlaylists.length} playlists`;
        renderPlaylists(allPlaylists);

        if (selectedPlaylistId) {
            viewPlaylist(selectedPlaylistId);
        }
    } catch (err) {
        console.error('Failed to load playlists:', err);
        document.getElementById('playlists-list').innerHTML = 
            `<div class="text-center" style="color:red">Failed to load playlists</div>`;
    }
}

function renderPlaylists(playlists) {
    const container = document.getElementById('playlists-list');
    if (playlists.length === 0) {
        container.innerHTML = `<div class="text-center">No playlists created yet. Create one above!</div>`;
        return;
    }

    container.innerHTML = playlists.map(p => `
        <div class="playlist-item" onclick="viewPlaylist(${p.id})">
            <div>
                <strong>${escapeHtml(p.name)}</strong>
                <p class="subtext">${p.song_count} songs &bull; ${p.total_duration_label || '0s'}</p>
            </div>
            <div>
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); deletePlaylist(${p.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// View details for a single playlist
async function viewPlaylist(playlistId) {
    selectedPlaylistId = playlistId;
    try {
        const res = await fetch(`${API.playlists}${playlistId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const box = document.getElementById('playlist-details');
        document.getElementById('active-playlist-name').textContent = data.name;
        document.getElementById('active-playlist-duration').textContent = data.total_duration_label;

        const tracksList = document.getElementById('active-playlist-tracks');
        if (data.songs.length === 0) {
            tracksList.innerHTML = `<li class="text-center">No tracks in this playlist yet. Add songs from the catalog!</li>`;
        } else {
            tracksList.innerHTML = data.songs.map(s => `
                <li class="track-entry">
                    <span>${escapeHtml(s.title)} - ${escapeHtml(s.artist)} (${formatTime(s.duration_seconds)})</span>
                    <button class="btn btn-sm btn-secondary" onclick="removeSongFromPlaylist(${data.id}, ${s.id})">&times;</button>
                </li>
            `).join('');
        }

        box.classList.remove('hidden');
    } catch (err) {
        console.error('Failed to view playlist:', err);
    }
}

// Create new playlist
document.getElementById('create-playlist-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('playlist-name-input');
    const name = input.value.trim();
    if (!name) return;

    try {
        const res = await fetch(API.playlists, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        input.value = '';
        showAlert(`Created playlist "${name}"`);
        await loadPlaylists();
    } catch (err) {
        console.error(err);
        showAlert('Failed to create playlist', 'error');
    }
});

// Delete playlist
async function deletePlaylist(playlistId) {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
        const res = await fetch(`${API.playlists}${playlistId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (selectedPlaylistId === playlistId) {
            document.getElementById('playlist-details').classList.add('hidden');
            selectedPlaylistId = null;
        }
        showAlert('Playlist deleted');
        await loadPlaylists();
    } catch (err) {
        showAlert('Failed to delete playlist', 'error');
    }
}

// Add song to playlist
async function promptAddToPlaylist(songId) {
    if (allPlaylists.length === 0) {
        showAlert('Please create a playlist first!', 'error');
        return;
    }
    const targetId = allPlaylists[0].id;
    try {
        const res = await fetch(`${API.playlists}${targetId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: songId })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showAlert('Added song to playlist!');
        await loadPlaylists();
        if (selectedPlaylistId && String(selectedPlaylistId) === String(targetId)) {
            viewPlaylist(selectedPlaylistId);
        }
    } catch (err) {
        showAlert('Failed to add song to playlist', 'error');
    }
}

// Remove song from playlist
async function removeSongFromPlaylist(playlistId, songId) {
    try {
        const res = await fetch(`${API.playlists}${playlistId}/songs/${songId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showAlert('Removed song from playlist');
        await loadPlaylists();
        viewPlaylist(playlistId);
    } catch (err) {
        showAlert('Failed to remove song', 'error');
    }
}

// Filter handlers
document.getElementById('song-search').addEventListener('input', applySongFilters);
document.getElementById('genre-filter').addEventListener('change', applySongFilters);

function applySongFilters() {
    const q = document.getElementById('song-search').value.toLowerCase();
    const genre = document.getElementById('genre-filter').value.toLowerCase();

    const filtered = allSongs.filter(s => {
        const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
        const matchesGenre = !genre || s.genre.toLowerCase() === genre;
        return matchesQuery && matchesGenre;
    });

    renderSongs(filtered);
}

document.getElementById('close-details-btn').addEventListener('click', () => {
    document.getElementById('playlist-details').classList.add('hidden');
    selectedPlaylistId = null;
});

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial bootstrap
loadSongs();
loadPlaylists();
