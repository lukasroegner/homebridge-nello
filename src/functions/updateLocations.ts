import type { NelloPlatform, Location } from '../NelloPlatform';

/**
 * Sends a request to the API to get all locations.
 */
export const updateLocations = async (platform: NelloPlatform): Promise<void> => {
  platform.log('Getting locations from nello.io.');

  try {
    // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/list-locations
    const response = await platform.client.request<{ data: Location[] }>('GET', '/locations/');

    if (!response || !response.data) {
      platform.log.warn(`Getting locations from nello.io failed. Could not get locations from response: ${JSON.stringify(response)}`);
    }

    platform.setLocations(response.data);

    // Remove homebridge accessories that do not exist on the API
    platform.getAccessories().forEach((accessory) => {
      const location = platform.getLocation(accessory.context.locationId);

      if (!location) {
        platform.removeAccessory(accessory.context.locationId);
      }
    });

    // Add new accessories
    platform.getLocations().forEach((location) => {
      const accessories = platform.getLocationAccessories(location.location_id);

      if (accessories.length === 0) {
        platform.addAccessory(location.location_id);
      }

      // Fetch again before adding
      platform.getLocationAccessories(location.location_id).forEach((accessory) => {
        platform.addCamera(accessory);
      });
    });

    platform.log('Got locations from nello.io.');
  } catch (e) {
    platform.log.warn('Getting locations from nello.io failed');
  }
};
