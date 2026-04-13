/**
 * CloudCrop - Main JavaScript (script.js)
 *
 * This file controls all frontend logic for the CloudCrop dashboard.
 * It manages Firebase authentication state, real-time UI updates,
 * sensor data simulation/updates, weather API integration, and
 * interactive dashboard features.
 *
 * Core Responsibilities:
 * - Firebase Authentication (login state monitoring, logout handling)
 * - Auth overlay control (login/register/forgot password UI switching)
 * - Real-time sensor data updates (temperature, moisture, light)
 * - Status evaluation (good / warning / critical thresholds)
 * - Chart.js historical data visualization updates
 * - OpenWeatherMap API integration for live weather data
 * - Mobile navigation menu toggle functionality
 * - UI state management and dynamic DOM updates
 *
 * Features:
 * - Auto-redirect if user is not authenticated
 * - Live dashboard refresh logic
 * - Error handling for API and auth failures
 * - Responsive UI interactions
 *
 * Dependencies:
 * - Firebase Authentication (v9 compat SDK)
 * - Chart.js
 * - OpenWeatherMap API
 *
 * Author: Sajal Das
 * Modified: 4/13/2026
 */

// ===== FIREBASE CONFIGURATION =====
// Replace these values with your own Firebase project credentials.
// Get them from: https://console.firebase.google.com → Project Settings → Your Apps
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


// ===== AUTH PANEL HELPERS =====

/** Shows one auth panel and hides the others. */
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

/** Friendly error messages for common Firebase auth codes. */
function friendlyError(code) {
    const map = {
        'auth/user-not-found':        'No account found with that email.',
        'auth/wrong-password':        'Incorrect password. Please try again.',
        'auth/invalid-email':         'Please enter a valid email address.',
        'auth/email-already-in-use':  'An account with that email already exists.',
        'auth/weak-password':         'Password must be at least 6 characters.',
        'auth/too-many-requests':     'Too many attempts. Please wait a moment.',
        'auth/network-request-failed':'Network error. Check your connection.',
        'auth/invalid-credential':    'Invalid email or password.',
        'auth/invalid-login-credentials': 'Invalid email or password.',
        'auth/user-disabled':         'This account has been disabled.'
    };
    console.log('Firebase error code:', code); // temporary — remove after testing
    return map[code] || 'Something went wrong. Please try again.';
}

// ===== AUTH STATE LISTENER =====
// Runs immediately when Firebase resolves the current session.

auth.onAuthStateChanged(function (user) {
    const overlay = document.getElementById('auth-overlay');
    const logoutBtn   = document.getElementById('btn-logout');
    const userEmailEl = document.getElementById('nav-user-email');

    if (user) {
        // Signed in — hide modal, show user info + logout button
        overlay.classList.add('hidden');
        logoutBtn.style.display   = 'inline-flex';
        userEmailEl.textContent   = user.email;
    } else {
        // Signed out — show modal
        overlay.classList.remove('hidden');
        logoutBtn.style.display   = 'none';
        userEmailEl.textContent   = '';
        showPanel('panel-login');
    }
});


// ===== DOM-DEPENDENT INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function () {

    // ── Auth panel navigation ───────────────────────────────────────────
    document.getElementById('go-forgot').addEventListener('click',   e => { e.preventDefault(); showPanel('panel-forgot');   });
    document.getElementById('go-register').addEventListener('click', e => { e.preventDefault(); showPanel('panel-register'); });
    document.getElementById('go-login').addEventListener('click',    e => { e.preventDefault(); showPanel('panel-login');    });
    document.getElementById('go-login-2').addEventListener('click',  e => { e.preventDefault(); showPanel('panel-login');    });

    // ── Login ───────────────────────────────────────────────────────────
    document.getElementById('btn-login').addEventListener('click', async function () {
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        clearAuthMessages();
        if (!email || !password) { showError('login-error', 'Please fill in all fields.'); return; }

        this.disabled    = true;
        this.textContent = 'Signing in…';
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged handles hiding the modal
        } catch (err) {
            showError('login-error', friendlyError(err.code));
        } finally {
            this.disabled    = false;
            this.textContent = 'Sign In';
        }
    });

    // ── Register ────────────────────────────────────────────────────────
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
            // onAuthStateChanged handles hiding the modal
        } catch (err) {
            showError('register-error', friendlyError(err.code));
        } finally {
            this.disabled    = false;
            this.textContent = 'Create Account';
        }
    });

    // ── Forgot password ─────────────────────────────────────────────────
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

    // ── Logout ──────────────────────────────────────────────────────────
    document.getElementById('btn-logout').addEventListener('click', async function () {
        await auth.signOut();
    });

    // Allow pressing Enter to submit on login inputs
    ['login-email', 'login-password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-login').click();
        });
    });


    // ── Chart ──────────────────────────────────────────────────────────
    const hist = generateHistoricalData();
    const ctx  = document.getElementById('dataChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: hist.labels,
            datasets: [
                {
                    label: 'Temperature (°F)',
                    data: hist.tempData,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255,107,107,0.1)',
                    tension: 0.4
                },
                {
                    label: 'Soil Moisture (%)',
                    data: hist.moistureData.map(v => Math.round(v / 950 * 100)),
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78,205,196,0.1)',
                    tension: 0.4
                },
                {
                    label: 'Sunlight (lux ÷ 10)',
                    data: hist.lightData.map(v => v / 10),
                    borderColor: '#ffd93d',
                    backgroundColor: 'rgba(255,217,61,0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales:  { y: { beginAtZero: true } }
        }
    });

    // ── Sensor dashboard ───────────────────────────────────────────────
    updateDashboard();
    setInterval(updateDashboard, 5000);

    // ── Weather ────────────────────────────────────────────────────────
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


// ===== SENSOR DATA GENERATION =====

function generateSensorData() {
    return {
        temperature: (Math.random() * 125).toFixed(1),
        moisture:    Math.floor(Math.random() * 951),
        light:       Math.floor(Math.random() * 1200)
    };
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


// ===== DASHBOARD UPDATE =====

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

function updateDashboard() {
    const data = generateSensorData();
    updateSensorCard('temp',     data.temperature, 'temperature');
    updateSensorCard('moisture', data.moisture,    'moisture');
    updateSensorCard('light',    data.light,       'light');
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
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


// ===== HISTORICAL DATA =====

function generateHistoricalData() {
    const labels = [], tempData = [], moistureData = [], lightData = [];
    for (let i = 23; i >= 0; i--) {
        labels.push(`${i}h ago`);
        tempData.push(Math.random() * 125);
        moistureData.push(Math.random() * 951);
        lightData.push(Math.random() * 1200);
    }
    return { labels, tempData, moistureData, lightData };
}