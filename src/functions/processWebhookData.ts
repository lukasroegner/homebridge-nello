import type { NelloPlatform } from '../NelloPlatform';
import { WebhookData, WebhookAction } from '../lib/WebhookData';
import { getAccessoryService } from '../lib/getAccessoryService';

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

  const videoDoorbell = platform.getVideoDoorbell(data.data.location_id);

  const lockMechanismService = getAccessoryService(accessory, Service.LockMechanism);

  switch (data.action) {
    case WebhookAction.HomeZoneUnlock:
    case WebhookAction.TimeWindow:
      platform.simulateLockUnlock(lockMechanismService);
      break;

    case WebhookAction.Swipe:
      if (platform.config.common.homekitUser !== data.data.name) {
        platform.simulateLockUnlock(lockMechanismService);
      }
      break;

    case WebhookAction.DidNotOpen:
      if (accessory.context.alwaysOpen) {
        try {
          await platform.open(accessory.context.locationId);
          platform.simulateLockUnlock(lockMechanismService);
        } catch (error) {
          lockMechanismService.setCharacteristic(
            Characteristic.LockTargetState,
            Characteristic.LockTargetState.SECURED,
          );
        }
        return;
      }

      if (videoDoorbell) {
        getAccessoryService(videoDoorbell, Service.Doorbell)
          .getCharacteristic(
            Characteristic.ProgrammableSwitchEvent,
          ).setValue(0);
      }

      // Trigger the motion sensor
      if (platform.config.common.motionSensor) {
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
        }, platform.config.common.motionTimeout);
      }

      break;

    default:
      break;
  }
};
