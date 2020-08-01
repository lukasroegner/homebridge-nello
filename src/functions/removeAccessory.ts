import type { PlatformAccessory } from 'homebridge';
import type { NelloPlatform, AccessoryWithContext } from '../NelloPlatform';
import { PLATFORM_NAME, PLUGIN_NAME } from '../config';

export const removeAccessory = (platform: NelloPlatform, locationId: string): void => {
  // Initializes the lists for remaining and removed accessories
  platform.log(`Removing accessory with location ID ${locationId}`);

  const remainingAccessories: AccessoryWithContext[] = [];
  const removedAccessories: PlatformAccessory[] = [];

  // Adds the accessories to the two lists
  platform.getAccessories().forEach((accessory) => {
    if (accessory.context.locationId === locationId) {
      removedAccessories.push(accessory);
      if (accessory.context.videoDoorbell) {
        removedAccessories.push(accessory.context.videoDoorbell);
      }
    } else {
      remainingAccessories.push(accessory);
    }
  });

  // Removes the accessories
  if (removedAccessories.length > 0) {
    platform.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, removedAccessories);
    platform.replaceAccessories(remainingAccessories);
    platform.log(`${removedAccessories.length} accessories removed.`);
  }
};
