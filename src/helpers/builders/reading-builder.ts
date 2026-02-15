export interface EnergyReading {
  id: string;
  deviceId: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: ReadingQuality;
  metadata?: Record<string, any>;
}

export enum ReadingQuality {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  ESTIMATED = 'estimated',
}

export class ReadingBuilder {
  private reading: EnergyReading;

  constructor() {
    this.reading = {
      id: this.generateId(),
      deviceId: `EAGLE-200-${Math.floor(10000 + Math.random() * 90000)}`,
      value: this.randomValue(50, 200),
      unit: 'kWh',
      timestamp: new Date().toISOString(),
      quality: ReadingQuality.GOOD,
    };
  }

  withId(id: string): this {
    this.reading.id = id;
    return this;
  }

  withDeviceId(deviceId: string): this {
    this.reading.deviceId = deviceId;
    return this;
  }

  withValue(value: number): this {
    this.reading.value = value;
    return this;
  }

  withUnit(unit: string): this {
    this.reading.unit = unit;
    return this;
  }

  withTimestamp(timestamp: string): this {
    this.reading.timestamp = timestamp;
    return this;
  }

  withQuality(quality: ReadingQuality): this {
    this.reading.quality = quality;
    return this;
  }

  withMetadata(metadata: Record<string, any>): this {
    this.reading.metadata = metadata;
    return this;
  }

  inMegawatts(): this {
    this.reading.unit = 'MWh';
    this.reading.value = this.randomValue(1, 10);
    return this;
  }

  inWatts(): this {
    this.reading.unit = 'Wh';
    this.reading.value = this.randomValue(1000, 10000);
    return this;
  }

  asEstimated(): this {
    this.reading.quality = ReadingQuality.ESTIMATED;
    this.reading.metadata = {
      ...this.reading.metadata,
      estimationMethod: 'linear-interpolation',
      confidence: 0.85,
    };
    return this;
  }

  withPoorQuality(): this {
    this.reading.quality = ReadingQuality.POOR;
    this.reading.metadata = {
      ...this.reading.metadata,
      reason: 'sensor-drift',
    };
    return this;
  }

  atTime(date: Date): this {
    this.reading.timestamp = date.toISOString();
    return this;
  }

  hoursAgo(hours: number): this {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    this.reading.timestamp = date.toISOString();
    return this;
  }

  daysAgo(days: number): this {
    const date = new Date();
    date.setDate(date.getDate() - days);
    this.reading.timestamp = date.toISOString();
    return this;
  }

  withAbnormalValue(): this {
    this.reading.value = this.randomValue(1000, 10000); // Abnormally high
    this.reading.metadata = {
      ...this.reading.metadata,
      anomaly: true,
      anomalyScore: 0.95,
    };
    return this;
  }

  withNegativeValue(): this {
    this.reading.value = -Math.abs(this.randomValue(10, 100));
    this.reading.metadata = {
      ...this.reading.metadata,
      note: 'Energy generation (negative consumption)',
    };
    return this;
  }

  withZeroValue(): this {
    this.reading.value = 0;
    this.reading.metadata = {
      ...this.reading.metadata,
      note: 'No consumption detected',
    };
    return this;
  }

  build(): EnergyReading {
    return { ...this.reading };
  }

  buildMany(count: number): EnergyReading[] {
    return Array.from({ length: count }, (_, i) => {
      const builder = new ReadingBuilder();
      builder.reading.deviceId = this.reading.deviceId;
      
      // Create readings at 15-minute intervals
      const date = new Date(this.reading.timestamp);
      date.setMinutes(date.getMinutes() - (i * 15));
      builder.reading.timestamp = date.toISOString();
      
      return builder.build();
    });
  }

  buildTimeSeries(count: number, intervalMinutes: number = 15): EnergyReading[] {
    const startDate = new Date(this.reading.timestamp);
    
    return Array.from({ length: count }, (_, i) => {
      const builder = new ReadingBuilder();
      builder.reading.deviceId = this.reading.deviceId;
      
      const date = new Date(startDate);
      date.setMinutes(date.getMinutes() + (i * intervalMinutes));
      builder.reading.timestamp = date.toISOString();
      
      // Add some variation to values
      builder.reading.value = this.reading.value + this.randomValue(-20, 20);
      
      return builder.build();
    });
  }

  private generateId(): string {
    return `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private randomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
