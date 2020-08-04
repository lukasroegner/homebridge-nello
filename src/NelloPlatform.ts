import type {
  API, DynamicPlatformPlugin, PlatformConfig, PlatformAccessory, Logging, Service,
} from 'homebridge';

import { Config, PLUGIN_NAME, PLATFORM_NAME } from './config';
import { configureAccessoryServices } from './functions/configureAccessoryServices';
import { connectWebhook, WebhookHandle } from './functions/connectWebhook';
import { createAccessory } from './functions/createAccessory';
import { createOrUpdateCamera } from './functions/createOrUpdateCamera';
import { updateLocations } from './functions/updateLocations';
import { updateReachability } from './functions/updateReachability';
import { APIClient } from './lib/APIClient';
import { Location } from './lib/Location';
import { resolveConfig, ResolvedConfig } from './lib/resolveConfig';
import { simulateLockUnlock } from './lib/simulateLockUnlock';

export type AccessoryWithContext = Omit<PlatformAccessory, 'context'> & {
  context: {
    locationId: string
    motion?: boolean
    alwaysOpen?: boolean
    reachable?: boolean
  }
};

export class NelloPlatform implements DynamicPlatformPlugin {
  private accessories: Record<string, AccessoryWithContext> = {};

  private videoDoorbells: Record<string, PlatformAccessory> = {};

  private locations: Location[] = [];

  private closeWebhook: VoidFunction | undefined;

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

    if (this.config.common.dryRun) {
      this.log.warn('Operating in dry-run mode. The door will not be opened physically');
    }

    if (!auth?.clientId || !auth?.clientSecret) {
      this.log.error('No clientId and/or clientSecret for nello.io provided.');
      return;
    }

    this.client = new APIClient(
      this.log,
      {
        grant_type: 'client_credentials',
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
      },
      (reachable) => { updateReachability(this, reachable); },
    );

    // Subscribes to the event that is raised when homebrige finished loading cached accessories
    this.api.on('didFinishLaunching', () => {
      this.log('Cached accessories loaded.');
      void this.setup();
    });

    this.api.on('shutdown', () => {
      this.closeWebhook?.();
    });
  }

  private async setup(nextDelayMinutes = 1) {
    // Initially updates the locations to get the locks
    try {
      await this.updateLocations();
      this.connectWebhook();
    } catch (e) {
      this.log.error(`Setup failed, retrying in ${nextDelayMinutes} minute(s)`);
      setTimeout(() => {
        void this.setup(nextDelayMinutes + 1);
      }, nextDelayMinutes * 60 * 1000);
      return;
    }

    // Starts the timer for updating locations (i.e. adding and removing locks of the user)
    if (this.config.common.locationUpdateInterval > 0) {
      setInterval(() => {
        void this.updateLocations().catch(() => {});
      }, this.config.common.locationUpdateInterval);

      setInterval(() => {
        this.connectWebhook();
      }, this.config.common.webhookUpdateInterval);
    }
  }

  private async updateLocations(): Promise<void> {
    this.locations = await updateLocations(this);
  }

  connectWebhook(): void {
    this.closeWebhook?.();
    connectWebhook(this);
  }

  async updateWebhooks(handle: WebhookHandle): Promise<void> {
    this.closeWebhook = handle.close;

    await Promise.all(
      this.getLocations().map((location) => this.updateWebhook(location, handle.url, handle.key)),
    );
  }

  private async updateWebhook(
    location: Location,
    webhookUri: string,
    hmacKey?: string,
  ): Promise<void> {
    this.log(`Updating webhook for door with ID ${location.location_id} to ${webhookUri}.`);
    try {
      await this.client.updateWebhook(location, webhookUri, hmacKey);
    } catch (e) {
      // already logged by client
    }
  }

  getLocations(): Location[] {
    return this.locations;
  }

  getLocation(locationId: string): Location | undefined {
    return this.getLocations().find((location) => location.location_id === locationId);
  }

  getLocationAccessory(locationId: string): AccessoryWithContext | undefined {
    return this.accessories[locationId];
  }

  getAccessories(): AccessoryWithContext[] {
    return Object.values(this.accessories);
  }

  addVideoDoorbell(location: Location, doorbell: PlatformAccessory): void {
    this.videoDoorbells[location.location_id] = doorbell;
  }

  getVideoDoorbell(locationId: string): PlatformAccessory | undefined {
    return this.videoDoorbells[locationId];
  }

  simulateLockUnlock(service: Service): void {
    simulateLockUnlock(service, this.config.common.lockTimeout, this.api);
  }

  async open(locationId: string): Promise<void> {
    const location = this.getLocation(locationId);
    const accessory = this.getLocationAccessory(locationId);

    if (!location || !accessory) {
      this.log(`Opening door at location with ID ${locationId} failed. The location or lock is not available anymore.`);
      return;
    }

    if (this.config.common.dryRun) {
      this.log(`DRY-RUN (Not Executed): Opened door at location with ID ${location.location_id}.`);
      return;
    }

    try {
      await this.client.openLocation(location);
      this.log(`Opened door at location with ID  ${location.location_id}.`);
    } catch (e) {
      this.log.warn(`Opening door at location with ID ${location.location_id} failed`);
    }
  }

  createAccessory(location: Location): AccessoryWithContext {
    const accessory = createAccessory(this, location);
    this.accessories[location.location_id] = accessory;
    return accessory;
  }

  createOrUpdateCamera(location: Location, accessory: AccessoryWithContext): void {
    createOrUpdateCamera(this, location, accessory);
  }

  removeAccessory(locationId: string): void {
    this.log(`Removing accessory with location ID ${locationId}`);
    if (this.accessories[locationId]) {
      delete this.accessories[locationId];
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
        this.accessories[locationId],
      ]);
      this.log(`Removed accessory with location ID ${locationId}`);
    }
  }

  /**
   * Configures a previously cached accessory.
   */
  configureAccessory(accessory: AccessoryWithContext): void {
    this.accessories[accessory.context.locationId] = accessory;
    this.configureAccessoryServices(accessory);
  }

  // also called from createAccessory
  configureAccessoryServices(accessory: AccessoryWithContext): void {
    configureAccessoryServices(this, accessory);
  }
}
