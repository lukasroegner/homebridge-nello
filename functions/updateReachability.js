module.exports = function () {
    const platform = this;
    const { Characteristic, Service } = platform;

    // Updates the reachability
    for (var i = 0; i < platform.accessories.length; i++) {
        var lockCurrentStateCharacteristic = platform.accessories[i].getService(Service.LockMechanism).getCharacteristic(Characteristic.LockCurrentState);

        // If the user is not signed in, the lock state should be unknown
        if (!platform.token) {
            if (platform.config.exposeReachability) {
                lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.UNKNOWN);
            } else {
                lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
            }
        }

        // If the user is signed in, the value of the characteristic should only be updated when it is unknown
        if (platform.token && !platform.accessories[i].context.reachable) {
            lockCurrentStateCharacteristic.setValue(Characteristic.LockCurrentState.SECURED);
        }

        // Updates the reachable variable
        platform.accessories[i].context.reachable = !!platform.token;
    }
}