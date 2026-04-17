/**
 * CloudCrop - Main JavaScript (script.js)
 *
 * Author: Sajal Das
 * Modified: 4/16/2026
 */

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey:            "AIzaSyDGnKs56xNrxZoz_zmfpkny1_B7ylRoU3s",
    authDomain:        "cloudcorp-39ad1.firebaseapp.com",
    projectId:         "cloudcorp-39ad1",
    storageBucket:     "cloudcorp-39ad1.firebasestorage.app",
    messagingSenderId: "738798231646",
    appId:             "1:738798231646:web:73ea36f328d9aea78cd4cf",
    measurementId:     "G-JMGQYFZRGX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


// ===== RASPBERRY PI API BASE URL =====
// Set this to your Pi's IP address, e.g. 'http://192.168.1.42:5000'
// Leave empty string if this frontend is served directly from the Pi
const PI_API = '';


// ===== AUTH PANEL HELPERS =====

function showPanel(id) {
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    clearAuthMessages();
}

function clearAuthMessages() {
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent   = '';
    });
}

function showError(elId, msg) {
    const el = document.getElementById(elId);
    el.textContent   = msg;
    el.style.display = 'block';
}

function showSuccess(elId, msg) {
    const el = document.getElementById(elId);
    el.textContent   = msg;
    el.style.display = 'block';
}

function friendlyError(code) {
    const map = {
        'auth/user-not-found':            'No account found with that email.',
        'auth/wrong-password':            'Incorrect password. Please try again.',
        'auth/invalid-email':             'Please enter a valid email address.',
        'auth/email-already-in-use':      'An account with that email already exists.',
        'auth/weak-password':             'Password must be at least 6 characters.',
        'auth/too-many-requests':         'Too many attempts. Please wait a moment.',
        'auth/network-request-failed':    'Network error. Check your connection.',
        'auth/invalid-credential':        'Invalid email or password.',
        'auth/invalid-login-credentials': 'Invalid email or password.',
        'auth/user-disabled':             'This account has been disabled.'
    };
    console.log('Firebase error code:', code); // remove after testing
    return map[code] || 'Something went wrong. Please try again.';
}


// ===== AUTH STATE LISTENER =====

auth.onAuthStateChanged(function (user) {
    const overlay      = document.getElementById('auth-overlay');
    const logoutBtn    = document.getElementById('btn-logout');
    const userEmailEl  = document.getElementById('nav-user-email');

    if (user) {
        overlay.classList.add('hidden');
        logoutBtn.style.display  = 'inline-flex';
        userEmailEl.textContent  = user.email;
    } else {
        overlay.classList.remove('hidden');
        logoutBtn.style.display  = 'none';
        userEmailEl.textContent  = '';
        showPanel('panel-login');
    }
});


