/**
 * CloudCrop - JavaScript
 * 
 * This script handles simulated sensor data generation, real-time dashboard updates,
 * status based on sensor thresholds, historical data visualization using Chart.js,
 *  and mobile navigation menu toggle
 * 
 * Author: Sajal Das
 * Modified: 2/18/2026
 */

// ===== SENSOR DATA GENERATION =====


function generateSensorData() {
    return {
        // Generate temperature between 40°F and 100°F (Critical: <50 or >95, Warning: 50-59 or 86-95, Healthy: 59-86)
        temperature: (40 + Math.random() * 60).toFixed(1),
        
        // Generate moisture between 10% and 90% (Critical: <20, Warning: <30 or >80, Healthy: 30-80)
        moisture: (10 + Math.random() * 80).toFixed(1),
        
        // Generate light between 100 and 1100 lux (Warning: <300 or >900, Healthy: 300-900)
        light: Math.floor(100 + Math.random() * 1000)
    };
}

// ===== STATUS DETERMINATION =====

/**
 * Determines the status of a sensor reading based on predefined thresholds
 * - Temperature: Cool (59-86°F), Hot (86-95°F), Extreme Hot (>95°F), Cold (50-59°F), Extreme Cold (<50°F)
 * - Moisture: Optimal (30-80%), Wet (>80%), Dry (<30%), Very Dry (<20%)
 * - Light: Medium (300-900 lux), High (>900 lux), Low (<300 lux)
 * 
 * @param {number} value - The sensor reading value
 * @param {string} type - The type of sensor ('temperature', 'moisture', or 'light')
 * @returns {Object} Object containing status text, CSS class name, and color code
 */
function updateSensorStatus(value, type) {
    let status = '', statusClass = 'status-good', color = '#22c55e';

    if (type === 'temperature') {
        if (value >= 59 && value <= 86) {
            status = 'Cool';
        } else if (value > 86 && value <= 95) {
            status = 'Hot';
            statusClass = 'status-warning';
            color = '#f59e0b';
        } else if (value > 95) {
            status = 'Extreme Hot';
            statusClass = 'status-critical';
            color = '#ef4444';
        } else if (value >= 50 && value < 59) {
            status = 'Cold';
            statusClass = 'status-warning';
            color = '#3b82f6';
        } else {
            status = 'Extreme Cold';
            statusClass = 'status-critical';
            color = '#1e40af';
        }
    } else if (type === 'moisture') {
        if (value >= 30 && value <= 80) {
            status = 'Optimal';
            color = '#3b82f6';
        } else if (value > 80) {
            status = 'Wet';
            statusClass = 'status-warning';
            color = '#0ea5e9';
        } else if (value >= 20 && value < 30) {
            status = 'Dry';
            statusClass = 'status-warning';
            color = '#f59e0b';
        } else {
            status = 'Very Dry';
            statusClass = 'status-critical';
            color = '#dc2626';
        }
    } else if (type === 'light') {
        if (value >= 300 && value <= 900) {
            status = 'Medium';
            color = '#eab308';
        } else if (value > 900) {
            status = 'High';
            statusClass = 'status-warning';
            color = '#f59e0b';
        } else {
            status = 'Low';
            statusClass = 'status-warning';
            color = '#64748b';
        }
    }

    return { status, statusClass, color };
}

// ===== DASHBOARD UPDATE FUNCTIONS =====

/**
 * Updates a single sensor card with current readings
 * @param {string} id - The sensor id prefix ('temp', 'moisture', 'light')
 * @param {number} value - The sensor value
 * @param {string} type - The sensor type
 */
function updateSensorCard(id, value, type) {
    const valueEl = document.getElementById(`${id}-value`);
    const statusEl = document.getElementById(`${id}-status`);
    const sensorStatus = updateSensorStatus(value, type);
    
    valueEl.textContent = value;
    valueEl.style.color = sensorStatus.color;
    statusEl.textContent = sensorStatus.status;
    statusEl.className = `sensor-status ${sensorStatus.statusClass}`;
}

/**
 * Updates all sensor cards on the dashboard with current readings
 * This function is called on page load and then periodically (every 5 seconds)
 */
function updateDashboard() {
    const data = generateSensorData();
    
    // Update all sensor cards
    updateSensorCard('temp', data.temperature, 'temperature');
    updateSensorCard('moisture', data.moisture, 'moisture');
    updateSensorCard('light', data.light, 'light');
    
    // Update timestamp
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
}

// ===== HISTORICAL DATA GENERATION =====

function generateHistoricalData() {
    const labels = [], tempData = [], moistureData = [], lightData = [];

    // Generate data for each hour in the past 24 hours
    for (let i = 23; i >= 0; i--) {
        labels.push(`${i}h ago`);
        tempData.push(40 + Math.random() * 60);
        moistureData.push(10 + Math.random() * 80);
        lightData.push(100 + Math.random() * 1000);
    }

    return { labels, tempData, moistureData, lightData };
}

// ===== CHART INITIALIZATION =====

/**
 * Initialize and configure the Chart.js line chart
 * This runs once when the page loads
 */
const historicalData = generateHistoricalData();
const ctx = document.getElementById('dataChart').getContext('2d');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: historicalData.labels,
        datasets: [
            {
                label: 'Temperature (°F)',
                data: historicalData.tempData,
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                tension: 0.4
            },
            {
                label: 'Moisture (%)',
                data: historicalData.moistureData,
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                tension: 0.4
            },
            {
                label: 'Light (lux/10)',
                data: historicalData.lightData.map(v => v / 10),
                borderColor: '#ffd93d',
                backgroundColor: 'rgba(255, 217, 61, 0.1)',
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// ===== MOBILE MENU TOGGLE =====

/**
 * Handle mobile navigation menu toggle
 */
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle) {
        // Toggle menu visibility when hamburger icon is clicked
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnToggle = mobileMenuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
});

// ===== INITIALIZATION AND UPDATE LOOP =====
/**
 * Initial dashboard update on page load and automatic updates every 5 seconds
 */
updateDashboard();
setInterval(updateDashboard, 5000);