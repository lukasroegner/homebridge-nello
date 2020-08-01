import type {
  WithUUID,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
} from 'homebridge';
import type {
  Service as HAPService,
} from 'hap-nodejs';
import type { NelloPlatform, AccessoryWithContext } from '../NelloPlatform';
import { getAccessoryService } from '../lib/getAccessoryService';

const removeServiceIfExists = (
  accessory: AccessoryWithContext,
  service: WithUUID<typeof HAPService>,
) => {
  const resolvedService = accessory.getService(service);

  if (resolvedService) {
    accessory.removeService(resolvedService);
  }
};

export const configureAccessory = (
  platform: NelloPlatform,
  accessory: AccessoryWithContext,
): void => {
  const { Characteristic, Service } = platform.api.hap;

  platform.log(`Configuring accessory with location ID ${accessory.context.locationId}.`);

  // Updates the accessory information
  getAccessoryService(accessory, Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'nello.io')
    .setCharacteristic(Characteristic.Model, 'Nello One')
    .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  // Add motion sensor
  if (platform.config.motionSensor) {
    accessory.context.motion = false;
    getAccessoryService(accessory, Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', (callback: CharacteristicGetCallback) => {
        callback(null, Boolean(accessory.context.motion));
      });
  } else {
    removeServiceIfExists(accessory, Service.MotionSensor);
  }

  // Add motion sensor
  if (platform.config.alwaysOpenSwitch) {
    accessory.context.alwaysOpen = accessory.context.alwaysOpen || false;
    getAccessoryService(accessory, Service.Switch)
      .getCharacteristic(Characteristic.On)
      .on('get', (callback: CharacteristicGetCallback) => {
        callback(null, Boolean(accessory.context.alwaysOpen));
      })
      .on('set', (toggle: CharacteristicValue, callback: CharacteristicSetCallback) => {
        accessory.context.alwaysOpen = !!toggle;
        callback();
      });
  } else {
    removeServiceIfExists(accessory, Service.Switch);
  }

  // Sets the default values for reachability and activity
  accessory.context.reachable = true;

  // Updates the lock mechanism
  getAccessoryService(accessory, Service.LockMechanism)
    .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
    .setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)

  // Handles setting the target lock state
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      callback(null);

      // Actually opens the door
      const lockMechanismService = getAccessoryService(accessory, Service.LockMechanism);
      if (value === Characteristic.LockTargetState.UNSECURED) {
        try {
          await platform.open(accessory.context.locationId);
          platform.lockUnlock(lockMechanismService);
        } catch (e) {
          // Updates the reachability and reverts the target state of the lock
          lockMechanismService.setCharacteristic(
            Characteristic.LockTargetState,
            Characteristic.LockTargetState.SECURED,
          );
        }
      }
    });

  // Adds the accessory
  platform.pushAccessory(accessory);
};
