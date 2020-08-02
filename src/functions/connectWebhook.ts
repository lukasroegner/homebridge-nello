import express from 'express';
import io from 'socket.io-client';

import type { NelloPlatform } from '../NelloPlatform';
import { SOCKET_BACKEND } from '../config';
import { processWebhookData, WebhookData } from './processWebhookData';

const registerWebhook = (platform: NelloPlatform) => {
  const app = express();

  app.use(express.json());

  app.put('/', (req, res) => {
    void processWebhookData(platform, req.body);
    res.status(200).send('OK');
  });

  const port = platform.config.common.webhookServerPort;

  app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    platform.getLocations().forEach((location) => {
      void platform.updateWebhook(
        location.location_id,
        platform.config.common.publicWebhookUrl,
      );
    });
  });
};

const connectToWebhookRelay = (platform: NelloPlatform) => {
  const socket = io(SOCKET_BACKEND, { transports: ['websocket'] });

  socket.on('error', (err: any) => {
    platform.log(err);
  });

  socket.on('connect', () => {
    platform.log('Connected to webhook backend.');
    socket.emit('getWebhook');
  });

  socket.on('webhook', (data: { url: string }) => {
    platform.getLocations().forEach((location) => {
      void platform.updateWebhook(location.location_id, data.url);
    });
  });

  socket.on('call', (data: WebhookData) => {
    if (data && data.action) {
      void processWebhookData(platform, data);
    }
  });
};

/**
 * Opens connection to the webhook backend.
 */
export const connectWebhook = (platform: NelloPlatform): void => {
  if (platform.config.common.publicWebhookUrl) {
    registerWebhook(platform);
  } else {
    platform.log('Connecting to webhook relay service');
    connectToWebhookRelay(platform);
  }
};
