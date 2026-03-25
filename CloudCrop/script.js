/**
 * CloudCrop - JavaScript
 *
 * Handles real-time sensor data fetched from the Raspberry Pi using Flask server,
 * threshold-based status classification, live weather data via OpenWeatherMap
 * API, and mobile navigation menu toggle.
 *
 * Data flow:
 * Sensors -> Raspberry Pi -> Flask -> Web Dashboard 
 *
 * Sensors monitored:
 *   - Temperature  : 0–125 °F  (DS18B20 via 1-Wire, converted from °C)
 *       < 20          → Extreme Cold  (Critical)
 *       20–49         → Cold          (Warning)
 *       50–80         → Cool          (Healthy)
 *       81–100        → Hot           (Warning)
 *       > 100         → Extreme Hot   (Critical)
 *
 *   - Soil Moisture: raw 0–950 ADC (MCP3008), displayed as % (raw / 950 × 100)
 *       0–189   raw  (0–19%)   → Extreme Dry (Critical)
 *       190–379 raw  (20–39%)  → Dry         (Warning)
 *       380–569 raw  (40–59%)  → Optimal     (Healthy)
 *       570–759 raw  (60–79%)  → Wet         (Warning)
 *       760–950 raw  (80–100%) → Extreme Wet (Critical)
 *
 *   - Sunlight     : 0–1200 lux (BH1750 via I2C)
 *       < 100         → Extreme Low   (Critical)
 *       100–299       → Low           (Warning)
 *       300–800       → Medium        (Healthy)
 *       801–1000      → High          (Warning)
 *       > 1000        → Extreme High  (Critical)
 *
 * Author: Sajal Das
 * Modified: 3/25/2026
 */


// ===== SENSOR API =====

/**
 * URL of the Flask sensor endpoint served by server.py on the Raspberry Pi.
 * When the HTML is served by the Pi itself (http://<pi-ip>:5000), a relative
 * path works automatically. Change to an absolute URL if hosting separately.
 */
const SENSOR_API_URL = '/sensors';

/**
 * Fetches live sensor readings from the Flask API on the Raspberry Pi,
 * then updates all three sensor cards and the timestamp.
 *
 * Expected JSON shape from GET /sensors:
 *     temperature: number | null,   // °F
 *     moisture:    number | null,   // raw ADC 0–950
 *     light:       number | null,   // lux
 *     error:       string | null,
 *     timestamp:   string          
 *
 * Called once on load and then every 5 seconds.
 */
async function fetchSensors() {
    try {
        const res  = await fetch(SENSOR_API_URL);
        if (!res.ok) throw new Error(`Sensor API returned ${res.status}`);
        const data = await res.json();

        // Only update a card if the server returned a valid value
        if (data.temperature !== null) updateSensorCard('temp',     data.temperature, 'temperature');
        if (data.moisture    !== null) updateSensorCard('moisture', data.moisture,    'moisture');
        if (data.light       !== null) updateSensorCard('light',    data.light,       'light');

        document.getElementById('timestamp').textContent = new Date().toLocaleString();

        if (data.error) console.warn('Sensor warning:', data.error);

    } catch (err) {
        console.error('Could not reach sensor API:', err);
    }
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


// ===== WEATHER API =====

const WEATHER_API_KEY = '143a23e749199fbc8a824789dad93646'; // Replace with your key
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
 * Shows an error on failure. Refreshed every 60 seconds.
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


// ===== DOM-DEPENDENT INITIALIZATION =====
// Everything that reads or writes DOM elements runs inside DOMContentLoaded
// so the browser has fully parsed the HTML before any getElementById calls.

document.addEventListener('DOMContentLoaded', function () {

    // ── Sensor dashboard — fetch real data immediately, then every 5 s ───
    fetchSensors();
    setInterval(fetchSensors, 5000);

    // ── Weather API — fetch immediately, then every 60 s ───
    fetchWeather();
    setInterval(fetchWeather, 60 * 1000);

    // ── Mobile menu ──
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

}); 