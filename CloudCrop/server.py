"""
CloudCrop - Raspberry Pi Sensor Server
=======================================
Reads all three hardware sensors and serves the data as a JSON REST API.
Also serves the dashboard's static files (index.html, style.css, script.js)
so everything runs from a single process on the Pi.

Hardware:
  - Soil Moisture : MCP3008 ADC via SPI   (channel 0)
  - Light         : BH1750 via I2C        (address 0x23 or 0x5C)
  - Temperature   : DS18B20 via 1-Wire

API Endpoints:
  GET /sensors      → latest sensor readings as JSON
  GET /             → serves index.html

Usage:
  pip install flask spidev smbus2
  python server.py

  Then open http://<pi-ip>:5000 in a browser.

Author: Sajal Das
Modified: 3/25/2026
"""

import glob
import time
import threading

import spidev
import smbus2
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder='.')


# ===== SPI SETUP — Soil Moisture (MCP3008) =====

spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1350000

SOIL_CHANNEL = 0    # MCP3008 channel the soil sensor is wired to
WET_VALUE    = 600  # Raw ADC reading that represents 100 % saturation

def read_soil(channel=SOIL_CHANNEL):
    """
    Reads the MCP3008 ADC on the given channel and returns the raw 10-bit
    value (0–1023). Values are typically 0–950 for a capacitive soil sensor.
    """
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    return ((adc[1] & 3) << 8) + adc[2]


# ===== I2C SETUP — Light Sensor (BH1750) =====

bus          = smbus2.SMBus(1)
LIGHT_ADDR   = 0x23   # Use 0x5C if ADDR pin is pulled HIGH

def read_light():
    """
    Issues a one-time high-resolution measurement command to the BH1750
    and returns the ambient light level in lux (float).
    Returns None on I2C error.
    """
    try:
        bus.write_byte(LIGHT_ADDR, 0x20)   # One-time H-res mode
        time.sleep(0.2)
        data = bus.read_i2c_block_data(LIGHT_ADDR, 0x00, 2)
        return (data[0] << 8 | data[1]) / 1.2
    except Exception as e:
        print(f"Light sensor error: {e}")
        return None


# ===== 1-WIRE SETUP — Temperature Sensor (DS18B20) =====

def _find_device_file():
    """Locates the DS18B20 sysfs device file at startup."""
    matches = glob.glob('/sys/bus/w1/devices/28-*')
    if not matches:
        raise RuntimeError("DS18B20 not found. Check wiring and ensure "
                           "1-Wire is enabled in /boot/config.txt.")
    return matches[0] + '/w1_slave'

DEVICE_FILE = _find_device_file()

def read_temp_c():
    """
    Reads the DS18B20 raw file and returns temperature in °C (float).
    Returns None if the CRC check fails or the file is unreadable.
    """
    try:
        with open(DEVICE_FILE, 'r') as f:
            lines = f.readlines()
        if lines[0].strip()[-3:] != 'YES':
            return None
        eq = lines[1].find('t=')
        return float(lines[1][eq + 2:]) / 1000.0 if eq != -1 else None
    except Exception as e:
        print(f"Temperature sensor error: {e}")
        return None

def celsius_to_fahrenheit(c):
    """Converts Celsius to Fahrenheit."""
    return round(c * 9 / 5 + 32, 1)


# ===== SENSOR CACHE =====
# Readings are cached so the API responds instantly even while sensors are
# being polled in a background thread.

_cache = {
    'temperature': None,   # °F
    'moisture':    None,   # raw ADC value (0–950)
    'light':       None,   # lux
    'error':       None,   # last error message, or None
    'timestamp':   None    # ISO-8601 string of last successful read
}
_cache_lock = threading.Lock()

def _poll_sensors():
    """
    Background thread: reads all three sensors every 2 seconds and updates
    the shared cache.
    """
    while True:
        soil  = read_soil()
        light = read_light()
        temp_c = read_temp_c()

        with _cache_lock:
            _cache['moisture']    = soil
            _cache['light']       = round(light, 2) if light is not None else None
            _cache['temperature'] = celsius_to_fahrenheit(temp_c) if temp_c is not None else None
            _cache['error']       = None if (light and temp_c) else 'One or more sensors unavailable'
            _cache['timestamp']   = time.strftime('%Y-%m-%dT%H:%M:%S')

        time.sleep(2)

# Start background polling thread (daemon so it exits when main process exits)
_poll_thread = threading.Thread(target=_poll_sensors, daemon=True)
_poll_thread.start()


# ===== FLASK ROUTES =====

@app.route('/sensors')
def sensors():
    """
    GET /sensors

    Returns the latest sensor readings as JSON.

    Response shape:
    {
        "temperature": 72.5,    // °F, or null on error
        "moisture":    420,     // raw ADC 0–950, or null on error
        "light":       348.5,   // lux, or null on error
        "error":       null,    // error string or null
        "timestamp":   "2026-03-10T14:22:01"
    }

    The JavaScript dashboard converts:
      - moisture raw → % using (raw / 950 * 100)
    """
    with _cache_lock:
        data = dict(_cache)
    return jsonify(data)

@app.route('/')
def index():
    """Serves the dashboard HTML."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serves static assets (style.css, script.js, historical_chart.png, etc.)."""
    return send_from_directory('.', filename)


# ===== ENTRY POINT =====

if __name__ == '__main__':
    # host='0.0.0.0' makes the server reachable from other devices on the network
    # Access the dashboard at http://<raspberry-pi-ip>:5000
    print("CloudCrop sensor server starting...")
    print("Dashboard: http://<your-pi-ip>:5000")
    print("Sensor API: http://<your-pi-ip>:5000/sensors")
    app.run(host='0.0.0.0', port=5000, debug=False)