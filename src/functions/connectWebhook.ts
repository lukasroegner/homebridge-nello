import crypto from 'crypto';

import express from 'express';
import io from 'socket.io-client';

import type { NelloPlatform } from '../NelloPlatform';
import { SOCKET_BACKEND, NELLO_HMAC_HEADER } from '../config';
import { WebhookData } from '../lib/WebhookData';

import { processWebhookData } from './processWebhookData';

type WebhookHandle = {
  url: string;
  close: VoidFunction;
  /** Pre-Shared HMAC Key */
  key?: string;
};

const registerWebhook = (
  platform: NelloPlatform,
): Promise<WebhookHandle> => new Promise((resolve) => {
  platform.log('Registering webhook with unique URL and new HMAC key');

  const key = crypto.randomBytes(32).toString('hex');
  const uniqueId = crypto.randomBytes(32).toString('hex');

  const app = express();

  const blockUnauthenticated = (body: string): boolean => {
    const shouldBlock = !platform.config.common.dryRun;

    const message = shouldBlock ? 'DISCARDING' : 'ALLOWING DUE TO DRY-RUN';

    platform.log.warn(`Received webhook with invalid HMAC authentication, ${message}`, body);

    return shouldBlock;
  };

  app.use(express.text({ type: '*/*' }));

  app.put<Record<string, string>, unknown, string, unknown>(`/${uniqueId}`, (req, res) => {
    const hmacDigestFromRequest = req.header(NELLO_HMAC_HEADER);
    const jsonString = req.body;

    if (!hmacDigestFromRequest && blockUnauthenticated(jsonString)) {
      res.status(200).send('OK');
      return;
    }

    const calculatedHmacDigest = crypto
      .createHmac('sha256', key)
      .update(jsonString)
      .digest('hex');

    if (hmacDigestFromRequest !== calculatedHmacDigest && blockUnauthenticated(jsonString)) {
      res.status(200).send('OK');
      return;
    }

    try {
      void processWebhookData(platform, JSON.parse(jsonString));
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      platform.log.warn(`Error processing webhook: ${e}`);
    }

    res.status(200).send('OK');
  });

  const port = platform.config.common.webhookServerPort;

  const server = app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    resolve({
      url: `${platform.config.common.publicWebhookUrl}${uniqueId}`,
      key,
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
