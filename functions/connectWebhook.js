const io = require('socket.io-client');

module.exports = function () {
    const platform = this;
    const { Characteristic, Service } = platform;

    const socket = io('https://nello-socket.alexdev.de', { transports: ['websocket'] });
    socket.on('error', function (err) {
        platform.log(err);
    })
    socket.on('connect', function () {
        platform.log('Connected to webhook backend.');
        socket.emit('getWebhook');
    });
    socket.on('webhook', function (data) {
        // Updates the webhooks of all locations
        for (var i = 0; i < platform.locations.length; i++) {
            platform.updateWebhook(platform.locations[i].location_id, data.url, true, function () { });
        }
    });
    socket.on('call', function (data) {
        if (data) {
            if (data.action) {
                if (data.action == "swipe") {
                    platform.log(data.data.name + " opened the door with ID " + data.data.location_id);
                }
                if (data.action == "tw") {
                    platform.log("The door with ID " + data.data.location_id + " has been opened in the time window " + data.data.name + ".");
                }
                if (data.action == "geo") {
                    platform.log(data.data.name + " opened the door with ID " + data.data.location_id + " via geofence.");
                }
                if (data.action == "deny") {
                    platform.log("Someone rang the bell of the door with ID " + data.data.location_id + ".");
                }

                // Gets the corresponding accessory
                var accessory = null;
                for (var i = 0; i < platform.accessories.length; i++) {
                    if (platform.accessories[i].context.locationId == data.data.location_id) {
                        accessory = platform.accessories[i];
                    }
                }
                if (accessory) {
                    if (data.action == "deny") {
                        if (accessory.videoDoorbell) {
                            accessory.videoDoorbell.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0);
                        }
                    } else if (data.action == "tw" || data.action == "geo" || data.action == "swipe") {

                        if (data.action == "swipe" && platform.config.homekitUser == data.data.name) {
                            return;
                        }

                        // Gets the lock state characteristic
                        var lockMechanismService = accessory.getService(Service.LockMechanism);

                        // Leaves the lock unsecured for some time (the lock timeout)
                        lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
                        setTimeout(function () {
                            lockMechanismService.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED);
                            lockMechanismService.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
                        }, platform.config.lockTimeout);
                    }
                } else {
                    platform.log("Fake update of lock with ID " + data.data.location_id + " failed. The lock is not available anymore.");
                }
            }
        }
    });
}