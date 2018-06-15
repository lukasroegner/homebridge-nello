module.exports = function (locationId) {
    const platform = this;
    const { Service, UUIDGen, Accessory } = platform;

    // Gets the corresponding location object
    platform.log("Adding new accessory with location ID " + locationId + ".");
    var location = null;
    for (var i = 0; i < platform.locations.length; i++) {
        if (platform.locations[i].location_id == locationId) {
            location = platform.locations[i];
        }
    }

    // Checks if the location has been found
    if (!location) {
        platform.log("Error while adding new accessory with location ID " + locationId + ": not received from nello.io.");
        return;
    }

    // Creates the name for the accessory
    var accessoryName = location.address.street + ", " + location.address.city;
    platform.log("Accessory name for location ID " + locationId + " is " + accessoryName + ".");

    // Creates the new accessory
    var accessory = new Accessory(accessoryName, UUIDGen.generate(accessoryName));
    accessory.context.locationId = locationId;
    accessory.context.reachable = true;

    // Creates the lock mechanism service for the accessory
    accessory.addService(Service.LockMechanism, accessoryName);

    // configures the accessory
    platform.configureAccessory(accessory);

    // Adds the accessory
    platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
    platform.log("Accessory for location with ID " + locationId + " added.");

    platform.addCamera(accessory);
}