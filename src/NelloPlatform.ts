import type {
  API, DynamicPlatformPlugin, PlatformConfig, PlatformAccessory, Logging, Service,
} from 'homebridge';

import { Config } from './config';

import { open } from './functions/open';
import { updateLocations } from './functions/updateLocations';
import { updateWebhook } from './functions/updateWebhook';
import { updateReachability } from './functions/updateReachability';
import { addAccessory } from './functions/addAccessory';
import { addCamera } from './functions/addCamera';
import { connectWebhook } from './functions/connectWebhook';
import { configureAccessory } from './functions/configureAccessory';
import { removeAccessory } from './functions/removeAccessory';

import { APIClient } from './lib/APIClient';
import { lockUnlock } from './lib/lockUnlock';
import { resolveConfig, ResolvedConfig } from './lib/resolveConfig';

// https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/list-locations
export type Location = {
  location_id: string;
  address: {
    city: string;
    state: string;
    country: string;
    zip: string;
    number: string;
    street: string;
  }
};

export type AccessoryWithContext = PlatformAccessory & {
  context: {
    locationId: string
    motion?: boolean
    alwaysOpen?: boolean
    reachable?: boolean
    videoDoorbell?: PlatformAccessory
  }
};

export class NelloPlatform implements DynamicPlatformPlugin {
  private accessories: PlatformAccessory[] = [];

  private locations: Location[] = [];

  config!: ResolvedConfig;

  client!: APIClient;

  constructor(
    public readonly log: Logging,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    const nelloConfig = config as Partial<Config>;
    const { auth } = nelloConfig;

    if (!api) {
      log.error('Homebridge API not available, please update your homebridge version!');
    }

    const resolvedConfig = resolveConfig(
      nelloConfig,
      (msg: string) => { this.log.error(msg); },
    );

    if (!resolvedConfig) {
      return;
    }

    this.config = resolvedConfig;

    if (!auth?.clientId || !auth?.clientSecret) {
      this.log.error('No clientId and/or clientSecret for nello.io provided.');
      return;
    }

    this.client = new APIClient(
      'https://public-api.nello.io/v1',
      // log
      (message) => {
        this.log(message);
      },
      // onSuccess
      () => { this.updateReachability(); },
      // onError
      (message) => {
        this.log.warn(message);
        this.signOut();
      },
      {
        grant_type: 'client_credentials',
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
      },
    );

    // Subscribes to the event that is raised when homebrige finished loading cached accessories
    this.api.on('didFinishLaunching', async () => {
      this.log('Cached accessories loaded.');

      // Initially updates the locations to get the locks
      await this.updateLocations();

      // Starts the timer for updating locations (i.e. adding and removing locks of the user)
      if (this.config.common.locationUpdateInterval > 0) {
        setInterval(() => {
          void this.updateLocations();
        }, this.config.common.locationUpdateInterval);
      }

      // Connect to backend
      this.connectWebhook();
    });
  }

  // called everytime an API call fails.
  signOut(): void {
    this.client.resetToken();
    this.setLocations([]);
  }

  lockUnlock(service: Service): void {
    lockUnlock(service, this.config.common.lockTimeout, this.api);
  }

  setLocations(locations: Location[]): void {
    this.locations = locations;
  }

  getLocations(): Location[] {
    return this.locations;
  }

  getLocation(locationId: string): Location | undefined {
    return this.getLocations().find((location) => location.location_id === locationId);
  }

  getLocationAccessories(locationId: string): AccessoryWithContext[] {
    return this.getAccessories().filter((a) => a.context.locationId === locationId);
  }

  getLocationAccessory(locationId: string): AccessoryWithContext | undefined {
    return this.getLocationAccessories(locationId)[0];
  }

  getAccessories(): AccessoryWithContext[] {
    return this.accessories as AccessoryWithContext[];
  }

  pushAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }

  replaceAccessories(accessories: PlatformAccessory[]): void {
    this.accessories = accessories;
  }

  async open(locationId: string): Promise<void> {
    const location = this.getLocation(locationId);
    const accessory = this.getLocationAccessory(locationId);

    if (!location || !accessory) {
      this.log(`Opening door at location with ID ${locationId} failed. The location or lock is not available anymore.`);
      return;
    }

    await open(this, location);
  }

  async updateLocations(): Promise<void> {
    await updateLocations(this);
  }

  async updateWebhook(locationId: string, webhookUri: string): Promise<void> {
    const location = this.getLocation(locationId);

    if (!location) {
      this.log(`Updating webhook for ${locationId} failed. The location is not available anymore.`);
      return;
    }

    await updateWebhook(this, location, webhookUri);
  }

  updateReachability(): void {
    updateReachability(this);
  }

  addAccessory(locationId: string): void {
    const location = this.getLocation(locationId);

    if (!location) {
      this.log(`Error while adding new accessory with location ID ${locationId}: not received from nello.io.`);
      return;
    }

    addAccessory(this, location);
  }

  addCamera(accessory: AccessoryWithContext): void {
    addCamera(this, accessory);
  }

  connectWebhook(): void {
    connectWebhook(this);
  }

  /**
   * Configures a previously cached accessory.
   */
  configureAccessory(accessory: AccessoryWithContext): void {
    configureAccessory(this, accessory);
  }

  removeAccessory(locationId: string): void {
    removeAccessory(this, locationId);
  }
}
