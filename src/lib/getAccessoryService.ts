import type { PlatformAccessory, WithUUID } from 'homebridge';
import type { Service as HAPService } from 'hap-nodejs';

export const getAccessoryService = (
  accessory: PlatformAccessory,
  service: WithUUID<typeof HAPService>,
): HAPService => accessory.getService(service) ?? accessory.addService(service);
