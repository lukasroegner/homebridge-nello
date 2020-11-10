import crypto from 'crypto';

import express from 'express';
import io from 'socket.io-client';

import type { NelloPlatform } from '../NelloPlatform';
import { SOCKET_BACKEND, NELLO_HMAC_HEADER } from '../config';
import { WebhookData } from '../lib/WebhookData';

import { processWebhookData } from './processWebhookData';

export type WebhookHandle = {
  url: string;
  close: VoidFunction;
  /** Pre-Shared HMAC Key */
  key?: string;
};

const validateAndProcessWebhook = (opts: {
  key: string,
  rawBody: string,
  hmacDigestFromRequest?: string,
}, platform: NelloPlatform): void => {
  const calculatedDigest = crypto
    .createHmac('sha256', opts.key)
    .update(opts.rawBody)
    .digest('hex');

  if (opts.hmacDigestFromRequest !== calculatedDigest) {
    platform.log.warn('Received webhook with invalid HMAC authentication', opts.rawBody);
    if (platform.config.common.dryRun) {
      platform.log.warn('ALLOWING WEBHOOK DATA DUE TO DRY-RUN');
    } else {
      platform.log.warn('DISCARDING WEBHOOK DATA');
      return;
    }
  }

  try {
    void processWebhookData(platform, JSON.parse(opts.rawBody) as WebhookData);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    platform.log.warn(`Error processing webhook: ${e}`);
  }
};

const registerWebhook = (
  platform: NelloPlatform,
): void => {
  platform.log('Registering webhook with unique URL and new HMAC key');

  const key = crypto.randomBytes(32).toString('hex');
  const uniqueId = crypto.randomBytes(32).toString('hex');

  const app = express();

  app.use(express.text({ type: '*/*' }));

  app.put<Record<string, string>, unknown, string, unknown>(`/${uniqueId}`, (req, res) => {
    validateAndProcessWebhook({
      key,
      hmacDigestFromRequest: req.header(NELLO_HMAC_HEADER),
      rawBody: req.body,
    }, platform);

    res.status(200).send('OK');
  });

  const port = platform.config.common.webhookServerPort;

  const server = app.listen(port, () => {
    platform.log(`Webhook server listening on port ${port}`);
    void platform.updateWebhooks({
      url: `${platform.config.common.publicWebhookUrl}${uniqueId}`,
      key,
      close: () => {
        platform.log('Closing webhook server');
        server.close();
      },
    });
  });
};

const connectToWebhookRelay = (
  platform: NelloPlatform,
): void => {
  platform.log('Connecting to webhook relay service');

  const socket = io(SOCKET_BACKEND, { transports: ['websocket'] });

  const key = crypto.randomBytes(32).toString('hex');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on('connect_error', (err: any) => {
    platform.log.error(err);
  });

  socket.on('connect', () => {
    platform.log('Connected to webhook backend, requesting webhook');
    socket.emit('getWebhook');
  });

  socket.on('reconnecting', (attempt: number) => {
    platform.log.warn(`Reconnecting to webhook backend, attempt ${attempt}...`);
  });

  socket.on('webhook', (data: { url: string }) => {
    void platform.updateWebhooks({
      url: data.url,
      key,
      close: () => {
        platform.log('Disconnecting from webhook backend');
        socket.close();
      },
    });
  });

  // https://github.com/AlexanderBabel/nello-backend/blob/master/index.js
  socket.on('call', (data: { rawBody: string, hmacSignature?: string }) => {
    validateAndProcessWebhook({
      key,
      hmacDigestFromRequest: data.hmacSignature,
      rawBody: data.rawBody,
    }, platform);
  });
};

/**
 * Opens connection to the webhook backend.
 */
export const connectWebhook = (platform: NelloPlatform): void => {
  if (platform.config.common.publicWebhookUrl) {
    registerWebhook(platform);
  } else {
    connectToWebhookRelay(platform);
  }
};
