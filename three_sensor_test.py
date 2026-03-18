import spidev
import smbus2
import time
import glob

# -------- SPI SETUP (MCP3008 for soil sensor) --------
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1350000

wet_value = 600
SOIL_CHANNEL = 0  # MCP3008 channel where soil sensor is connected

def read_soil(channel):
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    value = ((adc[1] & 3) << 8) + adc[2]
    return value

# -------- I2C SETUP (Light sensor) --------
bus = smbus2.SMBus(1)
LIGHT_ADDRESS = 0x23  # change to 0x5C if needed

def read_light():
    bus.write_byte(LIGHT_ADDRESS, 0x20)
    time.sleep(0.2)
    data = bus.read_i2c_block_data(LIGHT_ADDRESS, 0x00, 2)
    lux = (data[0] << 8 | data[1]) / 1.2
    return lux

# -------- 1-WIRE SETUP (Temperature Sensor) --------
base_dir = '/sys/bus/w1/devices/'
device_folder = glob.glob(base_dir + '28-*')[0]
device_file = device_folder + '/w1_slave'

def read_temp():
    with open(device_file, 'r') as f:
        lines = f.readlines()

    if lines[0].strip()[-3:] != 'YES':
        return None

    equals_pos = lines[1].find('t=')
    if equals_pos != -1:
        temp_string = lines[1][equals_pos+2:]
        temp_c = float(temp_string) / 1000.0
        return temp_c

# -------- MAIN LOOP --------

try:
    while True:
        soil_value = read_soil(SOIL_CHANNEL)
        soil_percent = (soil_value/wet_value) * 100
        light_value = read_light()
        temp_value = read_temp()

        print("----- Sensor Readings -----")
        print(f"Soil Moisture Raw Value: {soil_value}")
        print(f"Soil Moisture Percentage: {soil_percent:.2f}%")
        print(f"Light Intensity: {light_value:.2f} lux")
        if temp_value is not None:
            print(f"Temperature: {temp_value:.2f} °C")
        else:
            print("Temperature: Error reading")
        print("---------------------------\n")

        time.sleep(2)

except KeyboardInterrupt:
    print("Program stopped")
