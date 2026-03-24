/**
 * CloudCrop - JavaScript
 *
 * Handles simulated sensor data generation, real-time dashboard updates,
 * threshold-based status classification, historical data visualization
 * using Chart.js, live weather data via OpenWeatherMap API, and
 * mobile navigation menu toggle.
 *
 * Sensors monitored:
 *   - Temperature  : 0–125 °F
 *       < 20          → Extreme Cold  (Critical)
 *       20–49         → Cold          (Warning)
 *       50–80         → Cool          (Healthy)
 *       81–100        → Hot           (Warning)
 *       > 100         → Extreme Hot   (Critical)
 *
 *   - Soil Moisture: raw 0–950, displayed as % (raw / 950 × 100)
 *       0–189   raw  (0–19%)   → Extreme Dry (Critical)
 *       190–379 raw  (20–39%)  → Dry         (Warning)
 *       380–569 raw  (40–59%)  → Optimal     (Healthy)
 *       570–759 raw  (60–79%)  → Wet         (Warning)
 *       760–950 raw  (80–100%) → Extreme Wet (Critical)
 *
 *   - Sunlight     : 0–1200 lux
 *       < 100         → Extreme Low   (Critical)
 *       100–299       → Low           (Warning)
 *       300–800       → Medium        (Healthy)
 *       801–1000      → High          (Warning)
 *       > 1000        → Extreme High  (Critical)
 *
 * Author: Sajal Das
 * Modified: 3/10/2026
 */


// ===== SENSOR DATA GENERATION =====

/**
 * Generates a randomized snapshot of sensor readings within realistic ranges.
 *
 * @returns {{ temperature: string, moisture: number, light: number }}
 *   temperature – 0–125 °F (1 decimal place)
 *   moisture    – 0–950 raw integer (converted to % for display)
 *   light       – 0–1200 lux integer
 */
function generateSensorData() {
    return {
        temperature: (Math.random() * 125).toFixed(1),  // 0–125 °F
        moisture:    Math.floor(Math.random() * 951),   // 0–950 raw
        light:       Math.floor(Math.random() * 1200)   // 0–1200 lux
    };
}


// ===== STATUS DETERMINATION =====

/**
 * Classifies a raw sensor reading into a status level with a matching
 * CSS class and hex color.
 *
 * @param {number} value - Raw sensor reading.
 * @param {'temperature'|'moisture'|'light'} type - Sensor type.
 * @returns {{ status: string, statusClass: string, color: string }}
 */
function updateSensorStatus(value, type) {
    let status = '', statusClass = 'status-good', color = '#22c55e';

    if (type === 'temperature') {
        if (value < 20) {
            status = 'Extreme Cold'; statusClass = 'status-critical'; color = '#1e40af';
        } else if (value <= 49) {
            status = 'Cold';         statusClass = 'status-warning';  color = '#3b82f6';
        } else if (value <= 80) {
            status = 'Cool'; // healthy defaults apply
        } else if (value <= 100) {
            status = 'Hot';          statusClass = 'status-warning';  color = '#f59e0b';
        } else {
            status = 'Extreme Hot';  statusClass = 'status-critical'; color = '#ef4444';
        }

    } else if (type === 'moisture') {
        // Thresholds on raw value (0–950); zones map evenly to 5 status levels:
        //   0–189   → Extreme Dry  (Critical)
        //   190–379 → Dry          (Warning)
        //   380–569 → Optimal      (Healthy)
        //   570–759 → Wet          (Warning)
        //   760–950 → Extreme Wet  (Critical)
        if (value >= 760) {
            status = 'Extreme Wet'; statusClass = 'status-critical'; color = '#1e40af';
        } else if (value >= 570) {
            status = 'Wet';         statusClass = 'status-warning';  color = '#0ea5e9';
        } else if (value >= 380) {
            status = 'Optimal'; // healthy defaults apply
        } else if (value >= 190) {
            status = 'Dry';         statusClass = 'status-warning';  color = '#f59e0b';
        } else {
            status = 'Extreme Dry'; statusClass = 'status-critical'; color = '#dc2626';
        }

    } else if (type === 'light') {
        if (value < 100) {
            status = 'Extreme Low';  statusClass = 'status-critical'; color = '#1e40af';
        } else if (value <= 299) {
            status = 'Low';          statusClass = 'status-warning';  color = '#64748b';
        } else if (value <= 800) {
            status = 'Medium'; // healthy defaults apply
        } else if (value <= 1000) {
            status = 'High';         statusClass = 'status-warning';  color = '#f59e0b';
        } else {
            status = 'Extreme High'; statusClass = 'status-critical'; color = '#ef4444';
        }
    }

    return { status, statusClass, color };
}


