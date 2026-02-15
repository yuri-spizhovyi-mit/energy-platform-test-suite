export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  location: string;
  status: DeviceStatus;
  installDate: string;
  metadata?: Record<string, any>;
}

export enum DeviceType {
  SOLAR_PANEL = 'SOLAR_PANEL',
  WIND_TURBINE = 'WIND_TURBINE',
  BATTERY = 'BATTERY',
  SMART_METER = 'SMART_METER',
  EV_CHARGER = 'EV_CHARGER',
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export class DeviceBuilder {
  private device: Device;

  constructor() {
    this.device = {
      id: this.generateId(),
      name: `Device-${Math.floor(Math.random() * 1000)}`,
      type: DeviceType.SMART_METER,
      location: 'Building A - Floor 1',
      status: DeviceStatus.ACTIVE,
      installDate: new Date().toISOString(),
    };
  }

  withId(id: string): this {
    this.device.id = id;
    return this;
  }

  withName(name: string): this {
    this.device.name = name;
    return this;
  }

  withType(type: DeviceType): this {
    this.device.type = type;
    return this;
  }

  withLocation(location: string): this {
    this.device.location = location;
    return this;
  }

  withStatus(status: DeviceStatus): this {
    this.device.status = status;
    return this;
  }

  withInstallDate(date: string): this {
    this.device.installDate = date;
    return this;
  }

  withMetadata(metadata: Record<string, any>): this {
    this.device.metadata = metadata;
    return this;
  }

  asSolarPanel(): this {
    this.device.type = DeviceType.SOLAR_PANEL;
    this.device.metadata = {
      capacity: 5.5, // kW
      efficiency: 0.18,
      panelCount: 20,
    };
    return this;
  }

  asWindTurbine(): this {
    this.device.type = DeviceType.WIND_TURBINE;
    this.device.metadata = {
      capacity: 2.5, // MW
      rotorDiameter: 90, // meters
      hubHeight: 80, // meters
    };
    return this;
  }

  asBattery(): this {
    this.device.type = DeviceType.BATTERY;
    this.device.metadata = {
      capacity: 13.5, // kWh
      maxCharge: 5, // kW
      maxDischarge: 5, // kW
      currentCharge: 0.8, // 80%
    };
    return this;
  }

  asEVCharger(): this {
    this.device.type = DeviceType.EV_CHARGER;
    this.device.metadata = {
      maxPower: 11, // kW
      connectorType: 'Type 2',
      supportsFastCharge: true,
    };
    return this;
  }

  inMaintenance(): this {
    this.device.status = DeviceStatus.MAINTENANCE;
    return this;
  }

  inactive(): this {
    this.device.status = DeviceStatus.INACTIVE;
    return this;
  }

  withError(): this {
    this.device.status = DeviceStatus.ERROR;
    this.device.metadata = {
      ...this.device.metadata,
      errorCode: 'E001',
      errorMessage: 'Communication timeout',
    };
    return this;
  }

  build(): Device {
    return { ...this.device };
  }

  buildMany(count: number): Device[] {
    return Array.from({ length: count }, (_, i) => {
      const builder = new DeviceBuilder();
      builder.device.name = `${this.device.name}-${i + 1}`;
      return builder.build();
    });
  }

  private generateId(): string {
    // Generate ID in EAGLE-200-XXXXX format for mock server compatibility
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `EAGLE-200-${randomNum}`;
  }
}
