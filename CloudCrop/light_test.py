import smbus2
import time

DEVICE_ADDRESS = 0x23  # Change to 0x5C if needed
bus = smbus2.SMBus(1)

def read_light():
    # Trigger one-time high resolution measurement
    bus.write_byte(DEVICE_ADDRESS, 0x20)
    time.sleep(0.2)

    data = bus.read_i2c_block_data(DEVICE_ADDRESS, 0x00, 2)
    lux = (data[0] << 8 | data[1]) / 1.2
    return lux

try:
    while True:
        lux = read_light()
        print(f"Light Intensity: {lux:.2f} lux")
        time.sleep(1)

except KeyboardInterrupt:
    print("Stopping...")
