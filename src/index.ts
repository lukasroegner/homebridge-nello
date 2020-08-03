import type { API } from 'homebridge';

import { NelloPlatform } from './NelloPlatform';
import { PLUGIN_NAME, PLATFORM_NAME } from './config';

export = (homebridge: API): void => {
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, NelloPlatform);
};
