module.exports = function updateReachability() {
  const platform = this;
  const { Characteristic, Service } = platform;

  platform.accessories.forEach((accessory) => {
    const lockCurrentStateCharacteristic = accessory
      .getService(Service.LockMechanism)
      .getCharacteristic(Characteristic.LockCurrentState);

    // If the user is not signed in, the lock state should be unknown
    if (!platform.token) {
      if (platform.config.exposeReachability) {
        lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.UNKNOWN);
      } else {
        lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
      }
    }

    // If the user is signed in, the value of the characteristic should
    // only be updated when it is unknown
    if (platform.token && !accessory.context.reachable) {
      lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
    }

    // Updates the reachable variable
    accessory.context.reachable = !!platform.token;
  });
};
