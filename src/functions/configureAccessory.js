module.exports = function configureAccessory(accessory) {
  const platform = this;
  const { Characteristic, Service } = platform;

  accessory.service = function accessoryService(service) {
    if (this.getService(service)) {
      return this.getService(service);
    }
    return this.addService(service);
  };

  platform.log(`Configuring accessory with location ID ${accessory.context.locationId}.`);

  // Updates the accessory information
  accessory.service(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, 'nello.io')
    .setCharacteristic(Characteristic.Model, 'Nello One')
    .setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

  // Add motion sensor
  if (platform.config.motionSensor) {
    accessory.context.motion = false;
    accessory.service(Service.MotionSensor)
      .getCharacteristic(Characteristic.MotionDetected)
      .on('get', (callback) => {
        callback(null, Boolean(accessory.context.motion));
      });
  } else if (accessory.getService(Service.MotionSensor)) {
    accessory.removeService(accessory.getService(Service.MotionSensor));
  }

  // Add motion sensor
  if (platform.config.alwaysOpenSwitch) {
    accessory.context.alwaysOpen = accessory.context.alwaysOpen || false;
    accessory.service(Service.Switch)
      .getCharacteristic(Characteristic.On)
      .on('get', (callback) => {
        callback(null, Boolean(accessory.context.alwaysOpen));
      })
      .on('set', (toggle, callback) => {
        accessory.context.alwaysOpen = !!toggle;
        callback();
      });
  } else if (accessory.getService(Service.Switch)) {
    accessory.removeService(accessory.getService(Service.Switch));
  }

  // Sets the default values for reachability and activity
  accessory.context.reachable = true;

  // Updates the lock mechanism
  accessory.service(Service.LockMechanism)
    .setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
    .setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)

  // Handles setting the target lock state
    .getCharacteristic(Characteristic.LockTargetState)
    .on('set', (value, callback) => {
      callback(null);

      // Actually opens the door
      const lockMechanismService = accessory.service(Service.LockMechanism);
      if (value === Characteristic.LockTargetState.UNSECURED) {
        platform.open(accessory.context.locationId, true, (result) => {
          if (result) {
            // Leaves the lock unsecured for some time (the lock timeout)
            lockMechanismService.setCharacteristic(
              Characteristic.LockCurrentState,
              Characteristic.LockCurrentState.UNSECURED,
            );
            setTimeout(() => {
              lockMechanismService.setCharacteristic(
                Characteristic.LockTargetState,
                Characteristic.LockTargetState.SECURED,
              );
              lockMechanismService.setCharacteristic(
                Characteristic.LockCurrentState,
                Characteristic.LockCurrentState.SECURED,
              );
            }, platform.config.lockTimeout);
          } else {
            // Updates the reachability and reverts the target state of the lock
            lockMechanismService.setCharacteristic(
              Characteristic.LockTargetState,
              Characteristic.LockTargetState.SECURED,
            );
            platform.updateReachability();
          }
        });
      }
    });

  // Adds the accessory
  platform.accessories.push(accessory);
};
