import type { NelloPlatform } from '../NelloPlatform';
import { getAccessoryService } from '../lib/getAccessoryService';

/**
 * Updates the reachability of all locks. This is based on the current sign in state.
 */
export const updateReachability = (platform: NelloPlatform): void => {
  const { Characteristic, Service } = platform.api.hap;

  platform.getAccessories().forEach((accessory) => {
    const lockCurrentStateCharacteristic = getAccessoryService(accessory, Service.LockMechanism)
      .getCharacteristic(Characteristic.LockCurrentState);

    if (!lockCurrentStateCharacteristic) {
      return;
    }

    if (platform.client.isSignedIn()) {
      // If the user is signed in, the value of the characteristic should
      // only be updated when it is unknown
      if (!accessory.context.reachable) {
        lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
      }
    } else if (platform.config.common.exposeReachability) {
      // If the user is not signed in, the lock state should be unknown
      lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.UNKNOWN);
    } else {
      lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
    }

    // Updates the reachable variable
    accessory.context.reachable = platform.client.isSignedIn();
  });
};
