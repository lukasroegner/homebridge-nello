import type { NelloPlatform, Location } from '../NelloPlatform';

/**
 * Sends a request to the API to open the lock.
 * @param retry Retry signing in and opening the lock if the first attempt fails.
 */
export const open = async (platform: NelloPlatform, location: Location): Promise<void> => {
  try {
    // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/open-door
    await platform.client.request(
      'PUT',
      `/locations/${location.location_id}/open/`,
    );
    platform.log(`Opened door at location with ID ${location.location_id}.`);
  } catch (e) {
    platform.log.warn(`Opening door at location with ID ${location.location_id} failed`);
    throw e;
  }
};
