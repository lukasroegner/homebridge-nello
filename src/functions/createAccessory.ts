import type {
  NelloPlatform, AccessoryWithContext,
} from '../NelloPlatform';
import { PLUGIN_NAME, PLATFORM_NAME } from '../config';
import { Location } from '../lib/Location';

export const createAccessory = (
  platform: NelloPlatform,
  location: Location,
): AccessoryWithContext => {
  const { uuid: UUIDGen } = platform.api.hap;
  const PlatformAccessory = platform.api.platformAccessory;

  platform.log(`Adding new accessory with location ID ${location.location_id}.`);

  const accessoryName = `${location.address.street} ${location.address.number}, ${location.address.city}`;
  platform.log(`Accessory name for location ID ${location.location_id} is ${accessoryName}.`);

  const accessory = new PlatformAccessory(
    accessoryName,
    UUIDGen.generate(location.location_id),
  ) as AccessoryWithContext;

  accessory.context.locationId = location.location_id;
  accessory.context.reachable = true;

  platform.configureAccessoryServices(accessory);

  platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  platform.log(`Accessory for location with ID ${location.location_id} added.`);

  return accessory;
};
