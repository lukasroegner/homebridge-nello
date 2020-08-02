import express from 'express';
import io from 'socket.io-client';

import type { NelloPlatform } from '../NelloPlatform';
import { SOCKET_BACKEND } from '../config';
import { WebhookData } from '../lib/WebhookData';

import { processWebhookData } from './processWebhookData';

const registerWebhook = (platform: NelloPlatform): Promise<string> => new Promise((resolve) => {
  const app = express();

  app.use(express.json());

  app.put('/', (req, res) => {
    void processWebhookData(platform, req.body);
    res.status(200).send('OK');
  });

  const port = platform.config.common.webhookServerPort;

  app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    resolve(platform.config.common.publicWebhookUrl);
  });
});

const connectToWebhookRelay = (
  platform: NelloPlatform,
): Promise<string> => new Promise((resolve) => {
  const socket = io(SOCKET_BACKEND, { transports: ['websocket'] });

  socket.on('error', (err: any) => {
    platform.log(err);
  });

  socket.on('connect', () => {
    platform.log('Connected to webhook backend.');
    socket.emit('getWebhook');
  });

  socket.on('webhook', (data: { url: string }) => {
    resolve(data.url);
  });

  socket.on('call', (data: WebhookData) => {
    if (data && data.action) {
      void processWebhookData(platform, data);
    }
  });
});

/**
 * Opens connection to the webhook backend.
 */
export const connectWebhook = (platform: NelloPlatform): Promise<string> => {
  if (platform.config.common.publicWebhookUrl) {
    return registerWebhook(platform);
  }

  platform.log('Connecting to webhook relay service');
  return connectToWebhookRelay(platform);
};
