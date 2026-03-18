import spidev
import smbus2
import time

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

# -------- MAIN LOOP --------

try:
    while True:
        soil_value = read_soil(SOIL_CHANNEL)
        light_value = read_light()
        moisture_percent = (soil_value) / (wet_value) * 100
        print("----- Sensor Readings -----")
        print(f"Soil Moisture Raw Value: {soil_value}")
        print("Moisture Level: {:.2f}%".format(moisture_percent))
        print(f"Light Intensity: {light_value:.2f} lux")
        print("---------------------------\n")

        time.sleep(2)

except KeyboardInterrupt:
    print("Program stopped")
