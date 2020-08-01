import type { NelloPlatform, Location, AccessoryWithContext } from '../NelloPlatform';
import { PLUGIN_NAME, PLATFORM_NAME } from '../config';

export const addAccessory = (platform: NelloPlatform, location: Location): void => {
  const { uuid: UUIDGen } = platform.api.hap;
  const PlatformAccessory = platform.api.platformAccessory;

  platform.log(`Adding new accessory with location ID ${location.location_id}.`);

  const accessoryName = `${location.address.street} ${location.address.city}`;
  platform.log(`Accessory name for location ID ${location.location_id} is ${accessoryName}.`);

  const accessory = new PlatformAccessory(
    accessoryName,
    UUIDGen.generate(accessoryName),
  ) as AccessoryWithContext;

  accessory.context.locationId = location.location_id;
  accessory.context.reachable = true;

  platform.configureAccessory(accessory);

  platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  platform.log(`Accessory for location with ID ${location.location_id} added.`);

  platform.addCamera(accessory);
};
