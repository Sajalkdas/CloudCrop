/**
 * CloudCorp - JavaScript
 * 
 * This script handles:
 * - Simulated sensor data generation 
 * - Real-time dashboard updates
 * - Status determination based on sensor thresholds
 * - Historical data visualization using Chart.js
 * 
 * Name: Sajal Das
 * Date: 1/13/2026
 */

// ===== SENSOR DATA GENERATION =====

function generateSensorData() {
    return {
        // Generate temperature between 40°F and 100°F (wider range to show all statuses)
        // Critical: <50 or >95, Warning: 50-59 or 86-95, Healthy: 59-86
        temperature: (40 + Math.random() * 60).toFixed(1),
        
        // Generate moisture between 10% and 90% (wider range to show all statuses)
        // Critical: <20, Warning: <30 or >80, Healthy: 30-80
        moisture: (10 + Math.random() * 80).toFixed(1),
        
        // Generate light between 100 and 1100 lux (wider range to show all statuses)
        // Warning: <300 or >900, Healthy: 300-900
        light: Math.floor(100 + Math.random() * 1000)
    };
}

// ===== STATUS DETERMINATION =====

/**
 * Determines the status of a sensor reading based on predefined thresholds
 * 
 * Thresholds:
 * - Temperature: Cool (59-86°F), Hot (86-95°F), Extreme Hot (>95°F), Cold (50-59°F), Extreme Cold (<50°F)
 * - Moisture: Optimal (30-80%), Wet (>80%), Dry (<30%), Very Dry (<20%)
 * - Light: Medium (300-900 lux), High (>900 lux), Low (<300 lux)
 * 
 * @param {number} value - The sensor reading value
 * @param {string} type - The type of sensor ('temperature', 'moisture', or 'light')
 * @returns {Object} Object containing status text, CSS class name, and color code
 */
function updateSensorStatus(value, type) {
    // Default status
    let status = '';
    let statusClass = 'status-good';
    let color = '#22c55e'; // Green for optimal

    // Determine status based on sensor type and thresholds
    if (type === 'temperature') {
        // Temperature thresholds in Fahrenheit
        if (value >= 59 && value <= 86) {
            status = 'Cool';
            statusClass = 'status-good';
            color = '#22c55e'; // Green for cool/optimal
        } else if (value > 86 && value <= 95) {
            status = 'Hot';
            statusClass = 'status-warning';
            color = '#f59e0b'; // Orange for hot
        } else if (value > 95) {
            status = 'Extreme Hot';
            statusClass = 'status-critical';
            color = '#ef4444'; // Red for extreme hot
        } else if (value >= 50 && value < 59) {
            status = 'Cold';
            statusClass = 'status-warning';
            color = '#3b82f6'; // Blue for cold
        } else if (value < 50) {
            status = 'Extreme Cold';
            statusClass = 'status-critical';
            color = '#1e40af'; // Dark blue for extreme cold
        }
    } else if (type === 'moisture') {
        // Moisture percentage thresholds
        if (value >= 30 && value <= 80) {
            status = 'Optimal';
            statusClass = 'status-good';
            color = '#3b82f6'; // Blue for optimal moisture
        } else if (value > 80) {
            status = 'Wet';
            statusClass = 'status-warning';
            color = '#0ea5e9'; // Light blue for wet
        } else if (value >= 20 && value < 30) {
            status = 'Dry';
            statusClass = 'status-warning';
            color = '#f59e0b'; // Orange for dry
        } else if (value < 20) {
            status = 'Very Dry';
            statusClass = 'status-critical';
            color = '#dc2626'; // Red for very dry
        }
    } else if (type === 'light') {
        // Light intensity thresholds in lux
        if (value >= 300 && value <= 900) {
            status = 'Medium';
            statusClass = 'status-good';
            color = '#eab308'; // Yellow for medium/optimal light
        } else if (value > 900) {
            status = 'High';
            statusClass = 'status-warning';
            color = '#f59e0b'; // Orange for high light
        } else if (value < 300) {
            status = 'Low';
            statusClass = 'status-warning';
            color = '#64748b'; // Gray for low light
        }
    }

    return { status, statusClass, color };
}

// ===== DASHBOARD UPDATE FUNCTIONS =====

/**
 * Updates all sensor cards on the dashboard with current readings
 * This function is called on page load and then periodically (every 5 seconds)
 */
