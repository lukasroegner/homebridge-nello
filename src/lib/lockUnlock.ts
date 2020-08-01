import type { Service, API } from 'homebridge';

/** Leaves the lock unsecured for some time (the lock timeout) */
export const lockUnlock = (service: Service, timeoutMilliseconds: number, api: API): void => {
  const { Characteristic } = api.hap;

  service.setCharacteristic(
    Characteristic.LockCurrentState,
    Characteristic.LockCurrentState.UNSECURED,
  );

  setTimeout(() => {
    service.setCharacteristic(
      Characteristic.LockTargetState,
      Characteristic.LockTargetState.SECURED,
    );
    service.setCharacteristic(
      Characteristic.LockCurrentState,
      Characteristic.LockCurrentState.SECURED,
    );
  }, timeoutMilliseconds);
};
