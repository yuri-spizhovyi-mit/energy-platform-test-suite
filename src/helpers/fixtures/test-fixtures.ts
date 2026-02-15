import { Device, DeviceBuilder, DeviceType, DeviceStatus } from '../builders/device-builder';
import { EnergyReading, ReadingBuilder, ReadingQuality } from '../builders/reading-builder';

export class TestFixtures {
  static createStandardDeviceSet(): Device[] {
    return [
      new DeviceBuilder()
        .withName('Solar Panel Array 1')
        .asSolarPanel()
        .withLocation('Building A - Roof')
        .build(),
      
      new DeviceBuilder()
        .withName('Wind Turbine 1')
        .asWindTurbine()
        .withLocation('Field North')
        .build(),
      
      new DeviceBuilder()
        .withName('Battery Storage 1')
        .asBattery()
        .withLocation('Building A - Basement')
        .build(),
      
      new DeviceBuilder()
        .withName('EV Charger 1')
        .asEVCharger()
        .withLocation('Parking Lot A')
        .build(),
      
      new DeviceBuilder()
        .withName('Smart Meter 1')
        .withLocation('Building A - Main')
        .build(),
    ];
  }

  static createDeviceWithHistory(readingCount: number = 100): { device: Device; readings: EnergyReading[] } {
    const device = new DeviceBuilder().build();
    const readings = new ReadingBuilder()
      .withDeviceId(device.id)
      .buildTimeSeries(readingCount, 15);
    
    return { device, readings };
  }

  static createMaintenanceScenario(): { device: Device; readings: EnergyReading[] } {
    const device = new DeviceBuilder()
      .withName('Maintenance Device')
      .inMaintenance()
      .build();
    
    // No recent readings due to maintenance
    const readings = new ReadingBuilder()
      .withDeviceId(device.id)
      .daysAgo(7)
      .buildMany(10);
    
    return { device, readings };
  }

  static createAnomalyScenario(): { device: Device; readings: EnergyReading[] } {
    const device = new DeviceBuilder().build();
    
    const normalReadings = new ReadingBuilder()
      .withDeviceId(device.id)
      .buildTimeSeries(20, 15);
    
    const anomalyReading = new ReadingBuilder()
      .withDeviceId(device.id)
      .withAbnormalValue()
      .build();
    
    return {
      device,
      readings: [...normalReadings, anomalyReading],
    };
  }

  static createMultiDeviceScenario(deviceCount: number = 5): Array<{ device: Device; readings: EnergyReading[] }> {
    return Array.from({ length: deviceCount }, (_, i) => {
      const device = new DeviceBuilder()
        .withName(`Device ${i + 1}`)
        .build();
      
      const readings = new ReadingBuilder()
        .withDeviceId(device.id)
        .buildTimeSeries(50, 15);
      
      return { device, readings };
    });
  }

  static createPoorQualityReadings(deviceId: string, count: number = 10): EnergyReading[] {
    return Array.from({ length: count }, () =>
      new ReadingBuilder()
        .withDeviceId(deviceId)
        .withPoorQuality()
        .build()
    );
  }

  static createEstimatedReadings(deviceId: string, count: number = 10): EnergyReading[] {
    return Array.from({ length: count }, () =>
      new ReadingBuilder()
        .withDeviceId(deviceId)
        .asEstimated()
        .build()
    );
  }

  static createDailyAggregateData(deviceId: string, days: number = 30): EnergyReading[] {
    const readings: EnergyReading[] = [];
    
    for (let i = 0; i < days; i++) {
      // Create 96 readings per day (15-minute intervals)
      const dailyReadings = new ReadingBuilder()
        .withDeviceId(deviceId)
        .daysAgo(i)
        .buildTimeSeries(96, 15);
      
      readings.push(...dailyReadings);
    }
    
    return readings;
  }

  static createSolarGenerationPattern(deviceId: string): EnergyReading[] {
    const readings: EnergyReading[] = [];
    const baseDate = new Date();
    
    // Simulate 24 hours of solar generation
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(baseDate);
      date.setHours(hour);
      
      let value = 0;
      
      // Solar generation pattern (peak at noon)
      if (hour >= 6 && hour <= 18) {
        const hourFromNoon = Math.abs(12 - hour);
        value = 5.5 * (1 - hourFromNoon / 6); // Max 5.5 kW at noon
      }
      
      readings.push(
        new ReadingBuilder()
          .withDeviceId(deviceId)
          .atTime(date)
          .withValue(value)
          .build()
      );
    }
    
    return readings;
  }

  static createBatteryChargeDischargePattern(deviceId: string): EnergyReading[] {
    const readings: EnergyReading[] = [];
    const baseDate = new Date();
    
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(baseDate);
      date.setHours(hour);
      
      let value = 0;
      
      // Charge during day (negative), discharge at night (positive)
      if (hour >= 9 && hour <= 16) {
        value = -3.5; // Charging
      } else if (hour >= 18 && hour <= 22) {
        value = 4.0; // Discharging
      }
      
      readings.push(
        new ReadingBuilder()
          .withDeviceId(deviceId)
          .atTime(date)
          .withValue(value)
          .build()
      );
    }
    
    return readings;
  }

  static createHighLoadScenario(deviceId: string): EnergyReading[] {
    return Array.from({ length: 100 }, () =>
      new ReadingBuilder()
        .withDeviceId(deviceId)
        .withValue(Math.random() * 500 + 500) // 500-1000 kWh
        .build()
    );
  }

  static createZeroConsumptionScenario(deviceId: string, count: number = 10): EnergyReading[] {
    return Array.from({ length: count }, () =>
      new ReadingBuilder()
        .withDeviceId(deviceId)
        .withZeroValue()
        .build()
    );
  }
}
