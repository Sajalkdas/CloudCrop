import spidev
import time

# Open SPI bus
spi = spidev.SpiDev()
spi.open(0, 0)  # Bus 0, CE0
spi.max_speed_hz = 1350000

def read_channel(channel):
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    data = ((adc[1] & 3) << 8) + adc[2]
    return data

try:
    while True:
        moisture_value = read_channel(0)
        print("Soil Moisture Raw Value:", moisture_value)

        # Convert to percentage (optional)
        wet_value = 530
        dry_value = 0

        moisture_percent = (moisture_value) / (wet_value - dry_value) * 100
        # moisture_percent = max(0, min(100, moisture_percent))

        print("Moisture Level: {:.2f}%".format(moisture_percent))
        print("------------------------")

        time.sleep(2)

except KeyboardInterrupt:
    spi.close()
