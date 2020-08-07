/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

import { Config } from '../src/config';

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
    dryRun: true,
    dangerouslyEnableAlwaysOpenSwitch: true,
    exposeReachability: true,
    motionSensor: true,
    videoDoorbell: true,
    // 3 minutes
    locationUpdateInterval: 3 * 60 * 1000,
    publicWebhookUrl: getEnv('WEBHOOK_URL'),
  },
  video: {
    debug: true,
    ffmpegBinary: path.resolve(__dirname, '../homebridge-test-storage/ffmpeg'),
  },
};

const randomBetween = (min: number, max: number): number => Math.floor(
  Math.random() * (max - min + 1) + min,
);

// xxx-xx-xxx
const pin = `${randomBetween(100, 999)}-${randomBetween(10, 99)}-${randomBetween(100, 999)}`;
const mac = Array.from({ length: 6 }).map(() => randomBetween(10, 99)).join(':');
const homebridgeConfig = {
  bridge: {
    name: 'HomebridgeNelloTestServer',
    username: mac,
    port: 51826,
    pin,
  },
  platforms: [
    {
      platform: 'NelloPlatform',
      name: 'nello.io',
      ...config,
    },
    {
      platform: 'config',
      name: 'Config',
      port: 8080,
      sudo: false,
    },
  ],
};

fs.writeFileSync(
  path.join(__dirname, '../homebridge-test-storage/config.json'),
  JSON.stringify(homebridgeConfig, null, 2),
  'utf8',
);
