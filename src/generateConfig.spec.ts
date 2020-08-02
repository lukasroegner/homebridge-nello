/* eslint-disable no-console */

import path from 'path';
import fs from 'fs';

import { Config } from './config';

const getEnv = (name: string): string => {
  const env = process.env[name];

  if (!env) {
    console.error('Invalid env');
    process.exit(1);
  }

  return env;
};

const config: Config = {
  auth: {
    clientId: getEnv('CLIENT_ID'),
    clientSecret: getEnv('CLIENT_SECRET'),
  },
  common: {
    alwaysOpenSwitch: true,
    exposeReachability: true,
    motionSensor: true,
    videoDoorbell: true,
    publicWebhookUrl: getEnv('WEBHOOK_URL'),
  },
  video: {
    debug: true,
    snapshotImage: `-i ${path.resolve(__dirname, '../assets/nello.png')}`,
    ffmpegBinary: path.resolve(__dirname, '../homebridge-test-storage/ffmpeg'),
  },
};

const randomBetween = (min: number, max: number): number => Math.floor(
  Math.random() * (max - min + 1) + min,
);

// xxx-xx-xxx
const pin = `${randomBetween(100, 999)}-${randomBetween(10, 99)}-${randomBetween(100, 999)}`;

const homebridgeConfig = {
  bridge: {
    name: 'HomebridgeNelloTestServer',
    username: '95:86:53:6E:D9:12',
    port: 51826,
    pin,
  },
  platforms: [
    {
      platform: 'NelloPlatform',
      name: 'nello.io',
      ...config,
    },
  ],
};

fs.writeFileSync(
  path.join(__dirname, '../homebridge-test-storage/config.json'),
  JSON.stringify(homebridgeConfig),
  'utf8',
);
