module.exports = function addAccessory(locationId) {
  const platform = this;
  const { UUIDGen, Accessory } = platform;

  platform.log(`Adding new accessory with location ID ${locationId}.`);

  const location = platform.locations.find((loc) => loc.location_id === locationId);

  if (!location) {
    platform.log(`Error while adding new accessory with location ID ${locationId}: not received from nello.io.`);
    return;
  }

  const accessoryName = `${location.address.street} ${location.address.city}`;
  platform.log(`Accessory name for location ID ${locationId} is ${accessoryName}.`);

  const accessory = new Accessory(accessoryName, UUIDGen.generate(accessoryName));
  accessory.context.locationId = locationId;
  accessory.context.reachable = true;

  platform.configureAccessory(accessory);

  platform.api.registerPlatformAccessories(platform.pluginName, platform.platformName, [accessory]);
  platform.log(`Accessory for location with ID ${locationId} added.`);

  platform.addCamera(accessory);
};