// ===== DASHBOARD UPDATE =====

/**
 * Updates a sensor card's value and status badge.
 * Moisture is converted from raw (0–950) to percentage for display.
 *
 * @param {string} id    - ID prefix: 'temp', 'moisture', or 'light'.
 * @param {number} value - Raw sensor reading.
 * @param {'temperature'|'moisture'|'light'} type
 */
function updateSensorCard(id, value, type) {
    const valueEl  = document.getElementById(`${id}-value`);
    const statusEl = document.getElementById(`${id}-status`);
    const { status, statusClass, color } = updateSensorStatus(value, type);

    // Convert raw moisture (0–950) → percentage (0–100%)
    const displayValue = (type === 'moisture')
        ? Math.round(value / 950 * 100)
        : value;

    valueEl.textContent  = displayValue;
    valueEl.style.color  = color;
    statusEl.textContent = status;
    statusEl.className   = `sensor-status ${statusClass}`;
}

/**
 * Refreshes all three sensor cards and the "last updated" timestamp.
 * Called on load and every 5 seconds.
 */
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

/**
 * Maps an OpenWeatherMap icon code (e.g. '01d') to a weather emoji.
 *
 * @param {string} code - Icon code string from the API.
 * @returns {string} Matching emoji character.
 */
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

/**
 * Fetches current weather (/weather) and the nearest upcoming forecast
 * slot (/forecast) in parallel, then populates the three weather cards:
 *   - Outside Temp
 *   - Conditions
 *   - 2-Hour Forecast (first 3-hour interval slot)
 *
 * Shows an error banner on failure. Refreshed every 60 seconds.
 */
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

        // Current conditions
        document.getElementById('weather-temp').textContent = cur.main.temp.toFixed(1);
        document.getElementById('weather-desc').textContent = cur.weather[0].description;
        document.getElementById('weather-error').style.display = 'none';

        // 2-hour forecast — first available 3-hour interval slot
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

/**
 * Generates 24 hours of simulated hourly readings for the trend chart.
 *
 * @returns {{ labels: string[], tempData: number[], moistureData: number[], lightData: number[] }}
 */
function generateHistoricalData() {
    const labels = [], tempData = [], moistureData = [], lightData = [];
    for (let i = 23; i >= 0; i--) {
        labels.push(`${i}h ago`);
        tempData.push(Math.random() * 125);          // 0–125 °F
        moistureData.push(Math.random() * 951);      // 0–950 raw → % on chart
        lightData.push(Math.random() * 1200);        // 0–1200 lux
    }
    return { labels, tempData, moistureData, lightData };
}


// ===== DOM-DEPENDENT INITIALIZATION =====
// Everything that reads or writes DOM elements runs inside DOMContentLoaded
// so the browser has fully parsed the HTML before any getElementById calls.

document.addEventListener('DOMContentLoaded', function () {

    // ── Chart ──────────────────────────────────────────────────────────────
    // Moisture plotted as 0–100 %; sunlight divided by 10 to share the y-axis.
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
                    label: 'Sunlight (lux)',
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

    // ── Sensor dashboard ───────────────────────────────────────────────────
    updateDashboard();
    setInterval(updateDashboard, 5000);

    // ── Weather ────────────────────────────────────────────────────────────
    fetchWeather();
    setInterval(fetchWeather, 60 * 1000);

    // ── Mobile menu ────────────────────────────────────────────────────────
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