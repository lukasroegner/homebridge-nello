import express from 'express';
import io from 'socket.io-client';
import { v4 as uuid } from 'uuid';

import type { NelloPlatform } from '../NelloPlatform';
import { SOCKET_BACKEND } from '../config';
import { WebhookData } from '../lib/WebhookData';

import { processWebhookData } from './processWebhookData';

type WebhookHandle = { url: string; close: VoidFunction };

const registerWebhook = (
  platform: NelloPlatform,
): Promise<WebhookHandle> => new Promise((resolve) => {
  const app = express();

  const uniqueId = uuid();

  app.use(express.json());

  app.put(`/${uniqueId}`, (req, res) => {
    void processWebhookData(platform, req.body);
    res.status(200).send('OK');
  });

  const port = platform.config.common.webhookServerPort;

  const server = app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    resolve({
      url: `${platform.config.common.publicWebhookUrl}${uniqueId}`,
      close: () => {
        platform.log('Closing webhook server');
        server.close();
      },
    });
  });
});

const connectToWebhookRelay = (
  platform: NelloPlatform,
): Promise<WebhookHandle> => new Promise((resolve) => {
  const socket = io(SOCKET_BACKEND, { transports: ['websocket'] });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on('error', (err: any) => {
    platform.log(err);
  });

  socket.on('connect', () => {
    platform.log('Connected to webhook backend.');
    socket.emit('getWebhook');
  });

  socket.on('webhook', (data: { url: string }) => {
    resolve({
      url: data.url,
      close: () => {
        platform.log('Disconnecting from webhook backend');
        socket.close();
      },
    });
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
export const connectWebhook = (platform: NelloPlatform): Promise<WebhookHandle> => {
  if (platform.config.common.publicWebhookUrl) {
    return registerWebhook(platform);
  }

  platform.log('Connecting to webhook relay service');
  return connectToWebhookRelay(platform);
};
