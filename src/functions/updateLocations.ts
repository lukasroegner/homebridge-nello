import type { NelloPlatform } from '../NelloPlatform';
import { Location } from '../lib/Location';

/**
 * Sends a request to the API to get all locations.
 */
export const updateLocations = async (platform: NelloPlatform): Promise<Location[]> => {
  const locations = await platform.client.getLocations();

  // Remove homebridge accessories that do not exist on the API
  platform.getAccessories().forEach((accessory) => {
    if (!locations.some(((location) => location.location_id === accessory.context.locationId))) {
      platform.removeAccessory(accessory.context.locationId);
    }
  });

  // Add new accessories
  locations.forEach((location) => {
    const accessory = platform.getLocationAccessory(location.location_id)
    ?? platform.createAccessory(location);

    if (platform.config.common.videoDoorbell && !platform.getVideoDoorbell(location.location_id)) {
      platform.createOrUpdateCamera(location, accessory);
    }
  });

  return locations;
};