function updateDashboard() {
    // Get current sensor data (simulated or from API)
    const data = generateSensorData();
    
    // === UPDATE TEMPERATURE CARD ===
    // Update the displayed temperature value
    const tempValueEl = document.getElementById('temp-value');
    tempValueEl.textContent = data.temperature;
    
    // Determine and update temperature status
    const tempStatus = updateSensorStatus(data.temperature, 'temperature');
    const tempStatusEl = document.getElementById('temp-status');
    tempStatusEl.textContent = tempStatus.status;
    tempStatusEl.className = `sensor-status ${tempStatus.statusClass}`;
    
    // Apply color to temperature value based on health status
    tempValueEl.style.color = tempStatus.color;

    // === UPDATE MOISTURE CARD ===
    // Update the displayed moisture value
    const moistureValueEl = document.getElementById('moisture-value');
    moistureValueEl.textContent = data.moisture;
    
    // Determine and update moisture status
    const moistureStatus = updateSensorStatus(data.moisture, 'moisture');
    const moistureStatusEl = document.getElementById('moisture-status');
    moistureStatusEl.textContent = moistureStatus.status;
    moistureStatusEl.className = `sensor-status ${moistureStatus.statusClass}`;
    
    // Apply color to moisture value based on health status
    moistureValueEl.style.color = moistureStatus.color;

    // === UPDATE LIGHT CARD ===
    // Update the displayed light value
    const lightValueEl = document.getElementById('light-value');
    lightValueEl.textContent = data.light;
    
    // Determine and update light status
    const lightStatus = updateSensorStatus(data.light, 'light');
    const lightStatusEl = document.getElementById('light-status');
    lightStatusEl.textContent = lightStatus.status;
    lightStatusEl.className = `sensor-status ${lightStatus.statusClass}`;
    
    // Apply color to light value based on health status
    lightValueEl.style.color = lightStatus.color;

    // === UPDATE TIMESTAMP ===
    // Update the "Last updated" timestamp in the header
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
}

// ===== HISTORICAL DATA GENERATION =====

function generateHistoricalData() {
    const labels = [];          // Time labels for x-axis
    const tempData = [];        // Temperature data points
    const moistureData = [];    // Moisture data points
    const lightData = [];       // Light data points

    // Generate data for each hour in the past 24 hours
    for (let i = 23; i >= 0; i--) {
        // Create label (e.g., "23h ago", "22h ago", etc.)
        labels.push(`${i}h ago`);
        
        // Generate random data points within wider ranges to show all statuses
        tempData.push(40 + Math.random() * 60);      // 40-100°F
        moistureData.push(10 + Math.random() * 80);  // 10-90%
        lightData.push(100 + Math.random() * 1000);  // 100-1100 lux
    }

    return { labels, tempData, moistureData, lightData };
}

// ===== CHART INITIALIZATION =====

/**
 * Initialize and configure the Chart.js line chart
 * This runs once when the page loads
 */

// Generate historical data
const historicalData = generateHistoricalData();

// Get the canvas context for Chart.js
const ctx = document.getElementById('dataChart').getContext('2d');

// Create the chart instance
const chart = new Chart(ctx, {
    type: 'line',  // Line chart type
    data: {
        labels: historicalData.labels,  // X-axis labels (time)
        datasets: [
            {
                // Temperature dataset
                label: 'Temperature (°F)',
                data: historicalData.tempData,
                borderColor: '#ff6b6b',              // Red line
                backgroundColor: 'rgba(255, 107, 107, 0.1)',  // Light red fill
                tension: 0.4  // Smooth curve
            },
            {
                // Moisture dataset
                label: 'Moisture (%)',
                data: historicalData.moistureData,
                borderColor: '#4ecdc4',              // Teal line
                backgroundColor: 'rgba(78, 205, 196, 0.1)',   // Light teal fill
                tension: 0.4  // Smooth curve
            },
            {
                // Light dataset (divided by 10 for better scale visualization)
                label: 'Light (lux/10)',
                data: historicalData.lightData.map(v => v / 10),
                borderColor: '#ffd93d',              // Yellow line
                backgroundColor: 'rgba(255, 217, 61, 0.1)',   // Light yellow fill
                tension: 0.4  // Smooth curve
            }
        ]
    },
    options: {
        responsive: true,              // Chart resizes with container
        maintainAspectRatio: false,    // Allows custom height
        plugins: {
            legend: {
                display: true,          // Show legend
                position: 'top'         // Legend at top of chart
            }
        },
        scales: {
            y: {
                beginAtZero: true       // Y-axis starts at zero
            }
        }
    }
});

// ===== INITIALIZATION AND UPDATE LOOP =====

/**
 * Initial dashboard update on page load
 */
updateDashboard();

/** Automatic updates every 5 seconds */

setInterval(updateDashboard, 5000);