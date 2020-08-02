import type { NelloPlatform, Location } from '../NelloPlatform';
import { WebhookAction } from './processWebhookData';

export const updateWebhook = async (
  platform: NelloPlatform,
  location: Location,
  uri: string,
): Promise<void> => {
  platform.log(`Updating webhook for door with ID ${location.location_id} to ${uri}.`);

  try {
    // https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/add-/-update-webhook
    await platform.client.request(
      'PUT',
      `/locations/${location.location_id}/webhook/`,
      {
        url: uri,
        actions: Object.values(WebhookAction),
      },
    );
    platform.log(`Updated webhook for door with ID ${location.location_id} to ${uri}.`);
  } catch (e) {
    platform.log('Updating webhook failed.');
  }
};