// ===== DOM-DEPENDENT INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function () {

    // ── Auth panel navigation ──────────────────────────────────────────
    document.getElementById('go-forgot').addEventListener('click',   e => { e.preventDefault(); showPanel('panel-forgot');   });
    document.getElementById('go-register').addEventListener('click', e => { e.preventDefault(); showPanel('panel-register'); });
    document.getElementById('go-login').addEventListener('click',    e => { e.preventDefault(); showPanel('panel-login');    });
    document.getElementById('go-login-2').addEventListener('click',  e => { e.preventDefault(); showPanel('panel-login');    });

    // ── Login ──────────────────────────────────────────────────────────
    document.getElementById('btn-login').addEventListener('click', async function () {
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        clearAuthMessages();
        if (!email || !password) { showError('login-error', 'Please fill in all fields.'); return; }

        this.disabled    = true;
        this.textContent = 'Signing in…';
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            showError('login-error', friendlyError(err.code));
        } finally {
            this.disabled    = false;
            this.textContent = 'Sign In';
        }
    });

    // ── Register ───────────────────────────────────────────────────────
    document.getElementById('btn-register').addEventListener('click', async function () {
        const email    = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm  = document.getElementById('register-confirm').value;
        clearAuthMessages();
        if (!email || !password || !confirm) { showError('register-error', 'Please fill in all fields.'); return; }
        if (password !== confirm)            { showError('register-error', 'Passwords do not match.');     return; }

        this.disabled    = true;
        this.textContent = 'Creating account…';
        try {
            await auth.createUserWithEmailAndPassword(email, password);
        } catch (err) {
            showError('register-error', friendlyError(err.code));
        } finally {
            this.disabled    = false;
            this.textContent = 'Create Account';
        }
    });

    // ── Forgot password ────────────────────────────────────────────────
    document.getElementById('btn-forgot').addEventListener('click', async function () {
        const email = document.getElementById('forgot-email').value.trim();
        clearAuthMessages();
        if (!email) { showError('forgot-error', 'Please enter your email address.'); return; }

        this.disabled    = true;
        this.textContent = 'Sending…';
        try {
            await auth.sendPasswordResetEmail(email);
            showSuccess('forgot-success', 'If this email is registered, a reset link will be sent.');
        } catch (err) {
            showError('forgot-error', friendlyError(err.code));
        } finally {
            this.disabled    = false;
            this.textContent = 'Send Reset Email';
        }
    });

    // ── Logout ─────────────────────────────────────────────────────────
    document.getElementById('btn-logout').addEventListener('click', async function () {
        await auth.signOut();
    });

    // ── Enter key on login ─────────────────────────────────────────────
    ['login-email', 'login-password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-login').click();
        });
    });

    // ── Initial data load + polling ────────────────────────────────────
    refreshDashboard();
    setInterval(refreshDashboard, 30000); // refresh every 30 seconds

    fetchWeather();
    setInterval(fetchWeather, 60 * 1000);

    // ── Mobile menu ────────────────────────────────────────────────────
    const toggle  = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (toggle) {
        toggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
        document.addEventListener('click', function (e) {
            if (!navMenu.contains(e.target) && !toggle.contains(e.target)) {
                navMenu.classList.remove('active');
                toggle.classList.remove('active');
            }
        });
    }

}); // end DOMContentLoaded


// ===== RASPBERRY PI DATA REFRESH =====
// Fetches sensors and watering history from the Pi API in one go.

async function refreshDashboard() {
    try {
        const [sensorsRes, wateringsRes] = await Promise.all([
            fetch(`${PI_API}/sensors`),
            fetch(`${PI_API}/api/watering/history?hours=24`)
        ]);

        if (sensorsRes.ok) {
            const sensors = await sensorsRes.json();
            updateSensorsFromPi(sensors);
        }

        if (wateringsRes.ok) {
            const waterings = await wateringsRes.json();
            updateWateringTable(waterings);
        }

        document.getElementById('timestamp').textContent = new Date().toLocaleString();

    } catch (err) {
        console.error('Dashboard refresh error:', err);
        document.getElementById('timestamp').textContent = 'Connection lost — retrying...';
    }
}


// ===== SENSOR UPDATE FROM PI =====
// Maps the Pi API response shape to your existing sensor cards.
// Pi returns: { temperature (°C), moisture (raw 0-950), light_level (lux) }

function updateSensorsFromPi(data) {
    if (!data || Object.keys(data).length === 0) return;

    // Temperature: Pi gives °C, convert to °F for your dashboard
    if (data.temperature != null) {
        const tempF = parseFloat((data.temperature * 9 / 5 + 32).toFixed(1));
        updateSensorCard('temp', tempF, 'temperature');
    }

    // Moisture: Pi gives raw ADC value (0–950)
    if (data.moisture != null) {
        updateSensorCard('moisture', data.moisture, 'moisture');
    }

    // Light: Pi gives lux directly
    if (data.light_level != null) {
        updateSensorCard('light', data.light_level, 'light');
    }
}


// ===== STATUS DETERMINATION =====

