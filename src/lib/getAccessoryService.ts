import type { Service as HAPService } from 'hap-nodejs';
import type { PlatformAccessory, WithUUID } from 'homebridge';

export const getAccessoryService = (
  accessory: PlatformAccessory,
  service: WithUUID<typeof HAPService>,
): HAPService => accessory.getService(service) ?? accessory.addService(service);
