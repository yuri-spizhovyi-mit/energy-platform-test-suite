import { DeviceBuilder, DeviceType, DeviceStatus } from './device-builder';
import { ReadingBuilder, ReadingQuality } from './reading-builder';

describe('Test Builders', () => {
  describe('DeviceBuilder', () => {
    it('should create a device with default values', () => {
      const device = new DeviceBuilder().build();

      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('type');
      expect(device).toHaveProperty('location');
      expect(device).toHaveProperty('status');
      expect(device).toHaveProperty('installDate');
    });

    it('should create a device with custom values', () => {
      const device = new DeviceBuilder()
        .withName('Test Device')
        .withType(DeviceType.SOLAR_PANEL)
        .withLocation('Test Location')
        .withStatus(DeviceStatus.ACTIVE)
        .build();

      expect(device.name).toBe('Test Device');
      expect(device.type).toBe(DeviceType.SOLAR_PANEL);
      expect(device.location).toBe('Test Location');
      expect(device.status).toBe(DeviceStatus.ACTIVE);
    });

    it('should create a solar panel device', () => {
      const device = new DeviceBuilder().asSolarPanel().build();

      expect(device.type).toBe(DeviceType.SOLAR_PANEL);
      expect(device.metadata).toHaveProperty('capacity');
      expect(device.metadata).toHaveProperty('efficiency');
      expect(device.metadata).toHaveProperty('panelCount');
    });

    it('should create a wind turbine device', () => {
      const device = new DeviceBuilder().asWindTurbine().build();

      expect(device.type).toBe(DeviceType.WIND_TURBINE);
      expect(device.metadata).toHaveProperty('capacity');
      expect(device.metadata).toHaveProperty('rotorDiameter');
      expect(device.metadata).toHaveProperty('hubHeight');
    });

    it('should create a battery device', () => {
      const device = new DeviceBuilder().asBattery().build();

      expect(device.type).toBe(DeviceType.BATTERY);
      expect(device.metadata).toHaveProperty('capacity');
      expect(device.metadata).toHaveProperty('maxCharge');
      expect(device.metadata).toHaveProperty('maxDischarge');
      expect(device.metadata).toHaveProperty('currentCharge');
    });

    it('should create an EV charger device', () => {
      const device = new DeviceBuilder().asEVCharger().build();

      expect(device.type).toBe(DeviceType.EV_CHARGER);
      expect(device.metadata).toHaveProperty('maxPower');
      expect(device.metadata).toHaveProperty('connectorType');
      expect(device.metadata).toHaveProperty('supportsFastCharge');
    });

    it('should create multiple devices', () => {
      const devices = new DeviceBuilder().buildMany(5);

      expect(devices).toHaveLength(5);
      devices.forEach((device) => {
        expect(device).toHaveProperty('id');
        expect(device).toHaveProperty('name');
      });
    });

    it('should create device in maintenance status', () => {
      const device = new DeviceBuilder().inMaintenance().build();

      expect(device.status).toBe(DeviceStatus.MAINTENANCE);
    });

    it('should create inactive device', () => {
      const device = new DeviceBuilder().inactive().build();

      expect(device.status).toBe(DeviceStatus.INACTIVE);
    });

    it('should create device with error', () => {
      const device = new DeviceBuilder().withError().build();

      expect(device.status).toBe(DeviceStatus.ERROR);
      expect(device.metadata).toHaveProperty('errorCode');
      expect(device.metadata).toHaveProperty('errorMessage');
    });
  });

  describe('ReadingBuilder', () => {
    it('should create a reading with default values', () => {
      const reading = new ReadingBuilder().build();

      expect(reading).toHaveProperty('id');
      expect(reading).toHaveProperty('deviceId');
      expect(reading).toHaveProperty('value');
      expect(reading).toHaveProperty('unit');
      expect(reading).toHaveProperty('timestamp');
      expect(reading).toHaveProperty('quality');
    });

    it('should create a reading with custom values', () => {
      const reading = new ReadingBuilder()
        .withDeviceId('device-123')
        .withValue(150.5)
        .withUnit('kWh')
        .withQuality(ReadingQuality.GOOD)
        .build();

      expect(reading.deviceId).toBe('device-123');
      expect(reading.value).toBe(150.5);
      expect(reading.unit).toBe('kWh');
      expect(reading.quality).toBe(ReadingQuality.GOOD);
    });

    it('should create reading in megawatts', () => {
      const reading = new ReadingBuilder().inMegawatts().build();

      expect(reading.unit).toBe('MWh');
      expect(reading.value).toBeGreaterThan(0);
    });

    it('should create reading in watts', () => {
      const reading = new ReadingBuilder().inWatts().build();

      expect(reading.unit).toBe('Wh');
      expect(reading.value).toBeGreaterThan(0);
    });

    it('should create estimated reading', () => {
      const reading = new ReadingBuilder().asEstimated().build();

      expect(reading.quality).toBe(ReadingQuality.ESTIMATED);
      expect(reading.metadata).toHaveProperty('estimationMethod');
      expect(reading.metadata).toHaveProperty('confidence');
    });

    it('should create reading with poor quality', () => {
      const reading = new ReadingBuilder().withPoorQuality().build();

      expect(reading.quality).toBe(ReadingQuality.POOR);
      expect(reading.metadata).toHaveProperty('reason');
    });

    it('should create reading from hours ago', () => {
      const reading = new ReadingBuilder().hoursAgo(2).build();
      const timestamp = new Date(reading.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThanOrEqual(1.9);
      expect(hoursDiff).toBeLessThanOrEqual(2.1);
    });

    it('should create reading from days ago', () => {
      const reading = new ReadingBuilder().daysAgo(7).build();
      const timestamp = new Date(reading.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);

      expect(daysDiff).toBeGreaterThanOrEqual(6.9);
      expect(daysDiff).toBeLessThanOrEqual(7.1);
    });

    it('should create abnormal reading', () => {
      const reading = new ReadingBuilder().withAbnormalValue().build();

      expect(reading.value).toBeGreaterThan(1000);
      expect(reading.metadata).toHaveProperty('anomaly');
      expect(reading.metadata?.anomaly).toBe(true);
    });

    it('should create negative reading', () => {
      const reading = new ReadingBuilder().withNegativeValue().build();

      expect(reading.value).toBeLessThan(0);
      expect(reading.metadata).toHaveProperty('note');
    });

    it('should create zero reading', () => {
      const reading = new ReadingBuilder().withZeroValue().build();

      expect(reading.value).toBe(0);
      expect(reading.metadata).toHaveProperty('note');
    });

    it('should create multiple readings', () => {
      const readings = new ReadingBuilder().buildMany(10);

      expect(readings).toHaveLength(10);
      readings.forEach((reading) => {
        expect(reading).toHaveProperty('id');
        expect(reading).toHaveProperty('deviceId');
      });
    });

    it('should create time series readings', () => {
      const readings = new ReadingBuilder()
        .withDeviceId('device-123')
        .buildTimeSeries(5, 15);

      expect(readings).toHaveLength(5);
      
      // All readings should have the same device ID
      readings.forEach((reading) => {
        expect(reading.deviceId).toBe('device-123');
      });

      // Timestamps should be 15 minutes apart
      for (let i = 1; i < readings.length; i++) {
        const prev = new Date(readings[i - 1].timestamp);
        const curr = new Date(readings[i].timestamp);
        const diffMinutes = (curr.getTime() - prev.getTime()) / (1000 * 60);
        expect(diffMinutes).toBe(15);
      }
    });
  });
});
