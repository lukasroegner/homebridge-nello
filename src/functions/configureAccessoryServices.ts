import type {
  Service as HAPService,
} from 'hap-nodejs';
import type {
  WithUUID,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
} from 'homebridge';

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

export const configureAccessoryServices = (
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
  if (platform.config.common.motionSensor) {
    accessory.context.motion = false;
    getAccessoryService(accessory, Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', (callback: CharacteristicGetCallback) => {
        callback(null, Boolean(accessory.context.motion));
      });
  } else {
    removeServiceIfExists(accessory, Service.MotionSensor);
  }

  // Add switch
  if (platform.config.common.dangerouslyEnableAlwaysOpenSwitch) {
    accessory.context.alwaysOpen = accessory.context.alwaysOpen || false;
    getAccessoryService(accessory, Service.Switch)
      .getCharacteristic(Characteristic.On)
      .on('get', (callback: CharacteristicGetCallback) => {
        callback(null, Boolean(accessory.context.alwaysOpen));
      })
      .on('set', (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        const alwaysOpen = !!value;
        if (alwaysOpen) {
          platform.log('Switch change: homebridge will open for any ring');
        } else {
          platform.log('Switch change: homebridge will NOT open for any ring');
        }
        accessory.context.alwaysOpen = alwaysOpen;
        callback();
      });
  } else {
    removeServiceIfExists(accessory, Service.Switch);
  }

  // Initial value
  accessory.context.reachable = true;

  // Updates the lock mechanism
  getAccessoryService(accessory, Service.LockMechanism)
    .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
    .setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)

  // Handles setting the target lock state
    .getCharacteristic(Characteristic.LockTargetState)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on('set', async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      callback(null);

      // Actually opens the door
      const lockMechanismService = getAccessoryService(accessory, Service.LockMechanism);
      if (value === Characteristic.LockTargetState.UNSECURED) {
        try {
          await platform.open(accessory.context.locationId);
          platform.simulateLockUnlock(lockMechanismService);
        } catch (e) {
          // Updates the reachability and reverts the target state of the lock
          lockMechanismService.setCharacteristic(
            Characteristic.LockTargetState,
            Characteristic.LockTargetState.SECURED,
          );
        }
      }
    });
};