function updateSensorStatus(value, type) {
    let status = '', statusClass = 'status-good', color = '#22c55e';

    if (type === 'temperature') {
        if      (value < 20)   { status = 'Extreme Cold'; statusClass = 'status-critical'; color = '#1e40af'; }
        else if (value <= 49)  { status = 'Cold';         statusClass = 'status-warning';  color = '#3b82f6'; }
        else if (value <= 80)  { status = 'Cool'; }
        else if (value <= 100) { status = 'Hot';          statusClass = 'status-warning';  color = '#f59e0b'; }
        else                   { status = 'Extreme Hot';  statusClass = 'status-critical'; color = '#ef4444'; }
    } else if (type === 'moisture') {
        if      (value >= 760) { status = 'Extreme Wet'; statusClass = 'status-critical'; color = '#1e40af'; }
        else if (value >= 570) { status = 'Wet';         statusClass = 'status-warning';  color = '#0ea5e9'; }
        else if (value >= 380) { status = 'Optimal'; }
        else if (value >= 190) { status = 'Dry';         statusClass = 'status-warning';  color = '#f59e0b'; }
        else                   { status = 'Extreme Dry'; statusClass = 'status-critical'; color = '#dc2626'; }
    } else if (type === 'light') {
        if      (value < 100)  { status = 'Extreme Low';  statusClass = 'status-critical'; color = '#1e40af'; }
        else if (value <= 299) { status = 'Low';          statusClass = 'status-warning';  color = '#64748b'; }
        else if (value <= 800) { status = 'Medium'; }
        else if (value <= 1000){ status = 'High';         statusClass = 'status-warning';  color = '#f59e0b'; }
        else                   { status = 'Extreme High'; statusClass = 'status-critical'; color = '#ef4444'; }
    }

    return { status, statusClass, color };
}


// ===== SENSOR CARD UPDATE =====

function updateSensorCard(id, value, type) {
    const valueEl  = document.getElementById(`${id}-value`);
    const statusEl = document.getElementById(`${id}-status`);
    const { status, statusClass, color } = updateSensorStatus(value, type);
    const displayValue = (type === 'moisture') ? Math.round(value / 950 * 100) : value;
    valueEl.textContent  = displayValue;
    valueEl.style.color  = color;
    statusEl.textContent = status;
    statusEl.className   = `sensor-status ${statusClass}`;
}


// ===== WATERING HISTORY TABLE =====

function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function updateWateringTable(data) {
    const tbody = document.getElementById('watering-table');
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td class="watering-empty" colspan="4">No watering events in the last 24 hours</td></tr>';
        return;
    }
    tbody.innerHTML = data.slice(0, 10).map(w => `
        <tr>
            <td>${formatTime(w.timestamp)}</td>
            <td>${parseFloat(w.duration_seconds).toFixed(1)}s</td>
            <td>${w.model_confidence ? parseFloat(w.model_confidence).toFixed(0) + ' ml' : '--'}</td>
            <td><span class="trigger-badge trigger-${w.trigger}">${w.trigger}</span></td>
        </tr>
    `).join('');
}


// ===== WEATHER API =====

const WEATHER_API_KEY = '143a23e749199fbc8a824789dad93646';
const WEATHER_CITY    = 'Bridgeport,US';

function weatherIcon(code) {
    if (code.startsWith('01')) return '☀️';
    if (code.startsWith('02')) return '🌤️';
    if (code.startsWith('03')) return '🌥️';
    if (code.startsWith('04')) return '☁️';
    if (code.startsWith('09')) return '🌧️';
    if (code.startsWith('10')) return '🌦️';
    if (code.startsWith('11')) return '⛈️';
    if (code.startsWith('13')) return '❄️';
    if (code.startsWith('50')) return '🌫️';
    return '🌡️';
}

async function fetchWeather() {
    try {
        const base   = 'https://api.openweathermap.org/data/2.5';
        const params = `q=${WEATHER_CITY}&appid=${WEATHER_API_KEY}&units=imperial`;
        const [curRes, fcRes] = await Promise.all([
            fetch(`${base}/weather?${params}`),
            fetch(`${base}/forecast?${params}`)
        ]);
        if (!curRes.ok || !fcRes.ok) throw new Error('Fetch failed');
        const cur = await curRes.json();
        const fc  = await fcRes.json();
        document.getElementById('weather-temp').textContent = cur.main.temp.toFixed(1);
        document.getElementById('weather-desc').textContent = cur.weather[0].description;
        document.getElementById('weather-error').style.display = 'none';
        const next = fc.list[0];
        document.getElementById('forecast-icon').textContent = weatherIcon(next.weather[0].icon);
        document.getElementById('forecast-temp').textContent = `${next.main.temp.toFixed(1)} °F`;
        document.getElementById('forecast-desc').textContent = next.weather[0].description;
    } catch (err) {
        document.getElementById('weather-error').style.display = 'block';
        console.error('Weather API error:', err);
    }
}
