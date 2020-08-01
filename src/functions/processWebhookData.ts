import type { NelloPlatform } from '../NelloPlatform';
import { getAccessoryService } from '../lib/getAccessoryService';

// https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/add-/-update-webhook

export enum WebhookAction {
  /** When the door opens */
  Swipe = 'swipe',
  /** When the door is opened because of the Homezone Unlock feature (with a bell ring) */
  HomeZoneUnlock = 'geo',
  /** When the door is opened because of a Time Window (with a bell ring) */
  TimeWindow = 'tw',
  /** When nello detects a bell ring, but neither a Time Window
   * nor a Homezone Event caused the door to be opened, */
  DidNotOpen = 'deny',
}

export type WebhookData = {
  action: WebhookAction
  data: {
    location_id: string
    name: string
  }
} | {
  action: WebhookAction.DidNotOpen
  data: {
    location_id: string
  }
};

export const processWebhookData = async (
  platform: NelloPlatform,
  data: WebhookData,
): Promise<void> => {
  const { Characteristic, Service } = platform.api.hap;

  switch (data.action) {
    case WebhookAction.Swipe:
      platform.log(`${data.data.name} opened the door with ID ${data.data.location_id}`);
      break;
    case WebhookAction.TimeWindow:
      platform.log(`The door with ID ${data.data.location_id} has been opened in the time window ${data.data.name}.`);
      break;
    case WebhookAction.HomeZoneUnlock:
      platform.log(`${data.data.name} opened the door with ID ${data.data.location_id} via geofence.`);
      break;
    case WebhookAction.DidNotOpen:
      platform.log(`Someone rang the bell of the door with ID ${data.data.location_id}.`);
      break;
    default:
      break;
  }

  const accessory = platform.getLocationAccessory(data.data.location_id);

  if (!accessory) {
    platform.log(`Fake update of lock with ID ${data.data.location_id} failed. The lock is not available anymore.`);
    return;
  }

  const lockMechanismService = getAccessoryService(accessory, Service.LockMechanism);

  switch (data.action) {
    case WebhookAction.HomeZoneUnlock:
    case WebhookAction.TimeWindow:
      platform.lockUnlock(lockMechanismService);
      break;

    case WebhookAction.Swipe:
      if (platform.config.homekitUser !== data.data.name) {
        platform.lockUnlock(lockMechanismService);
      }
      break;

    case WebhookAction.DidNotOpen:
      if (accessory.context.alwaysOpen) {
        try {
          await platform.open(accessory.context.locationId);
          platform.lockUnlock(lockMechanismService);
        } catch (error) {
          lockMechanismService.setCharacteristic(
            Characteristic.LockTargetState,
            Characteristic.LockTargetState.SECURED,
          );
        }
        return;
      }

      if (accessory.context.videoDoorbell) {
        getAccessoryService(accessory.context.videoDoorbell, Service.Doorbell).getCharacteristic(
          Characteristic.ProgrammableSwitchEvent,
        ).setValue(0);
      }

      // Trigger the motion sensor
      if (platform.config.motionSensor) {
        const motionSensorService = getAccessoryService(accessory, Service.MotionSensor);
        accessory.context.motion = true;
        motionSensorService.setCharacteristic(
          Characteristic.MotionDetected,
          true,
        );
        setTimeout(() => {
          accessory.context.motion = false;
          motionSensorService.setCharacteristic(
            Characteristic.MotionDetected,
            false,
          );
        }, platform.config.motionTimeout);
      }

      break;

    default:
      break;
  }
};
