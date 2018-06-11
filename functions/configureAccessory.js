module.exports = function (accessory) {
    const platform = this;
    const { Characteristic, Service } = platform;

    platform.log("Configuring accessory with location ID " + accessory.context.locationId + ".");

    // Updates the accessory information
    var accessoryInformationService = accessory.getService(Service.AccessoryInformation);
    accessoryInformationService.setCharacteristic(Characteristic.Manufacturer, "nello.io")
    accessoryInformationService.setCharacteristic(Characteristic.Model, "Nello One")
    accessoryInformationService.setCharacteristic(Characteristic.SerialNumber, accessory.context.locationId);

    // Updates the lock mechanism
    var lockMechanismService = accessory.getService(Service.LockMechanism);
    lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);

    // Sets the default values for reachability and activity
    accessory.context.reachable = true;

    // Handles setting the target lock state
    lockMechanismService.getCharacteristic(Characteristic.LockTargetState).on('set', function (value, callback) {
        callback(null);

        // Actually opens the door
        if (value == Characteristic.LockTargetState.UNSECURED) {
            platform.open(accessory.context.locationId, true, function (result) {
                if (result) {

                    // Leaves the lock unsecured for some time (the lock timeout)
                    lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
                    setTimeout(function () {
                        lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
                        lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
                    }, platform.config.lockTimeout);
                } else {

                    // Updates the reachability and reverts the target state of the lock
                    lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
                    platform.updateReachability();
                }
            });
        }
    });

    // Adds the accessory
    platform.accessories.push(accessory);
}